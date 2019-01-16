const Apify = require('apify');
const cheerio = require('cheerio');
const login = require('./input.js');
const fs = require('fs');
const csv = require('csv-parser');

// Write to CSV files
const writeStream = fs.createWriteStream('theFollowers.csv');
fs.appendFile('theFollowers.csv', `Name, User\n`, (err) => {  
  if (err) throw err;
  // console.log('Created!');
});

fs.appendFile('pageLinks.csv', `First, Last, ID, Links, Job Links\n`, (err) => {  
  if (err) throw err;
  // console.log('Created!');
});


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

  // Load the specified page
  const page = await browser.newPage('')
  let isLogged = false;
  let scrollEnd;
  let userCookies = await fcbCacheStore.getValue(cookiesStoreKey);
  if (userCookies) {
      console.log('Try to use cookies from cache..')
      await page.setCookie(...userCookies);
      await page.goto('https://facebook.com');
      await page.waitFor(1000);
      var url = 'https://www.facebook.com/search/630667773952436/likers?ref=about';
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
      await page.waitFor(12000);
      // new body height after scroll pagination
      const newBodyHandle = await page.$('body');
      const { height: newHeight } = await newBodyHandle.boundingBox();
      console.log("newHeight");
      console.log(newHeight);

      if (scrollEnd == 1){
        console.log("end of pagination");
        await page.waitFor(1000);
        followerRev(page);
      }

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
      fs.appendFile('theFollowers.csv', `${name}, ${link}\n\n`, (err) => {  
        if (err) throw err;
    });
   });
    checkProfiles(links);
  }

  // call to loop through followers pages
  async function checkProfiles(links) {
    console.log(links);
    links.forEach(async (val) => {
      await console.log(val);
      await page.goto(val);

      // wait for page to load before using cheerio
         await page.waitForSelector('._2nlw', 2000);
 
         // gather content with cheerio
         let content = await page.content();
         var $ = cheerio.load(content);

         // gather profile data - first, last, links, hrefs
         var first = $('._2nlw').html().split(' ')[0];
         var last;
         var pageLinks = [];
         var publicHref = [];

         // get fb id
         var initialId = $('._6-6:first-of-type').attr('href');
         var firstCut = initialId.indexOf('%');
         var lastCut = initialId.lastIndexOf('%');
         var id = initialId.slice(firstCut + 3, lastCut);

         // check that theirs no initials or middle name before last name
         var nameArr = $('._2nlw').html().split(' ');
         if (nameArr.length <= 3){
             last = nameArr[(nameArr.length - 1)];
         } else {
             last = nameArr[1];
         }

         // loop through profile bullets checking for work
          await $('._50f3').each((i, el) => {
            const info = $(el).text()
            if (info.includes('works at') || (info.includes('at') && !(info.includes('former')) && !(info.includes('worked')))){
              // add links to pageLink array
               pageLinks.push($(el).attr('href'));
            }
        })
        await page.waitFor(2000);
        // let numOfPages = 
        // now for each page link we will go to that site 
        for(let url of pageLinks){
          await console.log(pageLinks);
          await console.log(url);
          let urlString = url.toString();
          await page.goto(urlString);
          await page.waitFor(2000);

          // load cheerio and push hrefs to puclicHref
          let content = await page.content();
          var $ = cheerio.load(content);
          await publicHref.push($('._v0m').attr(href));
        }
        console.log(`${first}, ${last}, ${id},  ${pageLinks}, \n ${publicHref}\n\n`);
        await fs.appendFile('pageLinks.csv', `${first}, ${last}, ${id}, \n ${pageLinks}, \n ${publicHref}\n\n`, (err) => {  
          if (err) throw err;
          console.log('Big Write up!');
      });
        await page.waitFor(2000);
    
    })
}

// foreach checkers for all prospects should run out and we are handled



 // list anchors 
         // go to first anchor
         // if href to site is there click through
         // else go to next anchor
         // if end of list register data gathered and move to next link


// END PROGRAM

console.log(`Saving new cookies to cache..`);
const cookies = await page.cookies();
await fcbCacheStore.setValue(cookiesStoreKey, cookies);
    await page.waitForRequest('https://www.google.com/', {timeout: 0});
}}
);