const Apify = require('apify');
const cheerio = require('cheerio');
const login = require('../input.js');
const fs = require('fs');
const csv = require('csv-parser');
const donorList = require("../donors.js");


fs.createReadStream('./csvFiles/JohnDoe_Concat.1.csv')
.pipe(csv())
.on('data', function(data){
    try {
        // console.log(data['concat with city']);
        // console.log(data['concat with Employer']);
       donorList.push(data['Concat with City']);
       donorList.push(data['concat with Employer']);
    }
    catch(err) {
    }
})
.on('end',function(){
    console.log(donorList);
});  

// write to csv
fs.appendFile('./csvBotWritten/post-JohnDoe-city-employer.csv', `First, Last, Link, Info, ID, Origin\n`, (err) => {  
    if (err) throw err;
    // console.log('Created!');
});
fs.appendFile('./csvBotWritten/linkOfPosts-JohnDoe.csv', `Links, Search \n\n`, (err) => {  
    if (err) throw err;
    // console.log('Posts!');
});

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
        // await page.goto('https://www.facebook.com/search/people/?q=people&epa=SERP_TAB')
        total = num;
        await page.waitFor(3000);
        await page.click('._585_');
        await page.waitFor(500);
        await page.type('._1frb', val);
        await page.waitFor(3000);
        await page.click('._585_');
        await page.waitFor(3000);
        // if person is in page search
        await page.click('._5vwz:nth-of-type(2) > a');
        try {
            await page.waitForSelector('._4rmu', {timeout: 2000});
            await savePosts(val, num);
        } catch (error) {
            // console.log(error);
            console.log("no posts");
            checkPeople(val, num);
        }
        async function savePosts(val, num) {
            let content = await page.content();
            var $ = cheerio.load(content);
            let link = "links: "
            var linkFiles = $('._4rmu a').attr('href');
            $('._4rmu a').each((i, el) => {
                let linksFiles = $(el).attr('href');
                // console.log(linksFiles);
                if (linksFiles){
                    link += (linksFiles + "; ");
                }
            })
            fs.appendFile('./csvBotWritten/linkOfPosts-JohnDoe.csv', `${val}, ${link}\n\n`, (err) => {  
                if (err) throw err;
                // console.log('Written!');
                checkPeople(val, num)
            });

        }
        async function checkPeople(val, num) {
        await page.waitFor(1000);
        await page.click('._5vwz:nth-of-type(3) > a');
        await page.waitFor(2500);
        try {
            await page.waitForSelector('._32mo', {timeout: 1500});
            await clickToPage(val, num);
        } catch (error) {
            // console.log(error);
            console.log("No people");
            nextUser(val, num);
        }
    }
        async function clickToPage(val, num) {
        // enter user page
        await page.click('._32mo');

        // wait for page to load before using cheerio
        await page.waitForNavigation();
        await page.waitForSelector('._2iel', 2000);

        // gather content
        let content = await page.content();
        var $ = cheerio.load(content);
        var me = $('._2iel').html();
        var first = $('._2nlw').html().split(' ')[0];
        var last;
        var nameArr = $('._2nlw').html().split(' ');
        if (nameArr.length <= 3){
            last = nameArr[(nameArr.length - 1)];
        } else {
            last = nameArr[1];
        }
        var url = $('._2nlw').attr('href');
        var initialId = $('._6-6:first-of-type').attr('href');
        var firstCut = initialId.indexOf('%');
        var lastCut = initialId.lastIndexOf('%');
        var id = initialId.slice(firstCut + 3, lastCut);
        console.log(id);
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
        await console.log(`${first}, ${last}, ${url}, ${location}, ${id}, ${val}`);
        await fs.appendFile('./csvBotWritten/post-Bradford-city-employer.csv', `${val}, ${first}, ${last}, ${url}, ${location}, ${id}  \n`, (err) => {  
            if (err) throw err;
            console.log('Big Write up!');
        });
        // isLogged = await loggedCheck(page);
        if(total === donorList.length){
            console.log("done");
            console.log("List is done");
            page.goto('http://www.espn.com/');
            return;
        } else {
            console.log("next");
            list(donorList[total], num + 1);
        }
        }
        }
        async function nextUser(val, num) {
            console.log("next user");
            if(total === donorList.length){
                console.log("List is done");
                page.goto('http://www.espn.com/');
                return;
            } else {
                list(donorList[total], num + 1);
            }
        }
        
        await list(donorList[0], 1);
        isLogged = await loggedCheck(page);
    }

    if (!isLogged) {
        console.log(`Cookies from cache didn't work, try to login..`);
        await page.goto('https://facebook.com');
        await page.type('#email', login.username);
        await page.type('#pass', login.password);
        await page.click('#loginbutton input');
        await page.waitForNavigation();
        async function list(val, num){
            total = num;
            await page.waitFor(2000);
            await page.click('._585_');
            await page.type('._1frb', val)
            await page.click('._585_');
            await page.waitForNavigation();
            await page.waitFor(2000);
            // if person is in page search
            await page.click('._5vwz:nth-of-type(3) > a');
            await page.waitFor(2000);
            try {
                await page.waitForSelector('._32mo', {timeout: 1500});
                await clickToPage(val, num);
            } catch (error) {
                console.log(error);
                nextUser(val, num);
            }
            async function clickToPage(val, num) {
            console.log("entering page");
            await page.click('._32mo');
            await page.waitForNavigation();
            await page.waitForSelector('._2iel', 2000);
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
            let location = "info: "
            $('._50f3').each((i, el) => {
                const info = $(el).text()
                // console.log(info);
                if (info.includes('works at') || (info.includes('at') && !(info.includes('former')) && !(info.includes('worked')))){
                    location += (info + "; ");
                    // console.log(location);
                }
            })
            await console.log(`${first}, ${last}, ${url}, ${location}, ${id}, ${val}`);
            await fs.appendFile('./csvBotWritten/post-JohnDoe-city-employer.csv', `${first}, ${last}, ${url}, ${location}, ${id}, ${val}  \n`);
            // isLogged = await loggedCheck(page);
            if(total === donorList.length){
                console.log("done");
                return;
            } else {
                list(donorList[total], num + 1);
            }
            }
            }
            async function nextUser(val, num) {
                console.log("next user");
                if(total === donorList.length){
                    return;
                } else {
                    list(donorList[total], num + 1);
                }
            }
            
            await list(donorList[0], 1);
            isLogged = await loggedCheck(page);
            }


    if (!isLogged) {
        throw new Error('Incorrect username or password!')
    }

    // Get cookies and refresh them in store cache
    console.log(`Saving new cookies to cache..`);
    const cookies = await page.cookies();
    await fcbCacheStore.setValue(cookiesStoreKey, cookies);
    await page.waitForRequest('http://www.google.com/', {timeout: 0});

console.log('Done.');

});
