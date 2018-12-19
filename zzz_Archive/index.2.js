const Apify = require('apify');
const cheerio = require('cheerio');
const login = require('../input.js');
const fs = require('fs');
const csv = require('csv-parser');
const donorList = require("../donors.js");

const writeStream = fs.createWriteStream('post.csv');


fs.createReadStream('./scrape.csv')
.pipe(csv())
.on('data', function(data){
    try {
        console.log(data['search query']);
       donorList.push(data['search query']);
    }
    catch(err) {
    }
})
.on('end',function(){
    console.log(donorList);
});  

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

async function list(val, num, page, cookiesStoreKey, browser, fcbCacheStore, userCookies){
    total = num;
    // console.log(total);
    // console.log(val);
    // console.log(donorList[num]);
    await page.waitFor(1500);
    await page.click('._585_');
    await page.type('._1frb', val)
    await page.click('._585_');
    await page.waitForNavigation();
    await page.waitFor(1500);
    // if person is in page search
    await page.click('._5vwz:nth-of-type(3) > a');
    await page.waitFor(1500);
    try {
        await page.waitForSelector('._32mo', {timeout: 1000});
        await clickToPage(val, num);
    } catch (error) {
        // console.log(error);
        nextUser(val, num);
    }
    await list(donorList[0], 1);
    isLogged = await loggedCheck(page);
}
async function clickToPage(val, num, page) {
    console.log("entering page");
    await page.click('._32mo');
    await page.waitForNavigation();
    await page.waitForSelector('._2iel', 1500);
    let content = await page.content();
    var $ = cheerio.load(content);
    var me = $('._2iel').html();
    var first = $('._2nlw').html().split(' ')[0]
    var last = $('._2nlw').html().split(' ')[1]
    var url = $('._2nlw').attr('href');
    var initialId = $('._6-6:first-of-type').attr('href');
    var firstCut = initialId.indexOf('%');
    var lastCut = initialId.lastIndexOf('%');
    var id = initialId.slice(firstCut + 3, lastCut);
    console.log(id);
    // var location = $('._50f3 > a').html();
    let location = "info: "
    // checking location for "works at" or "at" without "worked || former"
    $('._50f3').each((i, el) => {
        const info = $(el).text()
        // console.log(info);
        if (info.includes('works at') || (info.includes('at') && !(info.includes('former')) && !(info.includes('worked')))){
            location += (info + "; ");
            // console.log(location);
        }
    })
    await console.log(`${first}, ${last}, ${url}, ${location}, ${id}`);
    await writeStream.write(`${first}, ${last}, ${url}, ${location}, ${id} \n`);
    // isLogged = await loggedCheck(page);
    if(total === donorList.length){
        // console.log("done");
        // console.log(total);
        // console.log(donorList);
        // console.log(donorList.length);
        return;
    } else {
        // console.log("next");
        // console.log(donorList);
        // console.log(donorList[total]);
        list(donorList[total], num + 1);
    }
    }
    async function nextUser(val, num, page) {
        console.log("next user");
        if(total === donorList.length){
            // console.log("done");
            // console.log(total);
            // console.log(donorList);
            // console.log(donorList.length);
            return;
        } else {
            // console.log("next");
            // console.log(donorList);
            // console.log(donorList[total]);
            list(donorList[total], num + 1);
        }
    }
    

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
        await page.waitForNavigation();
        isLogged = await loggedCheck(page);
        await list(donorList[0], 1, page, cookiesStoreKey, browser, fcbCacheStore, userCookies);
        }
    

    if (!isLogged) {
        console.log(`Cookies from cache didn't work, try to login..`);
        await page.goto('https://facebook.com');
        await page.type('#email', login.username);
        await page.type('#pass', login.password);
        await page.click('#loginbutton input');
        await page.waitForNavigation();
            await list(donorList[0], 1, page, cookiesStoreKey, browser, fcbCacheStore, userCookies);
            isLogged = await loggedCheck(page);
            }


    if (!isLogged) {
        throw new Error('Incorrect username or password!')
    }

    // Get cookies and refresh them in store cache
    console.log(`Saving new cookies to cache..`);
    const cookies = await page.cookies();
    await fcbCacheStore.setValue(cookiesStoreKey, cookies);
    await page.waitFor(100000);

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