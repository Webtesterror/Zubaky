<?php
// PHP's built-in server: local preview only. Never needed on FORPSI.
declare(strict_types=1);
$path = rawurldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/');
if (str_contains($path, '..') || preg_match('~(^|/)\.~', $path)) {
    http_response_code(404); exit;
}
$file = realpath($_SERVER['DOCUMENT_ROOT'] . $path);
$root = realpath($_SERVER['DOCUMENT_ROOT']);
if ($file && str_starts_with($file, $root . DIRECTORY_SEPARATOR) && is_file($file)
    && preg_match('/\.(css|js|png|jpg|jpeg|webp|svg|woff2?|ttf|pdf|ico)$/i', $file)) {
    return false;
}
require $_SERVER['DOCUMENT_ROOT'] . '/index.php';
