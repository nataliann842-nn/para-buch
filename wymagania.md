# Para Buch!: wymagania

Data: 2026-09-29

## 1. Cel

Gra memory (szukanie par kart) napisana w HTML, CSS i JavaScript. Powstaje jako ćwiczenie z vibe codingu: najważniejsze są działający, czysty kod i przetestowana logika, a nie rozbudowana grafika czy liczba funkcji.

Kryterium sukcesu: gracz może rozegrać pełną partię od pierwszego kliknięcia do komunikatu o wygranej, rozpocząć nową grę bez odświeżania strony, a testy logiki przechodzą.

## 2. Zakres

### 2.1. W zakresie

- Jeden gracz.
- Stała plansza: 6 kolumn na 5 wierszy, 30 kart, 15 par.
- Symbole na kartach: emoji.
- Licznik ruchów.
- Animacja odwracania karty.
- Przycisk „Nowa gra” i komunikat o wygranej.
- Testy logiki uruchamiane w przeglądarce oraz testy end-to-end w Playwright (sekcja 6.1).
- Zapis w bazie Supabase (sekcja 8): konta z loginem i hasłem, wspólny ranking 10 najlepszych wyników z loginem, profil gracza oraz wznawianie przerwanej partii.

### 2.2. Poza zakresem

- Poziomy trudności i zmiana rozmiaru planszy.
- Stoper i pomiar czasu.
- Reset i zmiana hasła, zmiana loginu, usuwanie konta przez gracza (konto nie ma prawdziwego adresu e-mail).
- Ochrona rankingu przed fałszywymi wynikami poza regułami w bazie (sekcja 8.3).
- Tryb dwóch graczy.
- Tryb ciemny.
- Projektowanie pod telefon (responsywność).
- Obsługa klawiaturą i czytnika ekranu jako wymaganie (karty są jednak elementami `<button>`, co nie wymaga dodatkowej pracy).

## 3. Zasady gry

1. Na starcie gry losowanych jest 15 różnych emoji z puli (pula musi mieć co najmniej 15 symboli); każde trafia do talii dwukrotnie. Talia (30 kart) jest tasowana i rozkładana zakryta na planszy 6 × 5 (6 kolumn, 5 wierszy).
2. Kliknięcie zakrytej karty odkrywa ją.
3. Kliknięcie karty już odkrytej lub znalezionej nie robi nic.
4. Po odkryciu drugiej karty licznik ruchów zwiększa się o 1 (ruch = odkrycie pary kart).
5. Jeśli obie odkryte karty mają ten sam symbol, zostają odkryte na stałe i oznaczone jako znalezione.
6. Jeśli symbole są różne:
   - obie karty pozostają odkryte przez 1 sekundę,
   - w tym czasie plansza ignoruje wszystkie kliknięcia (blokada),
   - po upływie czasu obie karty zakrywają się automatycznie i blokada znika.
7. Po znalezieniu 15. pary gra się kończy i pojawia się komunikat „Brawo! Ukończono w N ruchach” z przyciskiem „Zagraj ponownie”.
8. Przycisk „Nowa gra” jest widoczny cały czas, także w trakcie partii. Działa od razu, bez pytania o potwierdzenie: tasuje nową talię, zakrywa wszystkie karty, zeruje licznik ruchów i zdejmuje blokadę.
9. „Zagraj ponownie” działa tak samo jak „Nowa gra”.

## 4. Interfejs

- Nagłówek z nazwą gry „Para Buch!”.
- Pasek z licznikiem „Ruchy: N” i przyciskiem „Nowa gra”.
- Plansza: siatka 6 × 5 kart (6 kolumn, 5 wierszy) jednakowej wielkości.
- Tło strony: ilustracja „pałacu pamięci” (`tlo.webp`) z pustym środkiem i szczegółami przy krawędziach, dopasowana do okna (`cover`) i nieprzewijająca się razem ze stroną. Na tle są delikatne animacje w CSS: migoczący płomień świecy w latarence, piasek przesypujący się w klepsydrze, świetliki rozbłyskujące przy regałach i chmury płynące za oknem (tylko w szybach nad zamkiem; maska nieba jest wstawiona w CSS jako `data:`, bo zewnętrznej maski przeglądarka nie wczyta przy otwarciu pliku z dysku). Przy systemowym ograniczeniu ruchu (`prefers-reduced-motion`) animacje są wyłączone.
- Karta zakryta ma jednolity rewers; karta odkryta pokazuje emoji; karta znaleziona jest wizualnie odróżniona (np. przygaszona lub z obramowaniem).
- Odwracanie karty jest animowane (obrót w osi Y, CSS `transform: rotateY` z `backface-visibility: hidden`), czas animacji około 0,3 s.
- Komunikat o wygranej wyświetlany nad planszą lub jako nakładka, z przyciskiem „Zagraj ponownie”.
- Docelowe środowisko: aktualna przeglądarka na komputerze (Chrome, Edge, Firefox).

