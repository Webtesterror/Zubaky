<?php
declare(strict_types=1);
// Copy to config.php in zuby-app (OUTSIDE the public www directory).
return [
    'origin' => 'https://www.zubydasne.cz',
    'data_dir' => dirname(__DIR__) . '/zuby-data',
    'app_key' => '', // Generate with: php bin/setup.php
    // Each account has its own password hash and 2FA destination.
    'users' => [],
    'mail_to' => 'marius.mervart@gmail.com',
    'smtp' => [
        'host' => 'smtp.forpsi.com', 'port' => 587, 'encryption' => 'tls',
        'username' => '', 'password' => '',
        'from' => '', 'from_name' => 'Zuby Dásně',
    ],
    'recaptcha' => ['site_key' => '', 'secret' => '', 'min_score' => 0.5],
    // Set only in the private local configuration. Production refuses test transports.
    'local_test' => false,
];
