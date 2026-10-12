# Zuby Dásně — správa webu

**Aktuální hosting: FORPSI, PHP 8.2+.** Sestavení, SMTP, účty s e-mailovým ověřením, místní náhled a ruční nasazení popisuje [FORPSI.md](FORPSI.md). Starší konfigurace Sites a [Netlify](NETLIFY.md) zůstávají v repozitáři pro původní instalace; nový PHP backend je nepoužívá.

## Přihlášení

Otevřete přímo **`/paveljeborec`**. Zadejte uživatelské jméno a heslo, potom jednorázový kód z e-mailu konkrétního správce. Účty jsou `sponer`, `starek` a `tester`; jejich hesla jsou pouze v soukromém souboru `.local-forpsi/PRISTUPY.txt`, mimo GitHub.

Místní PHP náhled spouští `npm run dev:forpsi`. E-maily zachytává do soukromé testovací schránky; poslední kód zobrazí `node scripts/read-local-mail.mjs`. Místní a online data jsou oddělená a automaticky se nesynchronizují.

## Změna ceníku

1. Otevřete **Ceník** a upravte název položky, cenu včetně Kč, případně jednotku a poznámku.
2. Tlačítkem **Přidat položku** přidáte další ošetření. Kategorie přidáte pod celým ceníkem.
3. Pořadí upravíte tlačítky **Nahoru** a **Dolů**. Odstranění vyžaduje potvrzení.
4. **Uložit koncept** zachová změny jen ve správě. **Zveřejnit změny** je zpřístupní návštěvníkům.

## Přidání zaměstnance a výměna fotografie

1. Otevřete **Náš tým → Přidat zaměstnance**.
2. Vyplňte jméno, titul, roli a případný popis.
3. Přes **Nahrát / vyměnit fotografii** vyberte JPG, PNG nebo WebP do 4 MB a 24 Mpx. Obrázek se nahraje do úložiště a zobrazí se náhled.
4. Vyplňte stručný popis fotografie. Posuvníkem nastavte svislý hlavní bod ořezu, například směrem k obličeji.
5. Profil můžete přesouvat, dočasně skrýt nebo odstranit. Počet zaměstnanců není pevně daný.
6. Zkontrolujte **Náhled konceptu**, uložte nebo zveřejněte změny.

U profilu bez fotografie se obrázek nezobrazuje. Na původním webu mělo šest členů týmu obecný avatar; tyto původní avatary byly zachovány.

## O nás a další sekce

V **O nás** lze upravovat odstavce a fotografie, včetně jejich pořadí. **Průběh léčby** umožňuje upravit jednotlivé kroky. V **Kontaktu** upravíte telefon, e-mail, adresu, odkazy a otevírací dobu.

## Objednávání

PHP backend odesílá žádosti o objednání přes SMTP na `marius.mervart@gmail.com` po ověření reCAPTCHA. Formulář se aktivuje až po doplnění konfigurace popsané v [FORPSI.md](FORPSI.md). Nejde o kalendář rezervací; termín potvrzuje ordinace. Místní testovací režim e-maily neodesílá.

## Ukládání a zálohy

Na FORPSI jsou obsah a fotografie v privátní složce `zuby-data` mimo veřejný web. Při aktualizaci ji nepřepisujte. Místní PHP náhled používá `.local-forpsi/data`; původní SQLite data v `.local-data` zůstala zachovaná. Konzistentní export obsahu a použitých fotografií vytvoří `php zuby-app/bin/export.php /soukroma/cesta/nova-zaloha`. Soukromý `config.php` zálohujte zvlášť.

Odebrání fotografie z profilu odstraní její použití v obsahu. Původní soubor zůstává v úložišti, aby se nepoškodily starší koncepty nebo jiná použití.

## Stav kontroly PHP backendu

Integrační testy ověřují všechny tři účty, jejich vlastní 2FA adresy, jednorázovost a expiraci kódu, omezení pokusů, CSRF, zákaz anonymních změn, koncept/zveřejnění, souběh editorů, fotografie, objednávky do testovací schránky a trvalost dat po restartu.

Ještě je nutné doplnit heslo aplikace Gmail, klíče reCAPTCHA a cílovou doménu. Skutečné doručení e-mailů a prostředí FORPSI se ověří až po ručním nasazení. GitHub není nasazení; Netlify se automaticky nepublikuje.
