const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 10000 });

  // Type phone number directly
  const phoneInput = await page.$('input[placeholder="010-0000-0000"]');
  await phoneInput.click({ clickCount: 3 });
  await phoneInput.type('010-5560-8245');

  // Type password
  const pwInput = await page.$('input[placeholder="비밀번호 입력"]');
  await pwInput.click();
  await pwInput.type('8245');
  await new Promise(r => setTimeout(r, 300));

  // Click login button
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent.trim(), btn);
    if (text === '로그인') {
      await btn.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1500));

  // Click sidebar "건물·호실정보" - target the sidebar area (left 220px)
  await page.evaluate(() => {
    const sidebar = document.querySelector('div'); // root
    const allDivs = document.querySelectorAll('div');
    for (const div of allDivs) {
      const rect = div.getBoundingClientRect();
      // Sidebar items are on the left side (x < 220) and have the menu text
      if (rect.left < 220 && rect.width < 220 && div.textContent.includes('호실정보') && !div.textContent.includes('대시보드')) {
        const innerSpans = div.querySelectorAll('span');
        for (const span of innerSpans) {
          if (span.textContent.includes('호실정보')) {
            span.parentElement.click();
            return;
          }
        }
        div.click();
        return;
      }
    }
  });
  await new Promise(r => setTimeout(r, 1000));

  await page.screenshot({ path: 'preview_buildings.png', fullPage: false });
  console.log('Buildings page saved');

  await browser.close();
})();
