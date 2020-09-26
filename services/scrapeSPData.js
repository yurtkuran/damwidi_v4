const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const numeral = require('numeral');

const scrapeSlickCharts = async () => {
    const baseURL = 'https://www.slickcharts.com/sp500';
    var spy = [];
    // console.log('--- Slick Charts Scrape start: ' + new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''));

    try {
        const res = await axios.get(baseURL);
        if (res.status === 200) {
            const $ = cheerio.load(res.data);

            // loop through table rows of response
            $('table tr').each((i, el) => {
                if (i > 0) {
                    const item = $(el);
                    const symbol = item.find('td:nth-child(3)').text();
                    const weight = item.find('td:nth-child(4)').text();
                    spy.push({ symbol, weight });
                    // console.log(i + ': ', symbol, weight);
                }
            });
            // console.log('--- Slick Charts Scrape end  : ' + new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''));
            return spy;
        } else {
            console.log('--- Scrape Response != 200');
            return false;
        }
    } catch (err) {
        console.log('--- Scrape Failed');
        console.log(err.message);
        return false;
    }
};

const scrapeStockMBA = async () => {
    const baseURL = 'https://stockmarketmba.com/stocksinthesp500.php';
    var spy = [];
    // console.log('--- Slick Charts Scrape start: ' + new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''));

    try {
        const res = await axios.get(baseURL);
        if (res.status === 200) {
            const $ = cheerio.load(res.data);

            // loop through table rows of response
            $('table tr').each((i, el) => {
                if (i > 0) {
                    const item = $(el);
                    const symbol = item.find('td:nth-child(1)').text();
                    const sector = item.find('td:nth-child(5)').text();
                    const marketCap = numeral(item.find('td:nth-child(6)').text()).value();
                    spy.push({ symbol, sector, marketCap });
                    // console.log(`${i} : ${symbol}, ${sector}, ${marketCap}`);
                }
            });
            // console.log('--- Slick Charts Scrape end  : ' + new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''));
            return spy;
        } else {
            console.log('--- Scrape Response != 200');
            return false;
        }
    } catch (err) {
        console.log('--- Scrape Failed');
        console.log(err.message);
        return false;
    }
};

module.exports = {
    scrapeSlickCharts,
    scrapeStockMBA,
};
