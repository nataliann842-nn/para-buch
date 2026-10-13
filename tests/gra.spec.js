const { test, expect } = require('@playwright/test');

// Ruch do Supabase jest blokowany: testy nie mogą zostawiać w bazie gości, partii ani wyników
test.beforeEach(async ({ page }, testInfo) => {
  await page.route(/supabase\.co/, route => route.abort());
  testInfo.errors = [];
  page.on('pageerror', e => testInfo.errors.push(e.message));
  page.on('console', msg => {
    // Nieudane żądania do zablokowanej bazy są oczekiwane, inne błędy konsoli nie
    if (msg.type() === 'error' && !/Failed to load resource|supabase/i.test(msg.text())) {
      testInfo.errors.push(msg.text());
    }
  });
});

test.afterEach(async ({}, testInfo) => {
  expect(testInfo.errors, 'błędy JS w konsoli').toEqual([]);
});

// Otwiera grę i zwraca karty oraz pary indeksów odczytane z symboli w DOM
async function openGame(page) {
  await page.goto('index.html');
  const cards = page.locator('#board .card');
  await expect(cards).toHaveCount(30);
  return { cards, pairs: await readPairs(cards) };
}

async function readPairs(cards) {
  const symbols = await cards.locator('.front').allTextContents();
  const bySymbol = {};
  symbols.forEach((s, i) => (bySymbol[s] ||= []).push(i));
  return Object.values(bySymbol);
}

async function findPair(cards, [a, b]) {
  await cards.nth(a).click();
  await cards.nth(b).click();
}

test('start: 30 zakrytych kart w układzie 6 × 5 i „Ruchy: 0”', async ({ page }) => {
  const { cards, pairs } = await openGame(page);

  await expect(page.locator('h1')).toHaveText('Para Buch!');
  await expect(page.locator('#moves')).toHaveText('Ruchy: 0');
  await expect(page.locator('#board .card.revealed, #board .card.matched')).toHaveCount(0);
  await expect(page.locator('#new-game')).toBeVisible();
  await expect(page.locator('#win')).toBeHidden();

  // 15 różnych symboli, każdy dokładnie dwa razy
  expect(pairs).toHaveLength(15);
  for (const pair of pairs) expect(pair).toHaveLength(2);

  // 6 kolumn i 5 wierszy liczone po położeniu kart
  const boxes = await cards.evaluateAll(els => els.map(el => el.getBoundingClientRect()));
  const rows = new Set(boxes.map(b => Math.round(b.top / 20)));
  expect(rows.size).toBe(5);
  expect(boxes.filter(b => Math.round(b.top / 20) === Math.round(boxes[0].top / 20))).toHaveLength(6);
});

test('pierwsza odkryta karta nie liczy ruchu', async ({ page }) => {
  const { cards, pairs } = await openGame(page);

  await cards.nth(pairs[0][0]).click();

  await expect(cards.nth(pairs[0][0])).toHaveClass(/revealed/);
  await expect(page.locator('#board .card.revealed')).toHaveCount(1);
  await expect(page.locator('#moves')).toHaveText('Ruchy: 0');
});

test('ponowne kliknięcie odkrytej karty nic nie zmienia', async ({ page }) => {
  const { cards, pairs } = await openGame(page);

  await cards.nth(pairs[0][0]).click();
  await cards.nth(pairs[0][0]).click();

  await expect(page.locator('#board .card.revealed')).toHaveCount(1);
  await expect(page.locator('#moves')).toHaveText('Ruchy: 0');
});

test('trafiona para zostaje odkryta i oznaczona jako znaleziona', async ({ page }) => {
  const { cards, pairs } = await openGame(page);

  await findPair(cards, pairs[0]);

  await expect(page.locator('#moves')).toHaveText('Ruchy: 1');
  for (const i of pairs[0]) await expect(cards.nth(i)).toHaveClass(/matched/);
  await expect(page.locator('#board .card.matched')).toHaveCount(2);
  await expect(page.locator('#board')).not.toHaveClass(/locked/);

  // Kliknięcie znalezionej karty nic nie zmienia
  await cards.nth(pairs[0][0]).click();
  await expect(page.locator('#moves')).toHaveText('Ruchy: 1');
  await expect(page.locator('#board .card.revealed')).toHaveCount(0);
});