## 5. Architektura

### 5.1. Plik

Cała gra mieści się w jednym pliku `index.html`, otwieranym dwuklikiem, bez serwera, bundlera ani instalacji zależności. Jedyna zewnętrzna zależność to biblioteka `supabase-js` z CDN (jsDelivr). Plik zawiera:

1. `<style>`: wygląd i animacja.
2. `<script>` z logiką gry: czyste funkcje, bez żadnych odwołań do DOM, `window` ani timerów.
3. `<script>` z zapisem w Supabase (obiekt `store`): gość (logowanie anonimowe), rejestracja i logowanie, zapis partii, ranking, profil.
4. `<script>` z widokiem: rysowanie planszy na podstawie stanu, obsługa kliknięć, `setTimeout` na 1 sekundę po nietrafionej parze.
5. `<script>` z testami: uruchamiany tylko przy adresie z parametrem `?test`.

Schemat bazy (tabele i reguły dostępu) jest w pliku `supabase/schema.sql`.

Wyjątek od zasady jednego pliku: grafika tła `tlo.webp` (około 130 KB) leży obok `index.html`, bo wklejona jako base64 dopisałaby do kodu setki KB nieczytelnego tekstu. Bez niej gra działa, a tło zastępuje gradient. Prompt, z którego powstała, jest w `prompt-tlo.md`.

### 5.2. Stan gry

Stan jest jednym obiektem, np.:

```js
{
  cards: [{ symbol: '🍎', matched: false }, ...], // 30 elementów
  revealed: [],   // indeksy aktualnie odkrytych, niesparowanych kart (0, 1 lub 2)
  moves: 0,
  locked: false,  // true w czasie 1 s po nietrafionej parze
  won: false
}
```

### 5.3. Funkcje logiki

- `createDeck(symbols, random)`: buduje talię z 15 symboli (każdy dwa razy) i tasuje ją algorytmem Fisher-Yates. Parametr `random` (domyślnie `Math.random`) pozwala podać przewidywalną funkcję losującą w testach.
- `newGame(random)`: zwraca stan początkowy z nową talią.
- `flipCard(state, index)`: zwraca nowy stan po kliknięciu karty. Nie zmienia stanu wejściowego. Ignoruje kliknięcie, gdy `locked` jest `true`, gdy karta jest znaleziona lub już odkryta, albo gdy gra jest wygrana. Przy drugiej odkrytej karcie zwiększa `moves`, a następnie oznacza parę jako znalezioną albo ustawia `locked: true`. Ustawia `won: true` po ostatniej parze.
- `hideUnmatched(state)`: zakrywa niesparowane odkryte karty i zdejmuje blokadę. Warstwa widoku wywołuje ją po 1 sekundzie.
- `snapshot(state)`: zwraca kopię stanu do zapisu w bazie; nietrafiona para jest w niej już zakryta, a blokada zdjęta.
- `restoreGame(data)`: odtwarza stan z zapisu. Zwraca `null`, gdy dane są uszkodzone (zła liczba kart, symbol nie występuje dokładnie dwa razy, błędne `moves` lub `revealed`) albo partia jest wygrana.
- `normalizeLogin(raw)`: przycina spacje na brzegach i zamienia login na małe litery.
- `loginError(login)`: zwraca pusty tekst dla poprawnego loginu (3–20 znaków: małe litery, cyfry, `_ . -`) albo opis błędu.
- `passwordError(password)`: zwraca pusty tekst dla hasła z co najmniej 6 znakami albo opis błędu.

Widok nie zmienia stanu inaczej niż przez te funkcje.

## 6. Testy

Testy są w pliku `index.html`, uruchamiane przez otwarcie `index.html?test`. Wynik (liczba zaliczonych i niezaliczonych testów oraz opis błędów) wypisywany jest w konsoli przeglądarki i w widocznym bloku na stronie.

Minimalny zestaw przypadków:

