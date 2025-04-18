import puppeteer from 'puppeteer-core';
import chromium from 'chrome-aws-lambda';

async function trackParcel(orderID) {
  let browser = null;
  let trackingData = [];

  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      defaultViewport: chromium.defaultViewport,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    page.on('response', async (response) => {
      const url = response.url();
      const headers = response.headers();

      if (url.includes('/index/search?orderID=') && headers['content-type']?.includes('application/json')) {
        try {
          const json = await response.json();
          if (json.isOk === '1' && json.content) {
            trackingData = json.content.map(item => ({
              time: item.time,
              description: item.description
            }));
          }
        } catch (error) {
          console.error('Error parsing response JSON:', error);
        }
      }
    });

    await page.goto(`https://www.fycargo.com/index/search?no=${orderID}`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    if (trackingData.length > 0) {
      process.stdout.write(JSON.stringify({ status: 'success', tracking_info: trackingData }));
    } else {
      process.stdout.write(JSON.stringify({ status: 'error', message: 'No tracking data found' }));
    }
  } catch (error) {
    console.error('Error:', error);
    process.stdout.write(JSON.stringify({ 
      status: 'error', 
      message: 'An error occurred while processing the tracking request',
      error: error.message 
    }));
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

if (process.argv[1].endsWith('track.js')) {
  const orderID = process.argv[2];
  if (!orderID) {
    console.error('Please provide an order ID');
    process.exit(1);
  }
  trackParcel(orderID);
}