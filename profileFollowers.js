const Apify = require('apify');
const cheerio = require('cheerio');
const login = require('./input.js');
const fs = require('fs');
const csv = require('csv-parser');

// Write to CSV files
const writeStream = fs.createWriteStream('./Followers_URL/followers_Hertado.csv');
fs.appendFile('./Followers_Name_URL/followers_Hertado.csv', `Name, URL\n`, (err) => {  
  if (err) throw err;
});
fs.appendFile('./Followers_URL/followers_Hertado.csv', `URL\n`, (err) => {  
  if (err) throw err;
});

// 295411244658946 - Hurtado
// 1879817268783466 - Umberg
// 679465275558823 - Caballero
// 390109821741008 - Rubio

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

// Start program
Apify.main(async () => {
  const fcbCacheStore = await Apify.openKeyValueStore('fcb-cache');
  const cookiesStoreKey = login.username.replace('@', '(at)');
  const browser = await Apify.launchPuppeteer();

  async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
  }
  // Load the specified page
  const page = await browser.newPage('')
  let isLogged = false;
  let scrollEnd;
  let userCookies = await fcbCacheStore.getValue(cookiesStoreKey);
  if (userCookies) {
      console.log('Try to use cookies from cache..')
      await page.setCookie(...userCookies);
      await page.goto('https://facebook.com');
      await page.waitFor(2000);
      var url = 'https://www.facebook.com/search/295411244658946/likers?ref=about';
      await page.goto(url, {waitUntil: 'load'});
      await scroller();

    // Get the height of the rendered page
    async function scroller() {
      // body heigh of page
      let bodyHandle = await page.$('body');
      let { height } = await bodyHandle.boundingBox();
      console.log("height");
      console.log(height);
      await bodyHandle.dispose();
      await page.evaluate(scrolling => {
          window.scrollTo(0, document.body.scrollHeight)
        });
      await page.waitFor(50000);
      // new body height after scroll pagination
      const newBodyHandle = await page.$('body');
      const { height: newHeight } = await newBodyHandle.boundingBox();
      console.log("newHeight");
      console.log(newHeight);

      if (scrollEnd == 1){
        console.log("end of pagination");
        await page.waitFor(3000);
        return followerRev(page);
      } else {
          // if scroll continues to render a new height then rescroll
          if (height < newHeight){
            console.log("rescroll");
            scroller();
          }
          // else we are at the end of scroll, move on
          else {
            scrollEnd = 1;
            scroller();
          }
      }      
  }

  // gather all follower links on page
  async function followerRev(page){
    let content = await page.content();
    var names = [];
    var links = [];
    var $ = cheerio.load(content);
    $('._32mo').each(function() {
      var link = $(this).attr('href');
      var name = $(this).text();
      links.push(link);
      names.push({"name": name})
      fs.appendFile('./Followers_Name_URL/followers_Hertado.csv', `${name}, ${link}\n`, (err) => {  
        if (err) throw err;
    });
      fs.appendFile('./Followers_URL/followers_Hertado.csv', `${link}\n`, (err) => {  
        if (err) throw err;
    });
   });
    return;
  }

console.log(`Saving new cookies to cache..`);
const cookies = await page.cookies();
await fcbCacheStore.setValue(cookiesStoreKey, cookies);
    await page.waitForRequest('https://www.google.com/', {timeout: 0});
}}
);