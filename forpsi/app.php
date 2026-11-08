<?php
declare(strict_types=1);
require __DIR__ . '/storage.php';
require __DIR__ . '/validation.php';
require __DIR__ . '/mail.php';
require __DIR__ . '/auth.php';
require __DIR__ . '/render.php';

final class HttpError extends RuntimeException { public function __construct(public int $status, string $message) { parent::__construct($message); } }
function fail(int $status, string $message): never { throw new HttpError($status, $message); }
function cfg(): array { return $GLOBALS['zuby_config']; }
function admin_accounts_ready(): bool {
    $users = cfg()['users'] ?? null;
    if (!is_array($users) || count($users) < 1) return false;
    foreach ($users as $username => $account) {
        if (!is_string($username) || $username === '' || !is_array($account)
            || empty($account['password_hash'])
            || !filter_var($account['otp_to'] ?? '', FILTER_VALIDATE_EMAIL)) return false;
    }
    return true;
}
function local_test(): bool {
    return !empty(cfg()['local_test']) && PHP_SAPI === 'cli-server'
        && in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1', '::1'], true)
        && parse_url(cfg()['origin'], PHP_URL_HOST) === '127.0.0.1';
}
function esc(mixed $s): string { return htmlspecialchars((string)$s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
function json_response(array $data, int $status = 200): never {
    http_response_code($status); header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_THROW_ON_ERROR); exit;
}
function redirect(string $url): never { header('Location: ' . $url, true, 303); exit; }
function read_json(int $limit): array {
    if (!str_starts_with($_SERVER['CONTENT_TYPE'] ?? '', 'application/json')) fail(415, 'Očekávána JSON data.');
    $raw = file_get_contents('php://input', false, null, 0, $limit + 1);
    if (strlen($raw) > $limit) fail(413, 'Požadavek je příliš velký.');
    try { return obj(json_decode($raw, true, 512, JSON_THROW_ON_ERROR)); }
    catch (JsonException) { fail(400, 'Neplatná data.'); }
}
function upload_photo(): never {
    require_user(); check_csrf(); rate_limit('upload:' . $_SESSION['user'], 60, 3600);
    $f = $_FILES['file'] ?? null;
    if (!$f || $f['error'] !== UPLOAD_ERR_OK || $f['size'] < 12 || $f['size'] > 4000000 || !is_uploaded_file($f['tmp_name'])) fail(422, 'Nahrajte JPG, PNG nebo WebP do 4 MB.');
    $type = (new finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']);
    $types = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
    $info = @getimagesize($f['tmp_name']);
    if (!isset($types[$type]) || !$info || ($info['mime'] ?? '') !== $type || $info[0] * $info[1] > 24000000 || max($info[0], $info[1]) > 12000) fail(422, 'Neplatný obrázek nebo příliš vysoké rozlišení (max. 24 Mpx).');
    // Decode and re-encode: removes EXIF, injected payloads and spoofed file contents.
    $image = @imagecreatefromstring(file_get_contents($f['tmp_name']));
    if (!$image) fail(422, 'Obrázek nelze načíst.');
    $key = bin2hex(random_bytes(20)) . '.webp';
    if (max($info[0], $info[1]) > 2400) {
        $ratio = 2400 / max($info[0], $info[1]);
        $scaled = imagescale($image, (int)round($info[0] * $ratio), (int)round($info[1] * $ratio));
        imagedestroy($image); $image = $scaled;
    }
    imagealphablending($image, false); imagesavealpha($image, true);
    $ok = imagewebp($image, cfg()['data_dir'] . '/media/' . $key, 88); imagedestroy($image);
    if (!$ok) throw new RuntimeException('upload');
    json_response(['src' => '/api/media/' . $key]);
}
function zuby_run(): void {
    $path = rtrim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/', '/') ?: '/';
    try {
        header('Cache-Control: no-store'); header('X-Content-Type-Options: nosniff'); header('Referrer-Policy: same-origin');
        $configFile = getenv('ZUBY_CONFIG') ?: __DIR__ . '/config.php';
        if (!is_file($configFile)) fail(503, 'Backend ještě není nastavený. Správce musí doplnit soukromou konfiguraci.');
        $GLOBALS['zuby_config'] = require $configFile;
        if (strlen(cfg()['app_key'] ?? '') < 32) fail(503, 'Dokončete nastavení backendu.');
        if (!empty(cfg()['local_test']) && !local_test()) fail(503, 'Testovací konfiguraci nelze použít na veřejném webu.');
        $origin = cfg()['origin']; $host = parse_url($origin, PHP_URL_HOST);
        $expectedHost = $host . (parse_url($origin, PHP_URL_PORT) ? ':' . parse_url($origin, PHP_URL_PORT) : '');
        if (($_SERVER['HTTP_HOST'] ?? '') !== $expectedHost) fail(400, 'Neplatná doména.');
        if (!local_test() && (parse_url($origin, PHP_URL_SCHEME) !== 'https' || ($_SERVER['HTTPS'] ?? '') !== 'on')) fail(400, 'Použijte HTTPS.');
        if (!is_dir(cfg()['data_dir']) && !mkdir(cfg()['data_dir'], 0700, true)) throw new RuntimeException('data directory');
        $dataPath = str_replace('\\', '/', realpath(cfg()['data_dir']));
        $publicPath = str_replace('\\', '/', realpath($_SERVER['DOCUMENT_ROOT']));
        if ($dataPath === $publicPath || str_starts_with($dataPath, $publicPath . '/')) fail(503, 'Úložiště musí být mimo veřejnou složku webu.');
        foreach (['sessions', 'media', 'mail'] as $d) if (!is_dir(cfg()['data_dir'] . '/' . $d)) mkdir(cfg()['data_dir'] . '/' . $d, 0700);
        header("Content-Security-Policy: default-src 'self'; script-src 'self' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self' https://www.google.com/recaptcha/ https://us-central1-zubydasne-b19d4.cloudfunctions.net; frame-src https://www.google.com https://recaptcha.google.com https://maps.google.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
        ini_set('session.use_strict_mode', '1'); ini_set('session.use_only_cookies', '1'); ini_set('session.gc_maxlifetime', '28800');
        session_save_path(cfg()['data_dir'] . '/sessions'); session_name(local_test() ? 'zuby_session' : '__Host-zuby_session');
        session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'secure' => !local_test(), 'httponly' => true, 'samesite' => 'Strict']);
        session_start();
        $method = $_SERVER['REQUEST_METHOD'];
        if (!in_array($method, ['GET','HEAD'], true)) {
            if (($_SERVER['HTTP_ORIGIN'] ?? '') !== $origin) fail(403, 'Neplatný původ požadavku.');
            if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 4500000) fail(413, 'Požadavek je příliš velký.');
        }
        $admin = admin_base();
        $needsAdmin = $path === $admin || str_starts_with($path, $admin . '/')
            || in_array($path, ['/api/content', '/api/upload'], true);
        if ($needsAdmin && !admin_accounts_ready()) fail(503, 'Dokončete nastavení přihlašovacích účtů.');
        if ($path === $admin . '/prihlaseni' && $method === 'POST') password_login();
        if ($path === $admin . '/overeni' && $method === 'POST') verify_login();
        if ($path === $admin . '/zrusit' && $method === 'POST') { check_csrf(); unset($_SESSION['pending']); redirect($admin . '/prihlaseni'); }
        if (in_array($path, [$admin . '/prihlaseni', $admin . '/overeni'], true) && $method === 'GET') login_page();
        if ($path === $admin . '/odhlasit' && $method === 'POST') {
            check_csrf(); $_SESSION = []; session_destroy();
            setcookie(session_name(), '', ['expires' => 1, 'path' => '/', 'secure' => !local_test(), 'httponly' => true, 'samesite' => 'Strict']); redirect('/');
        }
        if ($path === $admin && $method === 'GET') {
            if (!user_allowed()) redirect($admin . '/prihlaseni');
            page('<main class="admin"><h1>Správa obsahu</h1><p>Načítám editor…</p><noscript>Pro editor povolte JavaScript.</noscript></main>', ['page' => 'editor', 'csrf' => csrf(), 'adminPath' => $admin]);
        }
        if ($path === '/api/booking' && $method === 'POST') fail(410, 'Objednávkový formulář používá nové přímé napojení.');
        if ($path === '/api/upload' && $method === 'POST') upload_photo();
        if (str_starts_with($path, '/api/media/') && in_array($method, ['GET','HEAD'], true)) {
            $key = substr($path, 11);
            if (!preg_match('/^[a-f0-9-]+\.(jpg|png|webp)$/D', $key)) fail(404, 'Nenalezeno.');
            $f = cfg()['data_dir'] . '/media/' . $key;
            if (!is_file($f)) fail(404, 'Nenalezeno.');
            session_write_close(); header('Content-Type: ' . (new finfo(FILEINFO_MIME_TYPE))->file($f));
            header('Cache-Control: public, max-age=31536000, immutable'); header('Content-Length: ' . filesize($f));
            if ($method !== 'HEAD') readfile($f); exit;
        }
        if ($path === '/api/content') {
            require_user();
            if ($method === 'GET') { $s = content_state(); json_response(['data' => $s['draft'], 'revision' => $s['revision']]); }
            if ($method === 'PUT') {
                check_csrf(); $d = read_json(1500000); $value = validate_content($d['data'] ?? null);
                $result = with_store('content', initial_state(), function (&$s) use ($d, $value) {
                    if (($d['revision'] ?? null) !== $s['revision']) fail(409, 'Obsah mezitím změnil jiný editor. Obnovte administraci.');
                    $s['draft'] = $value; $publish = ($d['publish'] ?? false) === true;
                    if ($publish) $s['published'] = $value;
                    $s['revision']++;
                    return ['revision' => $s['revision'], 'message' => $publish ? 'Změny byly zveřejněny.' : 'Koncept byl uložen.'];
                }); json_response($result);
            }
        }
        if ($path === '/' && in_array($method, ['GET','HEAD'], true)) {
            $data = content_state()['published']; $data['team'] = array_values(array_filter($data['team'], fn($p) => !$p['hidden']));
            $consent = match ($_COOKIE['zuby_consent'] ?? '') { 'v1-accepted' => 'accepted', 'v1-rejected' => 'rejected', default => null };
            $locale = in_array($_GET['lang'] ?? '', ['cs','en'], true) ? $_GET['lang'] : ($consent === 'accepted' && ($_COOKIE['zuby_lang'] ?? '') === 'en' ? 'en' : 'cs');
            page(public_fallback($data, $locale), ['page' => 'home', 'data' => $data, 'locale' => $locale, 'consent' => $consent]);
        }
        fail(404, 'Stránka nebyla nalezena.');
    } catch (Throwable $e) {
        $status = $e instanceof HttpError ? $e->status : 503;
        $message = $e instanceof HttpError ? $e->getMessage() : 'Požadavek nelze dokončit. Zkuste to později nebo kontaktujte správce.';
        if (!$e instanceof HttpError) error_log('Zuby backend: ' . get_class($e));
        if (str_starts_with($path, '/api/')) json_response(['error' => $message], $status);
        page('<main class="login"><h1>Požadavek nelze dokončit</h1><p role="alert">' . esc($message) . '</p><a href="' . admin_base() . '/prihlaseni">Přihlášení</a> · <a href="/">Zpět na web</a></main>', ['page' => 'none'], $status);
    }
}
