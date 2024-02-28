import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({headless: false});
  const page = await browser.newPage();

  await page.goto('https://instagram.com/');
  await page.screenshot({path: 'example.png'});

  console.log('Olá, mundo!');

  await browser.close();
})();