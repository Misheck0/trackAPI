import puppeteer from 'puppeteer'; // Use full puppeteer instead of puppeteer-core
import chromium from '@sparticuz/chromium-min'; // More reliable for Render.com

export async function trackParcel(orderID) { // Add 'export' keyword here
  let browser;
  try {
    browser = await puppeteer.launch({
      args: [...chromium.args, '--hide-scrollbars', '--disable-web-security'],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    let trackingData = [];
    page.on('response', async (response) => {
      if (response.url().includes('/index/search?orderID=')) {
        try {
          const json = await response.json();
          if (json.isOk === '1') trackingData = json.content.map(({ time, description }) => ({ time, description }));
        } catch (e) {}
      }
    });

    await page.goto(`https://www.fycargo.com/index/search?no=${orderID}`, {
      waitUntil: 'networkidle2',
      timeout: 15000
    });

    await new Promise(r => setTimeout(r, 2000));
    return { status: 'success', tracking_info: trackingData };
  } catch (error) {
    console.error('Tracking error:', error);
    return { status: 'error', message: 'Tracking failed', error: error.message };
  } finally {
    if (browser) await browser.close();
  }
}

// Handle both CLI and module usage
if (process.argv[1].endsWith('track.js')) {
  trackParcel(process.argv[2]).then(result => {
    process.stdout.write(JSON.stringify(result));
  });
}