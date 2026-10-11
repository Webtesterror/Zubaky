<?php
// CLI only. Create unique per-installation accounts without exposing a web setup route.
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$args = getopt('', ['config:', 'credentials:']);
$path = $args['config'] ?? dirname(__DIR__) . '/config.php';
$credentials = $args['credentials'] ?? dirname($path) . '/PRISTUPY.txt';
if (is_file($path) || is_file($credentials)) { fwrite(STDERR, "Konfigurace nebo přístupy už existují. Nebudou přepsány.\n"); exit(1); }
$config = require dirname(__DIR__) . '/config.example.php';
$config['app_key'] = bin2hex(random_bytes(32));
$config['smtp'] = ['host' => 'smtp.gmail.com', 'port' => 587, 'encryption' => 'tls', 'username' => 'webtest.error@gmail.com', 'password' => '', 'from' => 'webtest.error@gmail.com', 'from_name' => 'Zuby Dásně'];
$text = "ZUBY DÁSNĚ — SOUKROMÉ PŘÍSTUPY\n\n";
foreach (['spravce1', 'spravce2'] as $user) {
    $pw = (string)random_int(100000, 999999);
    $config['users'][$user] = ['password_hash' => password_hash($pw, PASSWORD_BCRYPT, ['cost' => 12])];
    $text .= "Uživatel: $user\nHeslo: $pw\n\n";
}
$text .= "Přihlášení: /admin\nDruhý krok: jednorázový kód na marius.mervart@gmail.com.\nLokální testy ukládají zprávy do soukromé složky data/mail.\n\nTento soubor nenahrávejte na GitHub ani do veřejné www složky.\n";
$config['data_dir'] = ''; // Resolve relative to deployed private application, never local build directory.
$php = "<?php\ndeclare(strict_types=1);\n\$config = " . var_export($config, true) . ";\n\$config['data_dir'] = dirname(__DIR__) . '/zuby-data';\nreturn \$config;\n";
foreach ([$path, $credentials] as $f) if (!is_dir(dirname($f))) mkdir(dirname($f), 0700, true);
file_put_contents($path, $php, LOCK_EX); chmod($path, 0600);
file_put_contents($credentials, $text, LOCK_EX); chmod($credentials, 0600);
echo "Vytvořeny dva účty. Hesla jsou pouze v soukromém souboru PRISTUPY.txt.\n";
