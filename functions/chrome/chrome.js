const chromium = require('chrome-aws-lambda')
const puppeteer = require('puppeteer-core')

exports.handler = async (event, context, callback) => {
  let jsonData = null
  let browser = null
  console.log('spawning chrome headless')
  try {
    const executablePath = await chromium.executablePath

    // setup
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: executablePath,
      headless: chromium.headless,
    })

    const page = await browser.newPage();

    // Do stuff with headless chrome
    await page.setViewport({ width: 800, height: 600 });
    await page.goto("https://secure.brandnewday.nl/service/fondsen-en-koersen");
    await page.waitFor(500);
    await page.select("#fundID", "7001");
    await page.waitFor(500);

    jsonData = await page.evaluate(() => {
      const rowNodeList = document.querySelectorAll('table.table');
      const rowArray = Array.from(rowNodeList);
      return rowArray.slice(0,-1).map(tr => {
        dataNodeList = tr.querySelectorAll('td');
        const dataArray = Array.from(dataNodeList);
        let fundValue = dataArray[1].textContent;

        if (fundValue.match('€ ')) {
          fundValue = fundValue.substring(2)
        }

        return {fundValue};
      })
    });

  } catch (error) {
    console.log('error', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error
      })
    };
  } finally {
    // close browser
    if (browser !== null) {
      await browser.close();
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify(jsonData)
  };
}