const Apify = require('apify');
const cheerio = require('cheerio');
const login = require('./input.js');
const fs = require('fs');

const writeStream = fs.createWriteStream('profileFollowers.csv');

// write to csv
writeStream.write(`First, Last, Link, Info, ID\n`);

const loggedCheck = async (page) => {
  try {
      await page.waitForSelector('#bluebarRoot', { timeout: 10000 });
      return true;
  } catch(err) {
      return false;
  }
};

function wait (ms) {
  return new Promise(resolve => setTimeout(() => resolve(), ms));
}
Apify.main(async () => {
  const fcbCacheStore = await Apify.openKeyValueStore('fcb-cache');
  const cookiesStoreKey = login.username.replace('@', '(at)');
  const browser = await Apify.launchPuppeteer();
  // Load the specified page
  const page = await browser.newPage('')
  let isLogged = false;
  let userCookies = await fcbCacheStore.getValue(cookiesStoreKey);
  if (userCookies) {
      console.log('Try to use cookies from cache..')
      await page.setCookie(...userCookies);
      await page.goto('https://facebook.com');
      await page.waitFor(1000);
      var url = 'https://www.facebook.com/search/126029561363720/likers?ref=about';
      await page.goto(url, {waitUntil: 'load'});

    // Get the height of the rendered page
    const bodyHandle = await page.$('body');
    const { height } = await bodyHandle.boundingBox();
    console.log(bodyHandle);
    console.log(height);
    await bodyHandle.dispose();

    // Scroll one viewport at a time, pausing to let content load
    const viewportHeight = page.viewport().height;
    let viewportIncr = 0;
    while (viewportIncr + viewportHeight < height) {
      await page.evaluate(_viewportHeight => {
        window.scrollBy(0, _viewportHeight);
      }, viewportHeight);
      await wait(20);
      viewportIncr = viewportIncr + viewportHeight;
    }

    // Scroll back to top
    await page.evaluate(_ => {
      window.scrollTo(0, 0);
    });

    // Some extra delay to let images load
    await wait(1000);
    let content = await page.content();
    var $ = cheerio.load(content);
    // var first = $('._32mo:first-of-type').includes('a').attr('href');
    // console.log(first);
    
    // await browser.newPage(first);
}

// if (!isLogged) {
//   console.log(`Cookies from cache didn't work, try to login..`);
//   await page.goto('https://facebook.com');
//   await page.type('#email', login.username);
//   await page.type('#pass', login.password);
//   await page.click('#loginbutton input');
//   await page.waitForNavigation();
// }

// if (!isLogged) {
//   throw new Error('Incorrect username or password!')
// }

console.log(`Saving new cookies to cache..`);
const cookies = await page.cookies();
await fcbCacheStore.setValue(cookiesStoreKey, cookies);
await page.waitFor(100000);
});