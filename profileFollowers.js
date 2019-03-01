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
      fs.appendFile('./Followers_Name_URL/followers_Hertado.csv', `${name}, ${link}\n`, (err) => {  
        if (err) throw err;
    });
      fs.appendFile('./Followers_URL/followers_Hertado.csv', `${link}\n`, (err) => {  
        if (err) throw err;
    });
   });
    return checkProfiles(links);
  }

  // call to loop through followers pages
  async function checkProfiles(links) {
    console.log(links);
    const start = async () => {
      await asyncForEach(links, async (val) => {
      await page.waitFor(5000);
      // await console.log(val);
      await page.goto(val);

      // wait for page to load before using cheerio
         await page.waitForSelector('._2nlw', {timeout: 3000});
         try {
          
      } catch (error) {
        console.log(error);
      }
 
         // gather content with cheerio
         let content = await page.content();
         var $ = cheerio.load(content);

         // gather profile data - first, last, links, hrefs
         var first = $('._2nlw').html().split(' ')[0];
         var last;
         let pageLinks = [];
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
         
         $('._50f3 a').each((i, el) => {
          // const info = $(el).text()
          // if (info.includes('works at') || (info.includes('at') && !(info.includes('former')) && !(info.includes('worked')))){
          //   // add links to pageLink array
            if($(el).attr('href')){
            let pageLink = $(el).attr('href');
            console.log(pageLink);
            pageLinks.push(pageLink);
            //  pageLinks.push(info)
          } 
      
    })
        let betterLink = "Links: ";
        //  const pageLinksFunc = async () => {
        //   await asyncForEach(pageLinks, async (url) => {
          for(let url of pageLinks){
          await console.log(url);
          let urlString = url.toString();
          await page.goto(urlString);
          await page.waitFor(5000);

          // load cheerio and push hrefs to puclicHref
          let content = await page.content();
          var $ = cheerio.load(content);
          if($('_v0m')){
            console.log("class found?");
            var jobSite = await $('._v0m a').attr('href');
            var jobSite1 = await $('._v0m a').text();
            await console.log(jobSite);
            await console.log(jobSite1);
            await publicHref.push($('._v0m a').text());
            betterLink +=  jobSite;
          } else if ($('._480u')) {
            var jobSite = await $('._480u a').attr('href');
            var jobSite1 = await $('._480u a').text();
            await publicHref.push($('._480u a').text());
            betterLink +=  jobSite;
          } 
        console.log(betterLink);
      }

         // loop through profile bullets checking for work

        await page.waitFor(5000);
        // let numOfPages = 
        // now for each page link we will go to that site 
        
        console.log(`${first}, ${last}, ${id}, ${publicHref}\n\n`);
        fs.appendFile('pageLinks_Hertado.csv', `${first}, ${last}, ${id}, ${publicHref}\n\n`, (err) => {  
          if (err) throw err;
          console.log('Big Write up!');
      });
        await page.waitFor(3000);
    })
    console.log('Done');
  }
  start();
}

console.log(`Saving new cookies to cache..`);
const cookies = await page.cookies();
await fcbCacheStore.setValue(cookiesStoreKey, cookies);
    await page.waitForRequest('https://www.google.com/', {timeout: 0});
}}
);