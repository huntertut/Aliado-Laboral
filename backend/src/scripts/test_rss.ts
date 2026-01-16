import Parser from 'rss-parser';

const parser = new Parser();

const testFeed = async () => {
    try {
        console.log('Testing RSS Feed connection...');
        const GOOGLE_NEWS_RSS = 'https://news.google.com/rss/search?q=ley+federal+trabajo+mexico&hl=es-419&gl=MX&ceid=MX:es-419';

        const feed = await parser.parseURL(GOOGLE_NEWS_RSS);
        console.log(`Feed Title: ${feed.title}`);
        console.log(`Items found: ${feed.items.length}`);

        if (feed.items.length > 0) {
            console.log('First item title:', feed.items[0].title);
            console.log('First item link:', feed.items[0].link);
            console.log('First item date:', feed.items[0].pubDate);
        }

    } catch (error) {
        console.error('Error fetching RSS:', error);
    }
};

testFeed();
