# Nasazení celého webu na Netlify

Web i česká administrace běží v Netlify Function. Obsah a fotografie se ukládají do site-wide Netlify Blobs (`zuby-content`, `zuby-media`), nikoliv do dočasných souborů funkce. Úložiště přetrvá nové nasazení stejného projektu. Nový projekt má vlastní úložiště.

## Jednorázové nastavení

1. Netlify projekt propojte s GitHub repozitářem Webtesterror/Zubaky, větví main.
2. V Project configuration → Environment variables přidejte **ADMIN_PASSWORD**. Použijte unikátní heslo z generátoru hesel, alespoň 24 znaků (doporučeno 32). Musí být dostupné pro **Functions**, případně zvolte všechny scopes. Heslo nevkládejte do GitHubu ani do tohoto souboru. Nastavujte ho jen pro produkční kontext, pokud nechcete povolit správu také z náhledových nasazení.
3. V Build & deploy → Build plugins vypněte dříve přidaný `@netlify/plugin-nextjs`. Projekt používá vlastní server. Soubor netlify.toml také vypíná automatický Next.js plugin.
4. Spusťte nové nasazení. Nastavení z netlify.toml: příkaz `npm run build:netlify`, publish `dist/client`, functions `netlify/functions`, Node 22. Nevkládejte `.next` jako publish složku.
5. Otevřete adresu webu a `/admin`. Zadejte nové heslo z kroku 2. Žádná aktivace přes ChatGPT se na Netlify nepoužívá.

Při změně hesla upravte ADMIN_PASSWORD a spusťte nové nasazení. Původní relace přestanou platit; běžná relace trvá 8 hodin.

## Správa

- Mimořádná zpráva: otevřete stejnojmennou záložku, napište text a zvolte Zveřejnit změny. Zpráva zůstane nad dlaždicemi i po restartu nebo nasazení. Odstraníte ji tlačítkem Vymazat zprávu a následným zveřejněním. Uložit koncept zatím veřejný web nezmění.
- Ceník: otevřete záložku Ceník, upravte nebo přidejte položku a cenu. Šipkami změníte pořadí.
- Zaměstnanec: v Náš tým zvolte Přidat zaměstnance, vyplňte údaje a nahrajte fotografii. Lze měnit pořadí i skrýt profil.
- Fotografie: tlačítkem Nahrát / vyměnit fotografii vyberte JPG, PNG nebo WebP do **4 MB**. Posuvníkem nastavte ořez a vyplňte alternativní text. Limit respektuje přenosové omezení Netlify Functions.
- Uložit koncept změny uchová pro správce. Zveřejnit je zpřístupní návštěvníkům. Smazání položky se potvrzuje. Soubory odstraněné z profilu zůstávají v úložišti, aby se neporušily odkazy z publikované verze.

## Obsah a ověření

### Čeština, angličtina a cookies

- Návštěvník přepne jazyk tlačítky CZ / EN. Přímé adresy jsou `/?lang=cs` a `/?lang=en`; za ně lze přidat například `#nas-tym`. Anglický obsah se vykresluje také na serveru.
- Ve Správě obsahu otevřete **Angličtina**. U českého textu vyplňte anglický překlad, uložte koncept a zveřejněte. Náhled konceptu ukazuje anglické sekce. Původní obsah má připravené překlady. Nové nebo změněné české texty, včetně mimořádné zprávy, je potřeba dopřeložit; administrace ukazuje počet chybějících překladů. Bez překladu se zachová český originál.
- Jména, tituly, fotografie, pořadí a skrytí zaměstnanců, kontaktní údaje a ceny jsou společné oběma jazykům. Částky se nepřepočítávají. Odkaz na dokument o ochraně osobních údajů zůstává v češtině a je tak označen.
- Při první návštěvě se dole zobrazí volba přijmout / odmítnout cookies. `zuby_consent` uchovává pouze tuto volbu po 180 dní. `zuby_lang` se ukládá pouze při přijetí. Po odmítnutí nebo odvolání souhlasu se jazyková cookie smaže; ruční přepínání a přímé jazykové odkazy dále fungují. Při zakázaných cookies v prohlížeči zůstává volba jen v aktuální stránce.
- Vložená Google mapa se nenačítá před souhlasem ani po odmítnutí. Přímý odkaz na mapu je dostupný vždy. Tlačítko u mapy umožňuje cookies přijmout a mapu načíst. Souhlas lze změnit přes **Nastavení cookies** v patičce. Odvolání zastaví další vložené načítání; web nemůže odstranit cookies už uložené doménou Googlu.
- Nová funkce nepřidává analytické ani reklamní měření. Přihlášení správce nadále používá vlastní zabezpečenou relační cookie.

Prázdné úložiště načítá kompletní výchozí obsah z lib/seed.json; první uložení jej zapíše do Blobs. Pozdější nasazení obsah nepřepisují. Úpravy provedené pouze v původním Sites nebo místním náhledu nejsou automaticky přeneseny. Před migrací takových úprav je nutné exportovat publikovaný obsah a nahraná média.

Objednávkový formulář zůstává neaktivní a neodesílá osobní údaje.

Lokální ověření: `npm run build:netlify`, `node scripts/test-netlify.mjs`, `npx tsc --noEmit`. Test kontroluje také deklarované Netlify cesty včetně `/admin/login` a variant s koncovým lomítkem. Používá skutečné SDK a lokální server Netlify Blobs; ověřuje koncept, publikování i fotografie po restartu úložiště. Testovací data jsou oddělena od produkce. Po nasazení ověřte přihlášení na své veřejné adrese. V deployment logu zkontrolujte také aplikování rate limitu.

Pokud kliknutí na Správa obsahu skončí chybou 404 na `/admin/login`, jde o staré nasazení bez správného směrování přihlášení. Nasaďte aktuální větev main; heslo kvůli této chybě není potřeba měnit.

Netlify zdroje: https://docs.netlify.com/build/data-and-storage/netlify-blobs/ a https://docs.netlify.com/build/functions/configuration/
