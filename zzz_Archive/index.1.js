const Apify = require('apify');
const cheerio = require('cheerio');
const login = require('../input.js');
const fs = require('fs');
const donorList = require("../donors.js");

const writeStream = fs.createWriteStream('post.csv');

// write to csv
writeStream.write(`Title,Link,Date \n`);

const loggedCheck = async (page) => {
    try {
        await page.waitForSelector('#bluebarRoot', { timeout: 10000 });
        return true;
    } catch(err) {
        return false;
    }
};

Apify.main(async () => {
    var listLength = donorList.length;
    var total = 0
    const fcbCacheStore = await Apify.openKeyValueStore('fcb-cache');
    const cookiesStoreKey = login.username.replace('@', '(at)');
    const browser = await Apify.launchPuppeteer();
    const page = await browser.newPage();
    let isLogged = false;
    let userCookies = await fcbCacheStore.getValue(cookiesStoreKey);
    if (userCookies) {
        console.log('Try to use cookies from cache..')
        await page.setCookie(...userCookies);
        await page.goto('https://facebook.com');
        async function list(val, num){
        total = num;
        console.log(total);
        await page.type('._1frb', donorList[0])
        await page.click('._585_');
        await page.waitForNavigation();
        await page.waitForSelector('._2yez', 3000);
        await page.click('._2yez');
        await page.waitForNavigation();
        await page.waitForSelector('._2iel', 3000);
        let content = await page.content();
        var $ = cheerio.load(content);
        var me = $('._2iel').html();
        var first = $('._2nlw').html().split(' ')[0]
        var last = $('._2nlw').html().split(' ')[1]
        var url = $('._2nlw').attr('href');
        var location = $('._50f3 > a').html();
        await console.log(`${first}, ${last}, ${url}, ${location}`);
        await writeStream.write(`${first}, ${last}, ${url}, ${location} \n`);
        // isLogged = await loggedCheck(page);
        if(total = donorList.length){
            console.log(val);
            console.log(total);
            console.log(donorList.length);
            return console.log("done");
        } else {
            list(donorList[total], num + 1);
        }
        }
        await list(donorList[0], 1);
    }

    if (!isLogged) {
        console.log(`Cookies from cache didn't work, try to login..`);
        await page.goto('https://facebook.com');
        await page.type('#email', login.username);
        await page.type('#pass', login.password);
        await page.click('#loginbutton input');
        await page.waitForNavigation();
        await page.type('._1frb', "Joan Bennett American Canyan")
        await page.click('._585_');
        await page.waitForSelector('._2yez', 3000);
        await page.click('._2yez');
        await page.waitForNavigation();
        await page.waitForSelector('._2iel', 3000);
        await console.log(await page.content());
        await page.waitForNavigation();
        let content = await page.content();
        var $ = cheerio.load(content);
        var me = $('_f-6').html();
        console.log(me);
        isLogged = await loggedCheck(page);
    }

    if (!isLogged) {
        throw new Error('Incorrect username or password!')
    }

    // Get cookies and refresh them in store cache
    console.log(`Saving new cookies to cache..`);
    const cookies = await page.cookies();
    await fcbCacheStore.setValue(cookiesStoreKey, cookies);

//     // for each person on list create url to check
//     donorList.forEach((element, index) => {
//         var splitElements = element.split(" ");
//         console.log(splitElements);
//         console.log(index);
//         var query;
//         splitElements.forEach(element => {
//         if (query === undefined) {
//             query = element;
//         } else {
//             query += ("%20" + element);
//         }
//     })
//         // url created from loops
//         var url = `https://www.facebook.com/search/people/?q=${query}&epa=SERP_TAB`;
//         console.log(url);
       
// })    

// const page2 = await browser.newPage();
// await page2.setCookie(...cookies);
// await page2.goto(
//     "https://www.facebook.com/search/people/?q=joan%20bennett%20American%20Canyon&epa=SERP_TAB"); // Opens page as logged user
// await request('http://codedemos.com/sampleblog', (error, response, html) => {
// if (!error && response.statusCode == 200) {
// const $ = cheerio.load(html);
// const requestList = new Apify.RequestList({
//     sources: [
//         { url: 'https://www.facebook.com/search/people/?q=joan%20bennett%20American%20Canyon&epa=SERP_TAB' },
//         // { url: 'http://www.example.com/page-2' },
//     ],
//   });
//   await requestList.initialize();


//   const crawler = new Apify.PuppeteerCrawler({
//     requestList,
//     handlePageFunction: async ({ page, request }) => {
//         // This function is called to extract data from a single web page
//         // 'page' is an instance of Puppeteer.Page with page.goto(request.url) already called
//         // 'request' is an instance of Request class with information about the page to load
//         await Apify.pushData({
//             title: await page.title(),
//             url: request.url,
//             succeeded: true,
//         })
//     },
//     handleFailedRequestFunction: async ({ request }) => {
//         // This function is called when crawling of a request failed too many time
//         await Apify.pushData({
//             url: request.url,
//             succeeded: false,
//             errors: request.errorMessages,
//         })
//     },
// });

// await crawler.run();
//Write Row To CSV
// writeStream.write(`${title}, ${link}, ${date} \n`);
// }
// })
// await browser.close();

console.log('Done.');

});