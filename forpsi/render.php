<?php
declare(strict_types=1);
function page(string $body, array $bootstrap, int $status = 200): never {
    $locale = $bootstrap['locale'] ?? 'cs';
    $title = $locale === 'en' ? 'ZUBY | DÁSNĚ — Dental clinic in Hradec Králové' : 'ZUBY | DÁSNĚ — stomatologické centrum v Hradci Králové';
    $bootstrap['mount'] = true; $bootstrap['backend'] = 'forpsi';
    $payload = json_encode($bootstrap, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_THROW_ON_ERROR);
    http_response_code($status); header('Content-Type: text/html; charset=utf-8');
    if (($bootstrap['page'] ?? '') !== 'home') header('X-Robots-Tag: noindex, nofollow');
    $home = ($bootstrap['page'] ?? '') === 'home';
    echo '<!doctype html><html lang="' . $locale . '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' . esc($title) . '</title><meta name="description" content="' . esc($title) . '"><link rel="icon" href="/favicon.png"><link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/forpsi.css"><link rel="preload" as="font" type="font/ttf" crossorigin href="/source/ISOCPEUR%20Regular.ttf">' . ($home ? '<script src="/boot.js"></script>' : '') . '</head><body><div id="root">' . ($home ? '<div class="reception-bg" aria-hidden="true"></div>' : '') . $body . '</div><script id="bootstrap" type="application/json">' . $payload . '</script><script type="module" src="/client.js"></script></body></html>';
    exit;
}
function public_fallback(array $d, string $locale): string {
    $en = json_decode(file_get_contents(__DIR__ . '/english.json'), true) ?? [];
    $t = fn($s) => $locale === 'en' ? ($d['english'][$s] ?? $en[$s] ?? $s) : $s;
    $labels = $locale === 'en' ? ['About us','Our team','Treatment process','Prices','Contact','Appointments'] : ['O nás','Náš tým','Průběh léčby','Ceník','Kontakt','Objednání'];
    $html = '<main class="public-fallback"><h1>ZUBY | DÁSNĚ</h1>';
    if (!empty($d['announcement'])) $html .= '<p>' . nl2br(esc($t($d['announcement']))) . '</p>';
    $html .= '<section id="o-nas"><h2>' . $labels[0] . '</h2>';
    foreach ($d['about'] as $p) $html .= '<p>' . esc($t($p)) . '</p>';
    foreach ($d['photos'] as $p) if ($p['src']) $html .= '<img src="' . esc($p['src']) . '" alt="' . esc($t($p['alt'])) . '" loading="lazy" width="320">';
    $html .= '</section><section id="nas-tym"><h2>' . $labels[1] . '</h2>';
    foreach ($d['team'] as $p) {
        $html .= '<article><h3>' . esc($p['title'] . ' ' . $p['name']) . '</h3><p>' . esc($t($p['role'])) . '</p><p>' . esc($t($p['description'])) . '</p>';
        $photo = $p['src'] ?: '/source/avatar.jpg';
        $alt = $p['alt'] ?: ($photo === '/source/avatar.jpg' ? 'Ilustrační avatar zaměstnance' : $p['name']);
        $html .= '<img src="' . esc($photo) . '" alt="' . esc($t($alt)) . '" loading="lazy" width="200">';
        $html .= '</article>';
    }
    $html .= '</section><section id="prubeh-lecby"><h2>' . $labels[2] . '</h2>';
    foreach ($d['steps'] as $s) $html .= '<h3>' . esc($t($s['title'])) . '</h3><p>' . esc($t($s['text'])) . '</p>';
    $html .= '</section><section id="cenik"><h2>' . $labels[3] . '</h2><p>' . esc($t($d['priceNote'])) . '</p>';
    foreach ($d['categories'] as $c) {
        $html .= '<h3>' . esc($t($c['name'])) . '</h3><dl>';
        foreach ($c['items'] as $p) $html .= '<dt>' . esc($t($p['name'])) . '</dt><dd>' . esc($p['price'] . ' ' . $t($p['unit']) . ' ' . $t($p['note'])) . '</dd>';
        $html .= '</dl>';
    }
    $c = $d['contact'];
    $html .= '</section><section id="kontakt"><h2>' . $labels[4] . '</h2><p>' . esc($c['address']) . '</p><p><a href="tel:' . esc(preg_replace('/\s+/', '', $c['phone'])) . '">' . esc($c['phone']) . '</a> · <a href="mailto:' . esc($c['email']) . '">' . esc($c['email']) . '</a></p>';
    foreach ($c['hours'] as $h) $html .= '<p>' . esc($t($h['day']) . ' ' . $t($h['time'])) . '</p>';
    return $html . '</section><section id="objednani"><h2>' . $labels[5] . '</h2><p>' . esc($t($d['bookingNote'])) . '</p><p>' . ($locale === 'en' ? 'Please enable JavaScript to use the contact form, or call us.' : 'Pro objednací formulář povolte JavaScript, nebo nám zavolejte.') . '</p></section></main>';
}