test('nietrafiona para: blokada, kliknięcia ignorowane, zakrycie po ok. 1 s', async ({ page }) => {
  const { cards, pairs } = await openGame(page);
  const [a, b, third] = [pairs[0][0], pairs[1][0], pairs[2][0]];

  await cards.nth(a).click();
  await cards.nth(b).click();

  await expect(page.locator('#moves')).toHaveText('Ruchy: 1');
  await expect(page.locator('#board')).toHaveClass(/locked/);
  await expect(page.locator('#board .card.revealed')).toHaveCount(2);

  // Szybkie kliknięcie trzeciej karty w czasie blokady
  await cards.nth(third).click({ force: true });
  await expect(cards.nth(third)).not.toHaveClass(/revealed/);
  await expect(page.locator('#moves')).toHaveText('Ruchy: 1');

  // Karty jeszcze widać po 0,5 s, a po ok. 1 s są zakryte i blokada znika
  await page.waitForTimeout(500);
  await expect(page.locator('#board .card.revealed')).toHaveCount(2);
  await expect(page.locator('#board .card.revealed')).toHaveCount(0, { timeout: 1500 });
  await expect(page.locator('#board')).not.toHaveClass(/locked/);
  await expect(page.locator('#board .card.matched')).toHaveCount(0);

  // Po blokadzie gra toczy się dalej
  await cards.nth(third).click();
  await expect(cards.nth(third)).toHaveClass(/revealed/);
});

test('„Nowa gra” w trakcie partii zeruje licznik i tasuje talię', async ({ page }) => {
  const { cards, pairs } = await openGame(page);
  const before = await cards.locator('.front').allTextContents();

  await findPair(cards, pairs[0]);
  await cards.nth(pairs[1][0]).click();
  await page.locator('#new-game').click();

  await expect(page.locator('#moves')).toHaveText('Ruchy: 0');
  await expect(cards).toHaveCount(30);
  await expect(page.locator('#board .card.revealed, #board .card.matched')).toHaveCount(0);
  await expect(page.locator('#board')).not.toHaveClass(/locked/);
  expect(await cards.locator('.front').allTextContents()).not.toEqual(before);
});

test('pełna partia kończy się komunikatem o wygranej z poprawną liczbą ruchów', async ({ page }) => {
  const { cards, pairs } = await openGame(page);

  // Jedno pudło, potem wszystkie 15 par: razem 16 ruchów
  await cards.nth(pairs[0][0]).click();
  await cards.nth(pairs[1][0]).click();
  await expect(page.locator('#board')).not.toHaveClass(/locked/, { timeout: 2000 });
  for (const pair of pairs) await findPair(cards, pair);

  await expect(page.locator('#win')).toBeVisible();
  await expect(page.locator('#win-text')).toHaveText('Brawo! Ukończono w 16 ruchach');
  await expect(page.locator('#moves')).toHaveText('Ruchy: 16');
  await expect(page.locator('#board .card.matched')).toHaveCount(30);

  // „Zagraj ponownie” działa jak „Nowa gra”
  await page.locator('#play-again').click();
  await expect(page.locator('#win')).toBeHidden();
  await expect(page.locator('#moves')).toHaveText('Ruchy: 0');
  await expect(page.locator('#board .card.revealed, #board .card.matched')).toHaveCount(0);
});

test('gra działa bez bazy: nie pokazuje rankingu ani pytania o wznowienie', async ({ page }) => {
  await openGame(page);

  await expect(page.locator('#ranking')).toBeHidden();
  await expect(page.locator('#resume')).toBeHidden();
});

test('testy logiki w index.html?test są wszystkie zaliczone', async ({ page }) => {
  await page.goto('index.html?test');

  const results = page.locator('#test-results');
  await expect(results).toBeVisible();
  await expect(results.locator('strong')).toContainText('0 niezaliczonych');
  await expect(results.locator('.fail')).toHaveCount(0);
  expect(await results.locator('.pass').count()).toBeGreaterThanOrEqual(17);
});
