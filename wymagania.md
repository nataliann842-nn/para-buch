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
- Testy logiki uruchamiane w przeglądarce.
- Zapis w bazie Supabase (sekcja 8): wspólny ranking 10 najlepszych wyników z nickiem oraz wznawianie przerwanej partii.

### 2.2. Poza zakresem

- Poziomy trudności i zmiana rozmiaru planszy.
- Stoper i pomiar czasu.
- Konta graczy z logowaniem (gracz jest anonimowy, wznawianie działa w tej samej przeglądarce).
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
- Karta zakryta ma jednolity rewers; karta odkryta pokazuje emoji; karta znaleziona jest wizualnie odróżniona (np. przygaszona lub z obramowaniem).
- Odwracanie karty jest animowane (obrót w osi Y, CSS `transform: rotateY` z `backface-visibility: hidden`), czas animacji około 0,3 s.
- Komunikat o wygranej wyświetlany nad planszą lub jako nakładka, z przyciskiem „Zagraj ponownie”.
- Docelowe środowisko: aktualna przeglądarka na komputerze (Chrome, Edge, Firefox).

## 5. Architektura

### 5.1. Plik

Cała gra mieści się w jednym pliku `index.html`, otwieranym dwuklikiem, bez serwera, bundlera ani instalacji zależności. Jedyna zewnętrzna zależność to biblioteka `supabase-js` z CDN (jsDelivr). Plik zawiera:

1. `<style>`: wygląd i animacja.
2. `<script>` z logiką gry: czyste funkcje, bez żadnych odwołań do DOM, `window` ani timerów.
3. `<script>` z zapisem w Supabase (obiekt `store`): logowanie anonimowe, zapis partii, ranking.
4. `<script>` z widokiem: rysowanie planszy na podstawie stanu, obsługa kliknięć, `setTimeout` na 1 sekundę po nietrafionej parze.
5. `<script>` z testami: uruchamiany tylko przy adresie z parametrem `?test`.

Schemat bazy (tabele i reguły dostępu) jest w pliku `supabase/schema.sql`.

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
- `normalizeNick(raw)`: przycina spacje na brzegach, skleja wielokrotne spacje i skraca nick do 20 znaków.

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
15. `normalizeNick` poprawia spacje i długość nicku.

Testy nie łączą się z bazą; przy `?test` zapis w Supabase jest wyłączony.

## 7. Kryteria akceptacji

- Otwarcie `index.html` dwuklikiem pokazuje planszę 6 × 5 (6 kolumn, 5 wierszy) z zakrytymi kartami i licznikiem „Ruchy: 0”.
- Pełną partię da się rozegrać do komunikatu o wygranej z poprawną liczbą ruchów.
- Szybkie klikanie trzeciej karty w czasie pokazywania nietrafionej pary nie psuje gry.
- „Nowa gra” w trakcie partii daje nowe ułożenie i zeruje licznik.
- `index.html?test` pokazuje wszystkie testy jako zaliczone.
- W konsoli przy zwykłej grze nie ma błędów.
- Po wygranej i zapisaniu nicku wynik pojawia się w rankingu.
- Zamknięcie karty w trakcie partii i ponowne otwarcie gry w tej samej przeglądarce proponuje wznowienie z tym samym ułożeniem i liczbą ruchów.
- Bez dostępu do bazy (brak konfiguracji, brak sieci, uśpiony projekt) gra działa jak dotąd, tylko bez rankingu i wznawiania.

## 8. Zapis w bazie (Supabase)

### 8.1. Gracz

Przy pierwszym wejściu gra loguje gracza anonimowo w Supabase. Sesja zostaje w przeglądarce, więc wznawianie działa na tym samym urządzeniu i w tej samej przeglądarce. Nick podaje się dopiero przy zapisie wyniku i jest zapamiętywany w `localStorage` jako podpowiedź na następny raz.

### 8.2. Zachowanie

- Po każdym ruchu stan partii zapisuje się w tabeli `games` (jeden wiersz na gracza). Partia bez ruchów i partia wygrana kasują zapis.
- Przy starcie, gdy w bazie jest przerwana partia z co najmniej jednym ruchem, gra pyta „Wznowić?”. „Wznów” przywraca ułożenie i licznik, „Zacznij od nowa” (albo „Nowa gra”) kasuje zapis.
- Do czasu odpowiedzi na to pytanie gra nic nie zapisuje, żeby nie nadpisać przerwanej partii.
- Po wygranej okno gratulacji ma pole na nick i przycisk „Zapisz wynik”. Wynik trafia do tabeli `scores`.
- Pod tacą wyświetla się ranking 10 najlepszych wyników (najmniej ruchów, przy remisie wcześniejszy wynik wyżej).

### 8.3. Bezpieczeństwo

- W kodzie strony jest tylko publiczny klucz `anon`/`publishable`. Klucza `service_role` nie wolno umieszczać w kodzie.
- Reguły RLS: gracz czyta i zmienia tylko swoją partię; ranking czyta każdy, a dopisać wynik można tylko jako zalogowany gracz i tylko jako siebie.
- Ograniczenia w bazie: nick ma 1–20 znaków, liczba ruchów mieści się w zakresie 15–500. Gra działa bez serwera, więc wyniku nie da się w pełni zweryfikować; to świadomy kompromis.