1. Talia ma 30 kart, a każdy z 15 symboli występuje dokładnie dwa razy.
2. Ta sama funkcja losująca daje to samo ułożenie; tasowanie zmienia kolejność względem nieprzetasowanej talii.
3. Odkrycie pierwszej karty: karta w `revealed`, `moves` bez zmian.
4. Odkrycie pary: obie karty `matched: true`, `revealed` puste, `moves` = 1.
5. Odkrycie dwóch różnych kart: `locked: true`, `moves` = 1.
6. Kliknięcie w czasie blokady nie zmienia stanu.
7. Ponowne kliknięcie tej samej odkrytej karty nie zmienia stanu i nie liczy ruchu.
8. Kliknięcie znalezionej karty nie zmienia stanu.
9. `hideUnmatched` zakrywa obie karty i zdejmuje blokadę.
10. Znalezienie wszystkich 15 par ustawia `won: true`.
11. `flipCard` nie modyfikuje przekazanego obiektu stanu.
12. `snapshot` zakrywa nietrafioną parę, zdejmuje blokadę i nie zmienia stanu wejściowego.
13. `restoreGame` odtwarza zapisaną partię, a gra toczy się po niej dalej.
14. `restoreGame` odrzuca uszkodzone dane i wygraną partię.
15. `normalizeLogin` przycina spacje i zmienia login na małe litery.
16. `loginError` przepuszcza poprawne loginy i odrzuca za krótkie, za długie, ze spacją, wielkimi literami lub polskimi znakami.
17. `passwordError` wymaga co najmniej 6 znaków.

Testy nie łączą się z bazą; przy `?test` zapis w Supabase jest wyłączony.

### 6.1. Testy end-to-end (Playwright)

Drugi poziom testów klika w grę w prawdziwej przeglądarce (Chromium) tak jak gracz. Leżą w `tests/gra.spec.js`, konfiguracja w `playwright.config.js`. Gra nadal nie wymaga instalacji; Node.js i Playwright są potrzebne tylko do uruchomienia tych testów.

Uruchamianie (po jednorazowym `npm install` i `npx playwright install chromium`):

- `npm test`: testy lokalnego `index.html`, przed publikacją zmian.
- `npm run test:pages`: testy wersji opublikowanej na GitHub Pages (skrypt w składni Windows). Inny adres można podać w zmiennej `APP_URL`.
- `npm run zrzuty`: zrzuty ekranu kluczowych stanów gry do folderu `zrzuty/` (start, jedna odkryta karta, nietrafiona para, znalezione pary, wygrana).

Przypadki:

1. Start: 30 zakrytych kart w układzie 6 × 5, 15 symboli po dwa razy, „Ruchy: 0”, widoczny przycisk „Nowa gra”.
2. Pierwsza odkryta karta nie zmienia licznika.
3. Ponowne kliknięcie odkrytej karty nic nie zmienia.
4. Trafiona para zostaje oznaczona jako znaleziona, a kliknięcie znalezionej karty nic nie zmienia.
5. Nietrafiona para: blokada planszy, kliknięcie trzeciej karty jest ignorowane, po 0,5 s karty są jeszcze odkryte, a po około 1 s zakryte i blokada znika.
6. „Nowa gra” w trakcie partii zeruje licznik, zakrywa karty i tasuje talię.
7. Pełna partia (jedno pudło i 15 par) kończy się komunikatem „Brawo! Ukończono w 16 ruchach”; „Zagraj ponownie” zaczyna nową grę.
8. Bez dostępu do bazy gra działa i nie pokazuje rankingu ani pytania o wznowienie.
9. Wszystkie testy logiki z `index.html?test` są zaliczone.

W każdym przypadku test sprawdza też, że w konsoli nie ma błędów JS. Testy odczytują symbole kart ze strony, więc działają mimo losowego ułożenia talii.

Ruch do Supabase jest w testach blokowany, żeby nie zostawiały w bazie gości, partii ani wyników. Dlatego logowanie, ranking, zapis wyniku i wznawianie partii nie są objęte tymi testami; wymagałyby podstawionych odpowiedzi Supabase.

## 7. Kryteria akceptacji

