<?php
declare(strict_types=1);
function admin_base(): string { return '/paveljeborec'; }
function account_version(array $entry): string {
    return hash('sha256', ($entry['password_hash'] ?? '') . '|' . ($entry['otp_to'] ?? ''));
}
function csrf(): string { return $_SESSION['csrf'] ??= bin2hex(random_bytes(32)); }
function check_csrf(): void {
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? $_POST['csrf'] ?? '';
    if (!is_string($token) || !hash_equals(csrf(), $token)) fail(403, 'Stránka vypršela. Obnovte ji a zkuste to znovu.');
}
function user_allowed(): bool {
    $u = $_SESSION['user'] ?? ''; $entry = cfg()['users'][$u] ?? null;
    if (!$entry || ($_SESSION['expires'] ?? 0) < time() || ($_SESSION['last'] ?? 0) < time() - 1800
        || !hash_equals($_SESSION['version'] ?? '', account_version($entry))) {
        unset($_SESSION['user']); return false;
    }
    $_SESSION['last'] = time();
    return true;
}
function require_user(): void { if (!user_allowed()) fail(401, 'Přihlaste se do správy obsahu.'); }
function login_code(): string {
    $alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';
    do {
        $code = '';
        for ($i = 0; $i < 9; $i++) $code .= $alphabet[random_int(0, strlen($alphabet) - 1)];
    } while (!preg_match('/[0-9]/', $code) || !preg_match('/[a-z]/', $code));
    return $code;
}
function login_page(string $message = '', int $status = 200): never {
    $pending = isset($_SESSION['pending']) && ($_SESSION['pending']['expires'] ?? 0) > time();
    $fields = $pending
        ? '<p>' . (local_test() ? 'Kód najdete v soukromé místní testovací schránce.' : 'Na e-mail správce jsme odeslali devítiznakový kód z číslic a malých písmen.') . ' Platí 5 minut, použít jej lze jednou.</p><label class="field">Ověřovací kód<input name="code" inputmode="text" autocapitalize="none" spellcheck="false" autocomplete="one-time-code" pattern="[a-z0-9]{9}" maxlength="9" required autofocus></label>'
        : '<label class="field">Uživatelské jméno<input name="username" autocomplete="username" maxlength="64" required autofocus></label><label class="field">Heslo<input name="password" type="password" autocomplete="current-password" maxlength="128" required></label>';
    $body = '<main class="login"><h1>Přihlášení do správy</h1>' . ($message ? '<p role="alert">' . esc($message) . '</p>' : '')
        . (local_test() ? '<p class="notice">Místní test: e-maily se ukládají do soukromé testovací schránky na tomto počítači. Nikam se neodesílají.</p>' : '')
        . '<form method="post" action="' . admin_base() . '/' . ($pending ? 'overeni' : 'prihlaseni') . '" class="form-grid"><input type="hidden" name="csrf" value="' . csrf() . '">' . $fields
        . '<button class="primary">' . ($pending ? 'Ověřit a přihlásit' : 'Poslat přihlašovací kód') . '</button></form>'
        . ($pending ? '<form method="post" action="' . admin_base() . '/zrusit"><input type="hidden" name="csrf" value="' . csrf() . '"><button class="secondary">Začít znovu / nový kód</button></form>' : '')
        . '<a href="/">Zpět na web</a></main>';
    page($body, ['page' => 'none'], $status);
}
function password_login(): never {
    check_csrf();
    $u = strtolower(trim(is_string($_POST['username'] ?? null) ? $_POST['username'] : ''));
    $pw = is_string($_POST['password'] ?? null) ? $_POST['password'] : '';
    rate_limit('login-ip:' . client_ip(), 20, 900);
    rate_limit('login-user:' . $u, 5, 900);
    $entry = cfg()['users'][$u] ?? null;
    // Always do a real password check, also for an unknown username.
    $dummy = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.';
    $ok = password_verify(substr($pw, 0, 128), $entry['password_hash'] ?? $dummy);
    if (!$ok || !$entry || strlen($pw) > 128) login_page('Nesprávné přihlašovací údaje.', 403);
    $code = login_code(); $nonce = bin2hex(random_bytes(24)); $expires = time() + 300;
    // A new login invalidates an older outstanding code for this account.
    with_store('challenges', [], function (&$s) use ($u, $code, $nonce, $expires) {
        foreach ($s as $k => $v) if ($v['expires'] < time()) unset($s[$k]);
        $s[$u] = ['nonce' => $nonce, 'hash' => hash_hmac('sha256', $nonce . $code, cfg()['app_key']), 'expires' => $expires, 'attempts' => 0];
    });
    unset($_SESSION['user'], $_SESSION['pending']);
    $otpTo = $entry['otp_to'] ?? '';
    if (!filter_var($otpTo, FILTER_VALIDATE_EMAIL)) throw new RuntimeException('account otp destination');
    send_mail($otpTo, 'Zuby Dásně — přihlašovací kód', "Účet: $u\n\nVáš ověřovací kód: $code\n\nPlatnost je 5 minut. Pokud jste přihlášení nevyžádali, kód nikomu nesdělujte.");
    session_regenerate_id(true);
    $_SESSION['pending'] = ['username' => $u, 'nonce' => $nonce, 'expires' => $expires];
    redirect(admin_base() . '/overeni');
}
function verify_login(): never {
    check_csrf(); rate_limit('otp-ip:' . client_ip(), 20, 900);
    $p = $_SESSION['pending'] ?? null;
    $code = is_string($_POST['code'] ?? null) ? $_POST['code'] : '';
    if (!$p) login_page('Nejprve zadejte uživatelské jméno a heslo.', 403);
    $ok = with_store('challenges', [], function (&$s) use ($p, $code) {
        $u = $p['username']; $c = $s[$u] ?? null;
        if (!$c || $c['expires'] < time() || $c['attempts'] >= 5 || !hash_equals($c['nonce'], $p['nonce'])) return false;
        $s[$u]['attempts']++;
        if (!preg_match('/^[a-z0-9]{9}$/D', $code) || !preg_match('/[0-9]/', $code) || !preg_match('/[a-z]/', $code)
            || !hash_equals($c['hash'], hash_hmac('sha256', $c['nonce'] . $code, cfg()['app_key']))) return false;
        unset($s[$u]); return true;
    });
    if (!$ok) login_page('Kód je nesprávný, vypršel nebo byl již použit. Po pěti pokusech začněte znovu.', 403);
    session_regenerate_id(true); $_SESSION = [];
    $_SESSION['user'] = $p['username']; $_SESSION['expires'] = time() + 28800; $_SESSION['last'] = time();
    $_SESSION['version'] = account_version(cfg()['users'][$p['username']]);
    csrf(); redirect(admin_base());
}
