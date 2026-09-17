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

- Ceník: otevřete záložku Ceník, upravte nebo přidejte položku a cenu. Šipkami změníte pořadí.
- Zaměstnanec: v Náš tým zvolte Přidat zaměstnance, vyplňte údaje a nahrajte fotografii. Lze měnit pořadí i skrýt profil.
- Fotografie: tlačítkem Nahrát / vyměnit fotografii vyberte JPG, PNG nebo WebP do **4 MB**. Posuvníkem nastavte ořez a vyplňte alternativní text. Limit respektuje přenosové omezení Netlify Functions.
- Uložit koncept změny uchová pro správce. Zveřejnit je zpřístupní návštěvníkům. Smazání položky se potvrzuje. Soubory odstraněné z profilu zůstávají v úložišti, aby se neporušily odkazy z publikované verze.

## Obsah a ověření

Prázdné úložiště načítá kompletní výchozí obsah z lib/seed.json; první uložení jej zapíše do Blobs. Pozdější nasazení obsah nepřepisují. Úpravy provedené pouze v původním Sites nebo místním náhledu nejsou automaticky přeneseny. Před migrací takových úprav je nutné exportovat publikovaný obsah a nahraná média.

Objednávkový formulář zůstává neaktivní a neodesílá osobní údaje.

Lokální ověření: `npm run build:netlify`, `node scripts/test-netlify.mjs`, `npx tsc --noEmit`. Test kontroluje také deklarované Netlify cesty včetně `/admin/login` a variant s koncovým lomítkem. Používá skutečné SDK a lokální server Netlify Blobs; ověřuje koncept, publikování i fotografie po restartu úložiště. Testovací data jsou oddělena od produkce. Po nasazení ověřte přihlášení na své veřejné adrese. V deployment logu zkontrolujte také aplikování rate limitu.

Pokud kliknutí na Správa obsahu skončí chybou 404 na `/admin/login`, jde o staré nasazení bez správného směrování přihlášení. Nasaďte aktuální větev main; heslo kvůli této chybě není potřeba měnit.

Netlify zdroje: https://docs.netlify.com/build/data-and-storage/netlify-blobs/ a https://docs.netlify.com/build/functions/configuration/