- Otwarcie `index.html` dwuklikiem pokazuje planszę 6 × 5 (6 kolumn, 5 wierszy) z zakrytymi kartami i licznikiem „Ruchy: 0”.
- Pełną partię da się rozegrać do komunikatu o wygranej z poprawną liczbą ruchów.
- Szybkie klikanie trzeciej karty w czasie pokazywania nietrafionej pary nie psuje gry.
- „Nowa gra” w trakcie partii daje nowe ułożenie i zeruje licznik.
- `index.html?test` pokazuje wszystkie testy jako zaliczone.
- W konsoli przy zwykłej grze nie ma błędów.
- Rejestracja loginem i hasłem loguje gracza od razu; ponowne logowanie tym samym loginem i hasłem działa także w innej przeglądarce.
- Po wygranej zalogowanego gracza wynik sam trafia do rankingu z jego loginem, a profil pokazuje liczbę wygranych i najlepszy wynik.
- Wynik gościa nie trafia do rankingu; okno gratulacji pozwala się zalogować i wtedy wynik zapisuje się na koncie.
- Zamknięcie karty w trakcie partii i ponowne otwarcie gry proponuje wznowienie z tym samym ułożeniem i liczbą ruchów: gościowi w tej samej przeglądarce, zalogowanemu na dowolnym urządzeniu.
- Bez dostępu do bazy (brak konfiguracji, brak sieci, uśpiony projekt) gra działa jak dotąd, tylko bez rankingu i wznawiania.

## 8. Zapis w bazie (Supabase)

### 8.1. Gracz i konto

- Bez logowania gracz jest gościem: gra loguje go anonimowo w Supabase, sesja zostaje w przeglądarce, więc gość wznawia partię na tym samym urządzeniu i w tej samej przeglądarce.
- Konto zakłada się loginem i hasłem (link „Zaloguj się albo załóż konto” pod nagłówkiem). Login: 3–20 znaków, małe litery, cyfry oraz `_ . -`; wielkość liter przy wpisywaniu nie ma znaczenia. Hasło: co najmniej 6 znaków.
- Supabase loguje e-mailem, więc login zamienia się na techniczny adres `login@gracze.para-buch.pl`. Na ten adres nic nie jest wysyłane, dlatego w projekcie Supabase musi być wyłączone „Confirm email”, a hasła nie da się odzyskać.
- Profil (tabela `profiles`) powstaje razem z kontem (wyzwalacz w bazie) i przechowuje login. Pod nagłówkiem zalogowany gracz widzi swój login, liczbę wygranych i najlepszy wynik oraz link „Wyloguj”. Po wylogowaniu gra toczy się dalej jako nowy gość.

### 8.2. Zachowanie

- Po każdym ruchu stan partii zapisuje się w tabeli `games` (jeden wiersz na gracza, gościa albo konto). Partia bez ruchów i partia wygrana kasują zapis.
- Przy starcie, gdy w bazie jest przerwana partia z co najmniej jednym ruchem, gra pyta „Wznowić?”. „Wznów” przywraca ułożenie i licznik, „Zacznij od nowa” (albo „Nowa gra”) kasuje zapis.
- Po zalogowaniu gra sprawdza partię zapisaną na koncie. Jeśli jest inna niż bieżąca, pyta „Wznowić?”; „Graj obecną” zostawia bieżącą partię i zapisuje ją na koncie. Jeśli na koncie nic nie ma, bieżąca partia gościa przechodzi na konto.
- Do czasu odpowiedzi na pytanie o wznowienie gra nic nie zapisuje, żeby nie nadpisać przerwanej partii.
- Po wygranej zalogowanego gracza wynik sam trafia do tabeli `scores`. Gość widzi w oknie gratulacji link „Zaloguj się, żeby zapisać wynik”; po zalogowaniu albo rejestracji wynik zapisuje się na koncie.
- Pod tacą wyświetla się ranking 10 najlepszych wyników z loginami (najmniej ruchów, przy remisie wcześniejszy wynik wyżej).

### 8.3. Bezpieczeństwo

- W kodzie strony jest tylko publiczny klucz `anon`/`publishable`. Klucza `service_role` nie wolno umieszczać w kodzie.
- Reguły RLS: gracz czyta i zmienia tylko swoją partię; ranking i loginy czyta każdy; wynik dopisać może tylko gracz z kontem (nie gość) i tylko jako siebie; profil zakłada wyłącznie wyzwalacz w bazie.
- Ograniczenia w bazie: login jest unikalny i ma format jak w 8.1, liczba ruchów mieści się w zakresie 15–500. Gra działa bez serwera, więc wyniku nie da się w pełni zweryfikować; to świadomy kompromis.
- Hasła przechowuje Supabase Auth (hash); gra nie ma do nich dostępu.
