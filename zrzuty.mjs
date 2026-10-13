// Zrzuty ekranu kluczowych stanów gry pod przyszłe testy Playwright.
// Ruch do Supabase jest blokowany, żeby nie zostawiać w bazie gości ani zapisów partii.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const URL = process.env.APP_URL || 'https://nataliann842-nn.github.io/para-buch/';
const OUT = 'zrzuty';

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
await page.route(/supabase\.co/, route => route.abort());

const errors = [];
page.on('pageerror', e => errors.push(e.message));

const shot = async name => {
  await page.waitForTimeout(500); // obrót karty trwa ok. 0,3 s
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  console.log('zapisano', name);
};

await page.goto(URL, { waitUntil: 'networkidle' });
const cards = page.locator('#board .card');
await cards.first().waitFor();

// Pozycje par na podstawie symboli z DOM
const symbols = await cards.locator('.front').allTextContents();
const pairs = {};
symbols.forEach((s, i) => (pairs[s] ||= []).push(i));
const pairList = Object.values(pairs);

// 1. Start: 30 zakrytych kart, Ruchy: 0
await shot('01-start');

// 2. Pierwsza odkryta karta, licznik bez zmian
await cards.nth(pairList[0][0]).click();
await shot('02-jedna-odkryta');

// 3. Nietrafiona para: obie odkryte, plansza zablokowana, Ruchy: 1
await cards.nth(pairList[1][0]).click();
await shot('03-nietrafiona-para');
await page.waitForTimeout(1200); // karty zakrywają się po 1 s

// 4. Kilka znalezionych par w trakcie gry
for (const [a, b] of pairList.slice(0, 4)) {
  await cards.nth(a).click();
  await cards.nth(b).click();
}
await shot('04-znalezione-pary');

// 5. Wygrana: komunikat „Brawo! Ukończono w N ruchach”
for (const [a, b] of pairList.slice(4)) {
  await cards.nth(a).click();
  await cards.nth(b).click();
}
await page.locator('#win').waitFor({ state: 'visible' });
await shot('05-wygrana');

console.log('Ruchy:', await page.locator('#moves').textContent());
console.log('Komunikat:', await page.locator('#win-text').textContent());
console.log('Błędy JS:', errors.length ? errors : 'brak');
await browser.close();
