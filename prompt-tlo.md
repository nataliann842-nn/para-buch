# Para Buch!: prompt na grafikę tła

Data: 2026-10-13

## Gdzie grafika trafia w grze

Tło całej strony, za zieloną tacą z kartami (front z gałęzi `MarcinFront`).

- Taca zajmuje około 730 px szerokości na środku ekranu i górne 2/3 wysokości, więc boki i dół są puste.
- U góry pośrodku stoi ciemnofioletowy tytuł „Para Buch!” i pasek „Ruchy / Nowa gra”, dlatego środek i górny pas tła muszą być jasne i spokojne.
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

## Jak grafika jest wpięta

- Wygenerowany obraz (`natalia.png`, 1672 × 941) jest zapisany jako `tlo.webp` (około 130 KB) obok `index.html`; wyjątek od zasady jednego pliku jest opisany w `wymagania.md`.
- Obraz leży w warstwie `.backdrop`, która skaluje się jak `cover` z wyrównaniem do dołu. Animacje w CSS (świetliki, migotanie świecy w latarence) są ustawione w procentach tej warstwy, więc trafiają w to samo miejsce obrazka przy każdym rozmiarze okna.

## Prompt na animowane tło (wideo)

Kota, sowy i liści nie da się sensownie animować w CSS, bo tło to jeden płaski obraz. Do tego służy generator wideo z obrazka (image-to-video, np. Runway, Kling, Pika, Veo). Wgraj `natalia.png` jako pierwszą klatkę i wklej:

```
Seamless looping animation of this exact illustration. The camera is completely static: no zoom, no pan, no camera shake. Keep every object, color, the lighting and the composition identical to the source image. Only subtle, slow, gentle motion: the sleeping cat on the floor in the bottom-left corner slowly stretches its front paws, gives one big yawn, then curls up and sleeps again; the white owl on the right bookshelf slowly turns its head to the side and back and blinks once; the ivy leaves and hanging vines sway softly as if in a light breeze; the lavender in the vase sways gently; tiny golden fireflies blink and drift slowly near the shelves; the candle flame inside the golden lantern flickers softly. The empty light-blue wall in the center and the wooden floor stay completely still and clean. No new objects, no people, no text. Duration 8–10 seconds; the last frame must match the first frame for a seamless loop.
```

Ustawienia w generatorze: proporcje 16:9, siła ruchu (motion) niska, jeśli jest opcja, ustaw ostatnią klatkę taką samą jak pierwszą (`end frame` = ten sam obraz). Pobierz MP4 w 1080p.

Po wgraniu klipu do Pobranych: skompresuję go do WebM/MP4 (około 2–4 MB), podepnę w `.backdrop` jako zapętlone, wyciszone wideo z `tlo.webp` jako obrazem zastępczym i wyłączę je przy systemowym ograniczeniu ruchu.
