<?php
declare(strict_types=1);

function mail_ready(): bool {
    if (local_test()) return true;
    $m = cfg()['smtp'];
    return !empty($m['host']) && !empty($m['username']) && !empty($m['password'])
        && filter_var($m['from'] ?? '', FILTER_VALIDATE_EMAIL) !== false;
}
function send_mail(string $to, string $subject, string $body, string $reply = ''): void {
    if (!mail_ready()) fail(503, 'Odesílání e-mailů ještě není nastavené. Kontaktujte správce.');
    if (local_test()) {
        // Only loopback + PHP CLI server can use the private test mailbox.
        atomic_json(cfg()['data_dir'] . '/mail/' . bin2hex(random_bytes(12)) . '.json', [
            'to' => $to, 'subject' => $subject, 'body' => $body, 'reply' => $reply, 'time' => time(),
        ]);
        return;
    }
    foreach (['Exception', 'PHPMailer', 'SMTP'] as $class) require_once __DIR__ . '/vendor/PHPMailer/' . $class . '.php';
    $m = cfg()['smtp'];
    if (!in_array($m['encryption'], ['tls', 'ssl'], true)) throw new RuntimeException('SMTP TLS required');
    $mail = new \PHPMailer\PHPMailer\PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = $m['host']; $mail->Port = (int)$m['port'];
    $mail->SMTPAuth = true; $mail->Username = $m['username']; $mail->Password = $m['password'];
    $mail->SMTPSecure = $m['encryption']; $mail->Timeout = 15; $mail->Timelimit = 20;
    $mail->CharSet = 'UTF-8';
    $mail->setFrom($m['from'], $m['from_name']);
    $mail->addAddress($to);
    if ($reply !== '') $mail->addReplyTo($reply);
    $mail->Subject = $subject; $mail->Body = $body;
    $mail->send();
}
function captcha_ready(): bool {
    return local_test() || (!empty(cfg()['recaptcha']['site_key']) && !empty(cfg()['recaptcha']['secret']));
}
function verify_captcha(string $token): void {
    if (local_test()) return;
    if (!captcha_ready() || $token === '' || strlen($token) > 8192) fail(422, 'Nepodařilo se ověřit ochranu proti spamu. Zkuste to znovu.');
    $c = curl_init('https://www.google.com/recaptcha/api/siteverify');
    curl_setopt_array($c, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => http_build_query([
        'secret' => cfg()['recaptcha']['secret'], 'response' => $token,
    ]), CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10, CURLOPT_CONNECTTIMEOUT => 5]);
    $raw = curl_exec($c); $status = curl_getinfo($c, CURLINFO_HTTP_CODE); curl_close($c);
    if ($raw === false || $status !== 200) fail(503, 'Ověření proti spamu je dočasně nedostupné.');
    $r = json_decode($raw, true);
    $age = time() - (strtotime($r['challenge_ts'] ?? '') ?: 0);
    if (empty($r['success']) || ($r['action'] ?? '') !== 'booking'
        || ($r['hostname'] ?? '') !== parse_url(cfg()['origin'], PHP_URL_HOST)
        || ($r['score'] ?? 0) < cfg()['recaptcha']['min_score'] || $age < -30 || $age > 120) {
        fail(422, 'Nepodařilo se ověřit ochranu proti spamu. Zkuste to znovu.');
    }
}
