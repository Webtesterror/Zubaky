# Podklady a převod obsahu

Zdroj: https://www.zubydasne.cz/ a jeho style.css, načteno 16. 9. 2026 přímým HTTPS požadavkem. Prohlížecí nástroj vracel 403; přímé načtení skutečného HTML bylo úspěšné.

- O nás: oba kompletní odstavce a 6 fotografií (7.webp, 13.webp, 22.webp, 19.webp, 6.webp, 8.webp).
- Náš tým: 9 aktivních profilů. MDDr. Pavel Šponer, MDDr. Ondřej Stárek, Lenka Mrhálková, Dagmar Novotná, Veronika Dlesková, Denisa Volná, Barbara Zounarová, DiS., Dominika Vrbická, DiS., Eliška Zahálková, DiS. Zachovány tři skutečné portréty a původní obecný avatar u ostatních. Zdroj neobsahoval delší životopisy.
- Průběh léčby: všech 5 kroků a jejich celé popisy.
- Ceník: všech 12 aktivních položek, přesné ceny a úvodní poznámka. Zakomentované neaktivní položky nebyly publikovány. Kategorie „Ošetření a péče“ je organizační název pro původní seznam.
- Kontakt: telefon, e-mail, adresa, sociální odkazy a všech 7 řádků otevírací doby. Původní mapa je dostupná přímým odkazem.
- Objednání: původní typy polí a dokument ochrany osobních údajů. Zpráva je podle zadání nepovinná. Původní potvrzení o odeslání a souhlas s odesláním byly nahrazeny jasným oznámením, že formulář není aktivní.
- Logo: původní secondarylogowhite.svg.
- Font nadpisů a loga: ISOCPEUR Regular, ověřený ze souboru style.css a stažený původní TTF. Běžný text: ve style.css je deklarován Open Sans; jeho lokální soubory 400 a 600 jsou staženy z Google Fonts. Zdrojový HTML načítal také Mooli, ale v nalezených pravidlech nebyl použit. Open Sans nebyl původním HTML explicitně načítán, takže původní prohlížeč mohl zobrazit náhradní sans-serif. Nový web zajišťuje skutečné načtení deklarovaného Open Sans.

Původní obrázek z plochy nebyl změněn. Nový recepce-clean.png byl vytvořen vestavěným nástrojem ImageGen a optimalizován na recepce-clean.webp. Odstraněny texty, značky, karty, ikony, šipky a SCROLL, zachována scéna recepce. Nejde o neupravenou dokumentární fotografii.

Použitý obrazový prompt:

Use case: precise-object-edit. Input image 1 is the edit target. Create a clean website background from this exact dental reception image. Remove ALL typography and ALL UI overlays everywhere: the illuminated ZUBY DÁSNĚ letters on the upper left wall, the headline and paragraph below, all four translucent cards including their rounded rectangular borders and fills, icons, text and arrows, the ZUBY DÁSNĚ lettering on the reception counter, and the bottom SCROLL label and its vertical line. Naturally reconstruct the plain sage wall and plain cream counter surfaces behind removed elements, maintaining realistic subtle textures, shadows and illumination with absolutely no ghost letters or visible rectangular patches. Preserve the original reception counter geometry and position, small potted plant, overhead and hanging foliage, looping illuminated tube light, full composition and perspective, exact colors, warm lighting and photographic style. Keep original wide image proportions and framing. No text, logos, icons, cards or graphics anywhere in the final image.

## Následná úprava podle připomínek

Úvodní text a samostatné bílé logo byly odstraněny z hlavní obrazovky. Kompletní text sekce O nás zůstal zachován. Finální pozadí je public/recepce-logo.webp (zdroj PNG vedle něj): vestavěný ImageGen do čistého podkladu přidal pouze fyzicky působící bílé označení ZUBY / DÁSNĚ na levé čelo pultu, podle původního návrhu. Stěna zůstává bez textů. Použitý prompt: Add ONLY subtle warm-white physical signage in two spaced uppercase lines Z U B Y and D Á S N Ě on the left front face of the counter, approximately x=17–27%, y=85–91%, matching the original reference. Preserve all other scene elements, blank wall, camera, lighting and colors. No other text or UI.

Portréty zachovávají poměr 3:4. Kontakt obsahuje vloženou mapu podle adresy. Nepřihlášená Správa obsahu přechází přímo na přihlašovací formulář. Zavírací animace drží konečný skrytý stav do odebrání panelu.
