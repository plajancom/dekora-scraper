const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Gå till inloggningssidan
  await page.goto('https://shop.dekora.se/#/login', { waitUntil: 'networkidle2' });
  await page.waitForTimeout(3000); // ge tid för allt att laddas

  // Fyll i användarnamn och lösenord
  await page.type('input[type="email"]', 'info@hemochantverk.se');
  await page.type('input[type="password"]', 'Mira2024!!');

  // Klicka på LOGGA IN-knappen
  await page.click('button');

  // Vänta tills du loggats in och startsidan laddats
  await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {}); // vissa SPAs navigerar inte klassiskt
  await page.waitForTimeout(5000); // vänta extra för säkerhets skull

  // Gå till produktlistan
  await page.goto('https://shop.dekora.se/#/home?limit=6000&batchSize=6000', { waitUntil: 'networkidle2', timeout: 0 });
  await page.waitForTimeout(5000); // igen, ge tid att ladda

  // Scrapa produkterna
  const products = await page.evaluate(() => {
    const data = [];
    const items = document.querySelectorAll('.product-tile');
    items.forEach(item => {
      const name = item.querySelector('.product-name')?.innerText || '';
      const sku = item.querySelector('.product-sku')?.innerText || '';
      const stockText = item.querySelector('.product-stock')?.innerText || '';
      const stockMatch = stockText.match(/(\d+)/);
      const stock = stockMatch ? parseInt(stockMatch[1]) : null;
      data.push({ sku, name, stock });
    });
    return data;
  });

  fs.writeFileSync('dekora_products.json', JSON.stringify(products, null, 2));
  console.log(`✅ ${products.length} produkter sparade till dekora_products.json`);

  await browser.close();
})();
