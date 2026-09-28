import { chromium } from './chromium';

describe('chromium', () => {
  it('VALID: {headless: true} => launches a real browser whose page evaluates an expression', async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await (await browser.newContext()).newPage();

    const result: unknown = await page.evaluate('1 + 2');
    await browser.close();

    expect(result).toBe(3);
  });
});
