import express from 'express';
import puppeteer from 'puppeteer';
import fetch from 'node-fetch';

const app = express();
const PORT = 3000;


// Function to scrape Instagram profile
async function scrapeInstagramProfile() {
    try {
        let browser = await puppeteer.launch();
        const page = await browser.newPage();

        await page.setRequestInterception(true);

        let xFbLsdValue = null;
        let CSRFToken = null;
        const userId = 'mirrormagicinfo.in';

        page.on('request', interceptedRequest => {
            if (interceptedRequest.url().includes('/graphql')) {
                const xFbLsd = interceptedRequest.headers()['x-fb-lsd'];
                const csrfToken = interceptedRequest.headers()['x-csrftoken'];
                xFbLsdValue = xFbLsd;
                CSRFToken = csrfToken;
            }
            interceptedRequest.continue();
        });

        await page.goto(`https://www.instagram.com/${userId}/`);

        // Use setTimeout to introduce a delay
        await new Promise(resolve => setTimeout(resolve, 3000));

        await browser.close();
        console.log({ xFbLsdValue, CSRFToken, userId });
        return [xFbLsdValue, CSRFToken, userId];
    } catch (error) {
        console.error("An error occurred while scraping:", error);
        return [null, null, null];
    }
}


// Function to scrape Instagram posts
async function scrapeInstagramPosts(userId, lsd, csrfToken) {
    const headers = {
        accept: '*/*',
        'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
        'content-type': 'application/x-www-form-urlencoded',
        priority: 'u=1, i',
        'sec-ch-prefers-color-scheme': 'dark',
        'sec-ch-ua':
            '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
        'sec-ch-ua-full-version-list':
            '"Google Chrome";v="125.0.6422.78", "Chromium";v="125.0.6422.78", "Not.A/Brand";v="24.0.0.0"',
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-model': '"Nexus 5"',
        'sec-ch-ua-platform': '"Android"',
        'sec-ch-ua-platform-version': '"6.0"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'x-asbd-id': '129477',
        'x-csrftoken': csrfToken,
        'x-fb-friendly-name': 'PolarisProfilePostsQuery',
        'x-fb-lsd': lsd,
        'x-ig-app-id': '1217981644879628',
        Referer: `https://www.instagram.com/${userId}/`,
        'Referrer-Policy': 'strict-origin-when-cross-origin',
    };

    const body = `av=17841406923169464&__d=www&__user=0&__req=4&__hs=19867.HYP:instagram_web_pkg.2.1..0.1&dpr=3&__ccg=UNKNOWN&__rev=1013745717&__s=vlcc2s:uejg2t:6sw022&__hsi=7372626254011750282&__dyn=7xe5WwlEnwn8K2Wmm0NonwgU7S6EdF8aUco38w5ux609vCwjE1xoswaq0yE1VohwnU6a3a0EA2C0iK0D830wae4UaEW2G1NwwwNwKwHw8W1uwc-0iS2S3qazo7u1xwIw8O321LwTwKG1pg2Xwr86C1mwrd6goK689UrAwHxW6Uf9EO&__csr=&__comet_req=7&fb_dtsg=NAcOLgAzt5tVZvSTjtU7VqwC_flpJBr8aZP7i0hRM78e2F4oIm_oZHQ:17855905060073950:1715494743&jazoest=26298&lsd=${lsd}&__spin_r=1013745717&__spin_b=trunk&__spin_t=1716573316&fb_api_caller_class=RelayModern&fb_api_req_friendly_name=PolarisProfilePostsQuery&variables={"data":{"count":50,"include_relationship_info":true,"latest_besties_reel_media":true,"latest_reel_media":true},"username":"${userId}","__relay_internal__pv__PolarisShareMenurelayprovider":false}&server_timestamps=true&doc_id=7452141388216801`;

    const response = await fetch('https://www.instagram.com/api/graphql', {
        headers,
        body,
        method: 'POST',
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Instagram API error: ${errorText}`);
    }

    const data = await response.json();
    return data;
}

app.get("/",(req,res)=>{
    res.send("Puppeteer is Working Fine Bro...")
})

// Express route to scrape Instagram data
app.get('/scrape-instagram', async (req, res) => {
    try {
        const [xFbLsdValue, CSRFToken, userId] = await scrapeInstagramProfile();
        const posts = await scrapeInstagramPosts(userId, xFbLsdValue, CSRFToken);
        res.json(posts.data.xdt_api__v1__feed__user_timeline_graphql_connection.edges);
    } catch (error) {
        console.error('Error scraping Instagram profile:', error);
        res.status(500).json({ error: 'Failed to scrape Instagram profile', details: error.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
