# Zuby Dásně — správa webu

## Přihlášení

Na webu klikněte dole na **Správa obsahu**. Online náhled používá přihlášení přes ChatGPT. Při první návštěvě zadejte jednorázový aktivační kód z odděleného souboru **PRISTUPY.txt**. Tím se váš účet stane jediným správcem. Další přihlášené účty nemají právo upravovat obsah.

Místní náhled používá vlastní přístupový kód z téhož souboru. Je dostupný pouze na tomto počítači. Místní a online databáze jsou oddělené; jejich změny se automaticky nesynchronizují.

## Změna ceníku

1. Otevřete **Ceník** a upravte název položky, cenu včetně Kč, případně jednotku a poznámku.
2. Tlačítkem **Přidat položku** přidáte další ošetření. Kategorie přidáte pod celým ceníkem.
3. Pořadí upravíte tlačítky **Nahoru** a **Dolů**. Odstranění vyžaduje potvrzení.
4. **Uložit koncept** zachová změny jen ve správě. **Zveřejnit změny** je zpřístupní návštěvníkům.

## Přidání zaměstnance a výměna fotografie

1. Otevřete **Náš tým → Přidat zaměstnance**.
2. Vyplňte jméno, titul, roli a případný popis.
3. Přes **Nahrát / vyměnit fotografii** vyberte JPG, PNG nebo WebP do 5 MB. Obrázek se nahraje do úložiště a zobrazí se náhled.
4. Vyplňte stručný popis fotografie. Posuvníkem nastavte svislý hlavní bod ořezu, například směrem k obličeji.
5. Profil můžete přesouvat, dočasně skrýt nebo odstranit. Počet zaměstnanců není pevně daný.
6. Zkontrolujte **Náhled konceptu**, uložte nebo zveřejněte změny.

U profilu bez fotografie se obrázek nezobrazuje. Na původním webu mělo šest členů týmu obecný avatar; tyto původní avatary byly zachovány.

## O nás a další sekce

V **O nás** lze upravovat odstavce a fotografie, včetně jejich pořadí. **Průběh léčby** umožňuje upravit jednotlivé kroky. V **Kontaktu** upravíte telefon, e-mail, adresu, odkazy a otevírací dobu.

## Objednávání

Formulář je pouze frontend. Kontroluje povinná pole, ale nic neodesílá ani neukládá. Aktivní jsou telefon a e-mail. Backend rezervací bude třeba doplnit později. Text oznámení lze měnit v administraci, ale změna textu objednávání neaktivuje.

## Ukládání a zálohy

Online obsah se ukládá do databáze D1 a nové fotografie do úložiště R2; jsou oddělené od nasazované aplikace. Nové nasazení je nepřepisuje. Místní data jsou ve složce `.local-data`; při opětovném spuštění zůstávají zachována. Pro přesun místního webu ponechte tuto složku, případně nastavte `ZUBY_DATA_DIR` na trvalou složku mimo aplikaci. Zálohujte databázi i fotografie; při souborovém kopírování místní databáze nejprve zastavte server.

Odebrání fotografie z profilu odstraní její použití v obsahu. Původní soubor zůstává v úložišti, aby se nepoškodily starší koncepty nebo jiná použití.

## Stav kontroly

Ověřeno: sestavení aplikace, typová kontrola, serverové vykreslení, přihlášení, aktivace správce, uložení konceptu, oddělení konceptu od veřejného obsahu, zveřejnění, změna počtu členů týmu, skrytí profilu, nahrání a načtení fotografie, odmítnutí neplatných obrázků, nepřihlášených úprav a cizího původu požadavku. Ověřeno zachování databáze po restartu. Testovací obsah byl odstraněn.

Vyčištěné pozadí bylo vizuálně zkontrolováno. Plnou vizuální kontrolu rozložení a interakcí v reálném prohlížeči zablokovala omezení prostředí Windows. Mobilní rozvržení, animace, klávesnicové ovládání a historie jsou implementované, ale nepovažujte je za plně uživatelsky otestované. WebMCP má kontrolu dostupnosti; ověření v podporovaném prohlížeči nebylo dostupné.

Online náhled zůstává soukromý. Zpřístupnění pacientům a připojení vlastní domény jsou samostatný krok.
