# Nasazení na FORPSI

Web má samostatný backend v PHP 8.2+ pro Linux webhosting s Apache. Na hostingu se nespouští Node, Firebase ani Netlify. Node je potřeba pouze na počítači při sestavení souborů.

## Co funguje

- `/paveljeborec`: čtyři vlastní účty, každý s vlastním heslem a vlastní adresou pro povinný jednorázový šestimístný kód. Kód platí 5 minut, má nejvýše 5 pokusů a nelze ho použít podruhé. Další přihlášení stejného účtu zneplatní předchozí nevyužitý kód. Přihlášení vyprší po 30 minutách nečinnosti, nejpozději po 8 hodinách. Původní `/admin` není vstupem do PHP administrace.
- Neúplná nebo starší konfigurace účtů bezpečně zablokuje pouze administraci a její API. Veřejný web a kontaktní informace zůstanou dostupné.
- Dosavadní editor: ceník, tým, fotografie, texty, angličtina, mimořádná zpráva, koncept a zveřejnění. Souběžné úpravy se nepřepíšou bez upozornění.
- Formulář: žádost přijde na `marius.mervart@gmail.com`, e-mail návštěvníka je v Reply-To. Odesílatelem je `webtest.error@gmail.com`. Potvrzení se zobrazí až po přijetí zprávy SMTP serverem; není to potvrzení termínu ani záruka doručení do inboxu.
- reCAPTCHA v3 se kontroluje na serveru včetně domény, stáří tokenu, akce a skóre. Odesílání i přihlašování má limity pokusů.
- Fotografie do 4 MB / 24 Mpx se ověřují skutečným dekódováním, zbaví se metadat, zmenší na nejvýše 2400 px a uloží jako WebP.
- Publikovaný obsah se vrací přímo v HTML pro vyhledávače i návštěvníky bez JavaScriptu. Interaktivní rozhraní používá stávající React a vzhled webu.

Obsah je uložen v JSON souborech pod souborovým zámkem s atomickou výměnou. Pro tento malý web není potřeba zakládat MySQL databázi. Úložiště je mimo veřejný adresář a nepřepisuje se při aktualizaci aplikace.

## Co je nutné před skutečným odesíláním doplnit

Soukromý `config.php` je uložen mimo GitHub a mimo veřejný adresář. V této instalaci je připraven v `.local-forpsi/production-config.php`; do hostingu se nahraje jako `zuby-app/config.php`.

1. `origin`: skutečná doména včetně `https://`, například `https://www.zubydasne.cz`, bez závěrečného lomítka. Variantu bez www nastavte na hostingu jako přesměrování na tuto doménu. Zapněte HTTPS certifikát.
2. `smtp.password`: **heslo aplikace Google**, nikoli běžné heslo Gmailu. V účtu `webtest.error@gmail.com` zapněte dvoufázové ověření a vytvořte heslo aplikace v https://myaccount.google.com/apppasswords. Do hodnoty vložte 16 znaků bez mezer. Ostatní nastavení je `smtp.gmail.com`, port 587, TLS, uživatel a From `webtest.error@gmail.com`.
3. `recaptcha.site_key` a `recaptcha.secret`: vytvořte klíče reCAPTCHA **v3** pro skutečnou doménu na https://www.google.com/recaptcha/admin/create. Akce formuláře je `booking`, výchozí minimální skóre 0,5. Původní veřejný klíč zubydasne.cz sám o sobě nestačí.
4. `local_test` musí na hostingu zůstat `false`. Veřejný server testovací režim odmítne. Bez SMTP a reCAPTCHA se objednávání neaktivuje; bez SMTP nelze dokončit přihlášení.

Nezadávejte SMTP heslo do frontendových proměnných, Reactu ani do GitHubu. Aplikační klíč a hashe účtů byly již vygenerovány. Samotná přihlašovací hesla jsou v `.local-forpsi/PRISTUPY.txt`, který se na hosting nenahrává. Před spuštěním veřejného formuláře zkontrolujte také text přiložených informací o zpracování osobních údajů, aby odpovídal skutečnému příjemci a použitému řešení.

