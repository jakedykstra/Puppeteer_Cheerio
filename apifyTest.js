const Apify = require('apify');
// Prepare a list of URLs to crawl
Apify.main(async () => {

const requestList = new Apify.RequestList({
  sources: [
      { url: 'http://www.espn.com/' },
      { url: 'https://www.facebook.com/search/people/?q=joan%20bennett%20American%20Canyon&epa=SERP_TAB' },
  ],
});
await requestList.initialize();

// Crawl the URLs
const crawler = new Apify.CheerioCrawler({
    requestList,
    handlePageFunction: async ({ $, html, request }) => {

        const data = [];

        // Do some data extraction from the page with Cheerio.
        $('.some-collection').each((index, el) => {
            data.push({ title: $(el).find('.some-title').text() });
        });

        // Save the data to dataset.
        await Apify.pushData({
            url: request.url,
            html,
            data,
        })
    },
});

await crawler.run();
});