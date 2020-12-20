const axios = require('axios');
const cheerio = require('cheerio');

const scrapeFidelity = async (symbol) => {
    const searchString = '(GICS®)';
    let baseURL = `https://eresearch.fidelity.com/eresearch/goto/evaluate/snapshot.jhtml?symbols=${symbol}`;

    let sector = '';
    let industry = '';

    try {
        const res = await axios.get(baseURL);
        if (res.status === 200) {
            const $ = cheerio.load(res.data);

            $(`#companyProfile > div`).each((i, el) => {
                const item = $(el).text().trim();
                if (item.includes('GICS®')) {
                    const text = item.slice(item.indexOf(searchString) + searchString.length).trim();
                    if (item.toLowerCase().includes('sector')) sector = text;
                    if (item.toLowerCase().includes('industry')) industry = text;
                }
            });
            return [sector, industry];
        } else {
            console.log('--- Scrape Response != 200');
        }
    } catch (err) {
        console.log('--- Scrape Failed');
        console.log(err.message);
    }

    return [sector, industry];
};

module.exports = {
    scrapeFidelity,
};
