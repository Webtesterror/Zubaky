<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$ok = true;
foreach (['curl', 'openssl', 'fileinfo', 'gd', 'session'] as $ext) {
    $present = extension_loaded($ext); echo "$ext: " . ($present ? 'OK' : 'CHYBÍ') . "\n"; $ok = $ok && $present;
}
$path = getenv('ZUBY_CONFIG') ?: dirname(__DIR__) . '/config.php';
if (!is_file($path)) { echo "Konfigurace chybí.\n"; exit(1); }
$c = require $path;
$checks = ['PHP >= 8.2' => PHP_VERSION_ID >= 80200, 'WebP' => function_exists('imagewebp'),
    'Čtyři účty s 2FA' => count($c['users']) === 4 && count(array_filter($c['users'], fn($u) => filter_var($u['otp_to'] ?? '', FILTER_VALIDATE_EMAIL))) === 4,
    'Klíč aplikace' => strlen($c['app_key']) >= 32,
    'SMTP nastaveno' => !empty($c['smtp']['password']), 'reCAPTCHA nastavená' => !empty($c['recaptcha']['secret']) && !empty($c['recaptcha']['site_key']),
    'Produkční režim' => empty($c['local_test']), 'HTTPS origin' => str_starts_with($c['origin'], 'https://')];
foreach ($checks as $name => $value) { echo "$name: " . ($value ? 'OK' : 'DOPLNIT') . "\n"; $ok = $ok && $value; }
exit($ok ? 0 : 1);
