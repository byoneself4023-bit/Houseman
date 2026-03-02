const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1500);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForTimeout(1500);
  
  // Login
  const inputs = await page.$$('input');
  await inputs[0].fill('010-5560-8245');
  await inputs[1].fill('8245');
  await page.waitForTimeout(200);
  const loginBtn = await page.$('button');
  await loginBtn.click();
  await page.waitForTimeout(2000);
  
  // Click 임차인정보 in sidebar using text content matching
  await page.evaluate(() => {
    document.querySelectorAll('div').forEach(el => {
      if (el.innerText === '임차인정보' || el.textContent.trim() === '👤임차인정보') el.click();
    });
  });
  await page.waitForTimeout(2000);
  
  // Screenshot list
  await page.screenshot({ path: 'screenshot_tenants_list.png' });
  
  // Click first data row
  await page.evaluate(() => {
    const tds = document.querySelectorAll('td');
    for (const td of tds) {
      if (td.textContent.includes('윤슬기')) { td.closest('tr').click(); return; }
    }
  });
  await page.waitForTimeout(2000);
  
  // Scroll to see 입주사진
  await page.evaluate(() => {
    const scrollable = document.querySelector('div[style*="overflow-y: auto"]') || document.querySelector('div[style*="overflow: auto"]');
    if (scrollable) scrollable.scrollTop = 500;
    else window.scrollTo(0, 500);
  });
  await page.waitForTimeout(500);
  
  await page.screenshot({ path: 'screenshot_tenant_detail.png' });
  console.log('Done');
  await browser.close();
})();
