<?php
// Consistent content + referenced media snapshot, suitable for first migration or a backup.
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require dirname(__DIR__) . '/app.php';
$GLOBALS['zuby_config'] = require (getenv('ZUBY_CONFIG') ?: dirname(__DIR__) . '/config.php');
$target = $argv[1] ?? '';
if ($target === '' || file_exists($target)) { fwrite(STDERR, "Zadejte cestu k nové složce pro export. Existující data se nepřepisují.\n"); exit(1); }
mkdir($target, 0700, true); mkdir($target . '/media', 0700);
$s = content_state(); atomic_json($target . '/content.json', $s);
$media = [];
foreach (['draft','published'] as $kind) foreach (array_merge($s[$kind]['photos'], $s[$kind]['team']) as $p) {
    if (preg_match('~^/api/media/([a-f0-9-]+\.(?:jpg|png|webp))$~D', $p['src'], $m)) $media[$m[1]] = true;
}
foreach (array_keys($media) as $key) {
    $from = cfg()['data_dir'] . '/media/' . $key;
    if (!is_file($from)) throw new RuntimeException('V obsahu je odkaz na chybějící fotografii: ' . $key);
    if (!copy($from, $target . '/media/' . $key)) throw new RuntimeException('Export fotografie selhal.');
}
echo "Export obsahuje koncept, zveřejněný obsah a použité fotografie; neobsahuje hesla ani relace.\n";