Dokumentace: [Google — hesla aplikací](https://support.google.com/accounts/answer/185833?hl=cs), [Google — reCAPTCHA v3](https://developers.google.com/recaptcha/docs/v3), [FORPSI — Linux hosting](https://www.forpsi.com/webhosting_s_domenou/), [PHPMailer](https://github.com/PHPMailer/PHPMailer).

## Příprava a FTP

Na počítači v kořeni projektu:

```sh
npm ci
npm run build:forpsi
```

Sestavení stáhne ověřené soubory PHPMailer 7.1.1 z upstream repozitáře a zkontroluje pevné SHA-256 hashe. Výsledný balíček obsahuje knihovnu, proto není potřeba Composer na hostingu.

Nahrajte soubory takto (veřejná složka se u vašeho hostingu může jmenovat jinak než `www`):

```text
kořen FTP/
  www/                 ← obsah dist/forpsi/www včetně .htaccess
  zuby-app/            ← obsah dist/forpsi/zuby-app
    config.php         ← soukromá produkční konfigurace
  zuby-data/           ← TRVALÁ DATA, mimo veřejnou www
    content.json
    media/
    sessions/
```

`www/index.php` očekává `zuby-app` jako sourozence `www`. Pokud FTP nepovoluje zápis mimo document root, požádejte podporu o privátní adresář a odpovídajícím způsobem nastavte cestu v `index.php` a `config.php`. **Soukromé složky nedávejte do veřejné www.** PHP musí mít oprávnění zapisovat do `zuby-data`; není potřeba povolovat 777. Potřebné moduly: cURL, OpenSSL, Fileinfo, GD s WebP a Session. Limit PHP: `upload_max_filesize=4M` nebo vyšší, `post_max_size=5M` nebo vyšší, doporučeně paměť alespoň 256 MB pro fotografie.

Při **prvním nasazení** lze vložit dodaný obsah `initial-content` do `zuby-data`. Obsahuje export dosavadního místního konceptu, zveřejněného obsahu a použitých fotografií. Pokud export nevložíte, web použije počáteční obsah z `seed.json`.

Při **další aktualizaci** nahrajte pouze `www` a kód `zuby-app`. Nikdy nepřepisujte `zuby-data` ani existující `zuby-app/config.php`. Živé změny obsahu a fotografií pak přežijí každé nové nasazení.

Je-li dostupné SSH, kontrolu konfigurace spustíte `php zuby-app/bin/check.php`. Vypisuje pouze stav nastavení, nikoli hesla. Na novém hostingu ještě ověřte skutečný příchod kódu i žádosti do Gmailu a ukládání fotografií; místní testy nenahrazují ověření konfigurace poskytovatele.

## Účty, obnova a zálohy

Pro tuto instalaci jsou v soukromé konfiguraci účty `sponer`, `starek`, `tester` a `hoffa`. Každý má vlastní 2FA adresu. Hesla jsou pouze v `.local-forpsi/PRISTUPY.txt`. Zcela nová instalace může použít `php zuby-app/bin/setup.php`; existující konfiguraci nepřepíše a vytvoří pro stejné názvy účtů nová náhodná hesla.

Pokud potřebujete obnovit přístup, přes FTP/SSH bezpečně zazálohujte `config.php`, odstraňte jej z umístění aplikace a spusťte setup pro nové účty; přeneste SMTP, reCAPTCHA a doménu ze zálohy. `zuby-data` ponechte. Změna hashů hesel zneplatní staré přihlášení. Soukromou zálohu nenechávejte ve veřejné www.

Zálohu obsahu a použitých fotografií vytvoří `php zuby-app/bin/export.php /soukroma/cesta/nova-zaloha`. Cílová složka musí být nová. Konfiguraci zálohujte zvlášť. Export neobsahuje hesla, relace, limity ani přihlašovací kódy. Odebrání fotky z editoru ji odpojí od obsahu; původní soubor zůstává pro případ použití ve starším konceptu.

## Místní náhled

Připravený náhled běží na http://127.0.0.1:5173, přihlášení na http://127.0.0.1:5173/paveljeborec. Při vypnutí počítače se server zastaví. Příště jej spustíte:

```sh
npm run dev:forpsi
```

Na tomto počítači je přenosný PHP runtime v `.local-forpsi/runtime/php`. Jinde nainstalujte PHP a případně nastavte `PHP_BINARY`. Pro nový checkout: vytvořte soukromou konfiguraci příkazem `php forpsi/bin/setup.php --config=.local-forpsi/production-config.php --credentials=.local-forpsi/PRISTUPY.txt`, spusťte `node scripts/prepare-forpsi-local.mjs` a sestavte web.

Místní režim zachytává e-maily do `.local-forpsi/data/mail`. **Nic skutečně neodesílá** a v prohlížeči to výslovně uvádí. Poslední testovací kód nebo zprávu přečtete příkazem `node scripts/read-local-mail.mjs`. Testovací schránka nemá veřejnou HTTP adresu. Starší `.local-data/content.sqlite` zůstala zachovaná, při přípravě se jen jednorázově zkopíroval obsah do nového úložiště.

## Ověření a publikace

`npm run test:forpsi` provádí integrační testy nad odděleným PHP serverem a dočasnými daty: čtyři přihlášení, správné směrování 2FA pro každý účet, chybný a použitý kód, expiraci, omezení pokusů, CSRF, cizí Origin, zakázané anonymní úpravy, nepřístupnost původní `/admin`, koncept/zveřejnění, souběh editorů, validaci obsahu a fotografií, WebP, formulář s testovací schránkou, odmítnutí podvržené adresy, deduplikaci a restart serveru. Skutečné e-mailové schránky ani skutečná reCAPTCHA se testy nekontaktují.

Změny zdrojů se odesílají na GitHub. Nasazování hostingu zůstává ruční. Commity používají `[skip ci]`, aby staré propojení Netlify nespustilo automatické sestavení. Tento backend se nenahrává na Netlify.
