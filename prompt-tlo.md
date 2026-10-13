# Super Pamięć: prompt na grafikę tła

Data: 2026-10-13

## Gdzie grafika trafia w grze

Tło całej strony, za zieloną tacą z kartami (front z gałęzi `MarcinFront`).

- Taca zajmuje około 730 px szerokości na środku ekranu i górne 2/3 wysokości, więc boki i dół są puste.
- U góry pośrodku stoi ciemnofioletowy tytuł „Super Pamięć” i pasek „Ruchy / Nowa gra”, dlatego środek i górny pas tła muszą być jasne i spokojne.
- Szczegóły grafiki trzymamy przy lewej i prawej krawędzi oraz w dolnych rogach.
- Rewersu karty nie generujemy: jest już zrobiony w CSS (fiolet i złote kropki).

## Prompt

Do wklejenia do generatora grafik:

```
Light, airy whimsical background for a desktop memory card game, 16:9, soft painterly illustration, gentle storybook style. Theme: a sunny magical "memory palace" study – a cozy room seen from inside, pale sky-blue walls. Composition: the central 45% of the width and the whole top band must be a calm, nearly empty, very light pale sky-blue and cream wall with a subtle soft gradient and faint paper texture, low contrast, no objects – a green game tray and a dark purple title will sit there. All detail pushed to the far left and far right edges and the bottom corners: light wooden bookshelves with colorful old books, glass jars, a small hourglass, potted plants, a brass telescope, a few pairs of identical objects hidden on the shelves (two matching teacups, two matching keys), a window with soft daylight on one side, tiny golden sparkles floating near the edges. Bottom area: soft warm wooden floor fading gently, kept simple. Lighting: bright, soft daylight, no harsh shadows. Palette: pale sky blue (#d7e9ec), cream, light warm wood, accents of muted plum purple and marigold gold, a touch of teal green – overall light and desaturated so a teal-green tray and colorful emoji stand out. No text, no letters, no logos, no symbols in the center, no people, no faces, no playing cards. Detailed edges, soft and clean center, high quality, 4K.
```

## Uwagi do promptu

- **16:9** to proporcje obrazu (szerokość do wysokości), czyli standardowy, poziomy format monitora, np. 1920 × 1080. Jeśli generator ma osobne ustawienie proporcji (`Aspect ratio`, w Midjourney `--ar 16:9`), wybierz tam 16:9, bo wpis w tekście bywa ignorowany.
- Kolor `#d7e9ec` to zmienna `--sky` z `index.html`. Dzięki niemu krawędź obrazka zlewa się z obecnym gradientem tła, gdy okno ma inne proporcje.
- Koncept „pałacu pamięci” nawiązuje do techniki zapamiętywania; pary identycznych przedmiotów na półkach to mrugnięcie okiem do zasad gry.

## Jak wpiąć grafikę

- Zapisz obrazek jako WebP i skompresuj do około 200–300 KB.
- Wymaganie 5.1 mówi o jednym pliku `index.html`. Są dwie opcje:
  - obrazek wstawiony jako base64 w CSS (zostaje jeden plik, ale `index.html` mocno puchnie),
  - plik `tlo.webp` obok `index.html` (prostsze, ścieżka względna działa przy otwieraniu dwuklikiem); wtedy trzeba dopisać wyjątek w wymaganiach.
- W CSS: `background-size: cover; background-position: center;` na `body`, z obecnym gradientem jako kolorem zapasowym.
