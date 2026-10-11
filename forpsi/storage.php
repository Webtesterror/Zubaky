<?php
declare(strict_types=1);

function store_path(string $name): string { return cfg()['data_dir'] . '/' . $name . '.json'; }
function atomic_json(string $path, array $data): void {
    $tmp = $path . '.' . bin2hex(random_bytes(8)) . '.tmp';
    try {
        $bytes = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
        if (file_put_contents($tmp, $bytes, LOCK_EX) !== strlen($bytes)) throw new RuntimeException('write');
        chmod($tmp, 0600);
        if (!rename($tmp, $path)) throw new RuntimeException('rename');
    } finally { if (is_file($tmp)) unlink($tmp); }
}
// Every read/modify/write uses the same stable lock file; a failed write never truncates live data.
function with_store(string $name, array $initial, callable $callback): mixed {
    $lock = fopen(cfg()['data_dir'] . '/' . $name . '.lock', 'c');
    if (!$lock || !flock($lock, LOCK_EX)) throw new RuntimeException('lock');
    try {
        $file = store_path($name);
        $state = is_file($file) ? json_decode(file_get_contents($file), true, 512, JSON_THROW_ON_ERROR) : $initial;
        $before = $state;
        $result = $callback($state);
        if ($before !== $state || !is_file($file)) atomic_json($file, $state);
        return $result;
    } finally { flock($lock, LOCK_UN); fclose($lock); }
}
function initial_state(): array {
    $file = __DIR__ . '/initial-state.json';
    if (is_file($file)) return json_decode(file_get_contents($file), true, 512, JSON_THROW_ON_ERROR);
    $seed = json_decode(file_get_contents(__DIR__ . '/seed.json'), true, 512, JSON_THROW_ON_ERROR);
    return ['draft' => $seed, 'published' => $seed, 'revision' => 0];
}
function content_state(): array { return with_store('content', initial_state(), fn(&$s) => $s); }
function rate_limit(string $scope, int $limit, int $seconds): void {
    $key = hash_hmac('sha256', $scope, cfg()['app_key']);
    $allowed = with_store('limits', [], function (&$s) use ($key, $limit, $seconds) {
        $now = time();
        foreach ($s as $k => $v) if ($v['until'] <= $now) unset($s[$k]);
        $s[$key] ??= ['until' => $now + $seconds, 'count' => 0];
        if ($s[$key]['count'] >= $limit) return false;
        $s[$key]['count']++;
        return true;
    });
    if (!$allowed) { header('Retry-After: ' . $seconds); fail(429, 'Příliš mnoho pokusů. Zkuste to později.'); }
}
function client_ip(): string { return $_SERVER['REMOTE_ADDR'] ?? 'unknown'; }
