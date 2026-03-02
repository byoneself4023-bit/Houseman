const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1500);
  
  // Clear localStorage
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForTimeout(1500);
  
  // Fill login fields with correct credentials
  const inputs = await page.$$('input');
  if (inputs.length >= 2) {
    await inputs[0].fill('010-5560-8245');
    await inputs[1].fill('8245');
    await page.waitForTimeout(300);
  }
  
  // Click 로그인 button
  const btns = await page.$$('button');
  for (const btn of btns) {
    const text = await btn.textContent();
    if (text && text.trim() === '로그인') {
      await btn.click();
      break;
    }
  }
  await page.waitForTimeout(2000);
  
  // Navigate to 공실 관리 via evaluate
  await page.evaluate(() => {
    const els = document.querySelectorAll('div');
    for (const el of els) {
      const t = el.textContent.trim();
      if (t === '📭공실 관리' || t === '공실 관리') {
        el.click();
        return true;
      }
    }
    return false;
  });
  await page.waitForTimeout(2000);
  
  await page.screenshot({ path: 'screenshot_vacancy.png', fullPage: false });
  console.log('Vacancy screenshot saved');
  
  // Navigate to 임차인정보
  await page.evaluate(() => {
    const els = document.querySelectorAll('div');
    for (const el of els) {
      const t = el.textContent.trim();
      if (t === '👤임차인정보' || t === '임차인정보') {
        el.click();
        return true;
      }
    }
    return false;
  });
  await page.waitForTimeout(2000);
  
  await page.screenshot({ path: 'screenshot_tenants.png', fullPage: false });
  console.log('Tenants screenshot saved');
  
  await browser.close();
})();
