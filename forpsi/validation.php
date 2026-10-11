<?php
declare(strict_types=1);
function txt(mixed $v, int $max = 20000, bool $required = false): string {
    if (!is_string($v) || !preg_match('//u', $v) || strlen($v) > $max * 4 || ($required && trim($v) === '')) fail(422, 'Zkontrolujte vyplněný obsah.');
    if (preg_match_all('/./us', $v) > $max || str_contains($v, "\0")) fail(422, 'Text je příliš dlouhý nebo neplatný.');
    return $v;
}
function rows(mixed $v, int $max, callable $map): array {
    if (!is_array($v) || !array_is_list($v) || count($v) > $max) fail(422, 'Neplatný seznam položek.');
    return array_map($map, $v);
}
function obj(mixed $v): array { if (!is_array($v)) fail(422, 'Neplatná položka.'); return $v; }
function photo(mixed $input): array {
    $p = obj($input); $src = txt($p['src'] ?? null, 500);
    if ($src !== '' && (!preg_match('~^/(source|api/media)/[a-zA-Z0-9_ %().-]+$~D', $src) || str_contains($src, '..') || str_contains(rawurldecode($src), '..') || str_contains(rawurldecode($src), '/..'))) fail(422, 'Neplatná fotografie.');
    $focus = $p['focus'] ?? null;
    if ((!is_int($focus) && !is_float($focus)) || $focus < 0 || $focus > 100) fail(422, 'Neplatný ořez fotografie.');
    return ['id' => txt($p['id'] ?? null, 100, true), 'src' => $src, 'alt' => txt($p['alt'] ?? null, 500), 'focus' => $focus];
}
function https_url(mixed $v): string {
    $s = txt($v, 1000);
    if (!filter_var($s, FILTER_VALIDATE_URL) || parse_url($s, PHP_URL_SCHEME) !== 'https') fail(422, 'Odkaz musí začínat https://.');
    return $s;
}
function validate_content(mixed $value): array {
    $d = obj($value); $contact = obj($d['contact'] ?? null);
    $phone = txt($contact['phone'] ?? null, 20); $email = txt($contact['email'] ?? null, 200);
    if (!preg_match('/^\+?[\d \-]{9,20}$/D', $phone) || !filter_var($email, FILTER_VALIDATE_EMAIL)) fail(422, 'Neplatný kontakt.');
    $out = [
        'announcement' => trim(txt($d['announcement'] ?? '', 3000)), 'intro' => txt($d['intro'] ?? null, 500),
        'about' => rows($d['about'] ?? null, 30, fn($p) => txt($p)),
        'photos' => rows($d['photos'] ?? null, 100, 'photo'),
        'team' => rows($d['team'] ?? null, 100, function($p) {
            $p = obj($p); $result = photo($p);
            foreach (['name', 'title', 'role', 'description'] as $key) $result[$key] = txt($p[$key] ?? null, $key === 'description' ? 20000 : 500, $key === 'name');
            if (!is_bool($p['hidden'] ?? null)) fail(422, 'Neplatná viditelnost profilu.');
            return $result + ['hidden' => $p['hidden']];
        }),
        'steps' => rows($d['steps'] ?? null, 30, function($p) {
            $p = obj($p); return ['id' => txt($p['id'] ?? null, 100, true), 'title' => txt($p['title'] ?? null, 500), 'text' => txt($p['text'] ?? null)];
        }),
        'priceNote' => txt($d['priceNote'] ?? null),
        'categories' => rows($d['categories'] ?? null, 50, function($c) {
            $c = obj($c);
            return ['id' => txt($c['id'] ?? null, 100, true), 'name' => txt($c['name'] ?? null, 500, true),
                'items' => rows($c['items'] ?? null, 300, function($p) {
                    $p = obj($p); $r = ['id' => txt($p['id'] ?? null, 100, true)];
                    foreach (['name', 'price', 'unit', 'note'] as $key) $r[$key] = txt($p[$key] ?? null, $key === 'note' ? 20000 : 500, in_array($key, ['name','price'], true));
                    return $r;
                })];
        }),
        'contact' => ['phone' => $phone, 'email' => $email, 'address' => txt($contact['address'] ?? null, 500),
            'map' => https_url($contact['map'] ?? null), 'facebook' => https_url($contact['facebook'] ?? null), 'instagram' => https_url($contact['instagram'] ?? null),
            'hours' => rows($contact['hours'] ?? null, 14, function($h) { $h = obj($h); return ['day' => txt($h['day'] ?? null, 500), 'time' => txt($h['time'] ?? null, 500)]; })],
        'bookingNote' => txt($d['bookingNote'] ?? null),
    ];
    if (isset($d['english'])) {
        $en = obj($d['english']); if (count($en) > 5000) fail(422, 'Příliš mnoho překladů.');
        $out['english'] = [];
        foreach ($en as $key => $v) $out['english'][txt((string)$key)] = txt($v);
    }
    return $out;
}
