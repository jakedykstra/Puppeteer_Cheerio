const Apify = require('apify');
const cheerio = require('cheerio');
const login = require('./input.js');
const fs = require('fs');
const csv = require('csv-parser');

var followersArr = [];

fs.createReadStream('./Followers_URL/followers_Rubio.csv')
.pipe(csv())
.on('data', function(data){
    try {
       followersArr.push(data['URL']);
    }
    catch(err) {
    }
})
.on('end',function(){
    console.log(followersArr);
});  

fs.appendFile('./Page_Links/pageLinks_Rubio.csv', `First, Last, ID, Job Links\n`, (err) => {  
  if (err) throw err;
});


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
      await page.waitFor(1000);
      await page.goto('https://www.facebook.com');
      await page.waitFor(10000);
      var url = 'https://www.facebook.com/search/';
      await page.goto(url, {waitUntil: 'load'});
      await checkProfiles();
  }

  // call to loop through followers pages
  async function checkProfiles() {
    const start = async () => {
      await asyncForEach(followersArr, async (val, i) => {
      await page.waitFor(5000);
      try {await page.goto(val);
        if (i == 80) {
          await page.waitFor(1500000);
        }
    }
      catch (error){
        console.log("error");
        console.log(error);
      }

      // wait for page to load before using cheerio
      try {
        await page.waitForSelector('._2nlw', {timeout: 3000});          
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
            if($(el).attr('href')){
            let pageLink = $(el).attr('href');
            console.log(pageLink);
            pageLinks.push(pageLink);
          } 
      
    })
        let betterLink = "Links: ";
          for(let url of pageLinks){
          await console.log(url);
          let urlString = url.toString();
          try {
            await page.goto(urlString)
            await page.waitFor(5000);

            // load cheerio and push hrefs to puclicHref
            let content = await page.content();
            var $ = cheerio.load(content);
            if($('_v0m')){
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
          } catch {
            continue;
          }
         
      }

         // loop through profile bullets checking for work

        await page.waitFor(10000);
        // let numOfPages = 
        // now for each page link we will go to that site 
        for(let pubLink of publicHref){
        console.log(`${first}, ${last}, ${id}, ${betterLink}\n ${pubLink}\n`);
        fs.appendFile('./Page_Links/pageLinks_Rubio.csv', `${first}, ${last}, ${id}, ${pubLink}\n`, (err) => {  
          if (err) throw err;
          console.log('Big Write up!');
      });
    }
        await page.waitFor(4000);
    })
    console.log('Done');
  }
  start();
}

console.log(`Saving new cookies to cache..`);
const cookies = await page.cookies();
await fcbCacheStore.setValue(cookiesStoreKey, cookies);
    await page.waitForRequest('https://www.google.com/', {timeout: 0});
});