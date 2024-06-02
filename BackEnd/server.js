const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;
const FINNHUB_API_KEY = "cmvtpepr01qkcvkfa1g0cmvtpepr01qkcvkfa1gg";
const POLYGON_API_KEY = "_FFzutmpHzGem1EklDpDjydbzBZr8l3h";
const POLYGON_API_KEY_2 = "mSUl4pfPjWZNZX1Melj4hfKaxSLW4ChL";
const MONGODB_PASSWORD = "Assignment123";
const DATABASE_NAME = "StockChartDB";
const WATCHLIST_COLLECTION = "WatchList";
const PORTFOLIO_COLLECTION = "Portfolio";

app.use(cors());

// MongoDB Connection and APIs
const uri = `mongodb+srv://atulnath:${MONGODB_PASSWORD}@cluster0.gt8jpbk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function connectToDatabase() {
    try {
        await client.connect();
        console.log("Connected to MongoDB Atlas");
    } catch (error) {
        console.error("Error connecting to MongoDB Atlas:", error);
    }
}

connectToDatabase();

// Setting Collection Init
let watchListCollection;

async function initializeCollection() {
    if (!!client && !!client.topology && client.topology.isConnected()) return;

    const db = client.db(DATABASE_NAME);
    watchListCollection = db.collection(WATCHLIST_COLLECTION);
    portfolioCollection = db.collection(PORTFOLIO_COLLECTION);
    console.log("WatchList Collection initialized");
}

// Initialize the collection
initializeCollection();


app.use(express.json());

// WatchList POST API
app.post('/api/watchlist/:ticker/:name', async (req, res) => {
    const { ticker, name } = req.params;
    try {
        const result = await watchListCollection.insertOne({ ticker, name });
        console.log("Checking result: ", result);
        res.status(201).json({ message: 'Successfully added to watchlist' });
    } catch (error) {
        console.error('Error adding to watchlist:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// WatchList GET API
app.get('/api/watchlist', async (req, res) => {
    try {
        const result = await watchListCollection.find({}).toArray();
        res.json(result);
    } catch (error) {
        console.error('Error fetching watchlist:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// WatchList DELETE API
app.delete('/api/watchlist/:ticker', async (req, res) => {
    const { ticker } = req.params;
    try {
        const result = await watchListCollection.deleteOne({ ticker });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Company not found' });
        }
        res.json({ message: 'Ticker removed from Watchlist' });
    } catch (error) {
        console.error('Error removing from Watchlist:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Portfolio POST API
app.post('/api/portfolio', async (req, res) => {
    const { balance, stock } = req.body;
    try {

        await portfolioCollection.updateOne({}, { $set: { balance } });

        const existingPortfolio = await portfolioCollection.findOne({});
        if (existingPortfolio) {
            const existingStockIndex = existingPortfolio.stocks.findIndex(s => s.ticker === stock.ticker);
            if (existingStockIndex !== -1) {

                existingPortfolio.stocks[existingStockIndex].quantity += stock.quantity;
                existingPortfolio.stocks[existingStockIndex].totalCost += stock.totalCost;
            } else {
                existingPortfolio.stocks.push(stock);
            }

            await portfolioCollection.updateOne({}, { $set: { stocks: existingPortfolio.stocks } });
        } else {

            const newPortfolio = { balance, stocks: [stock] };

            await portfolioCollection.insertOne(newPortfolio);
        }

        res.status(200).json({ message: 'Successfully updated stock and balance in portfolio' });
    } catch (error) {
        console.error('Error adding/updating stock and balance in portfolio:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Portfolio Balance Update API
app.post('/api/portfolio/:balance', async (req, res) => {
    const { balance } = req.params;
    const parsedBalance = parseFloat(balance);
    try {
        await portfolioCollection.updateOne({}, { $set: { balance: parsedBalance } });
        res.status(200).json({ message: 'Successfully updated balance in portfolio' });
    } catch (error) {
        console.error('Error updating balance in portfolio:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Portfolio GET API
app.get('/api/portfolio', async (req, res) => {
    try {
        const result = await portfolioCollection.findOne({});
        res.json(result);
        console.log(result);
    } catch (error) {
        console.error('Error fetching portfolio:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Portfolio DELETE API
app.delete('/api/portfolio/:ticker', async (req, res) => {
    const { ticker } = req.params;
    try {
        const result = await portfolioCollection.updateOne({}, { $pull: { stocks: { ticker } } });
        if (result.modifiedCount === 0) {
            return res.status(404).json({ error: 'Stock not found in portfolio' });
        }
        res.json({ message: 'Stock removed from portfolio' });
    } catch (error) {
        console.error('Error removing stock from portfolio:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Endpoints for rest of the applications
app.get('/api/search/:ticker', async (req, res) => {
    const { ticker } = req.params;

    try {
        const response = await axios.get(`https://finnhub.io/api/v1/stock/profile2?symbol=${ticker}&token=${FINNHUB_API_KEY}`);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

//https://finnhub.io/api/v1/quote?symbol=TSLA&token=cmvtpepr01qkcvkfa1g0cmvtpepr01qkcvkfa1gg
app.get('/api/quote/:ticker', async (req, res) => {
    try {
        let { ticker } = req.params;
        ticker = ticker.toUpperCase();
        const url = `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FINNHUB_API_KEY}`;
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/peers/:ticker', async (req, res) => {
    try {
        const { ticker } = req.params;
        const response = await axios.get(`https://finnhub.io/api/v1/stock/peers?symbol=${ticker}&token=${FINNHUB_API_KEY}`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

//https://api.polygon.io/v2/aggs/ticker/TSLA/range/1/hour/2024-03-24/2024-03-25?adjusted=true&sort=asc&apiKey=_FFzutmpHzGem1EklDpDjydbzBZr8l3h
app.get('/api/summary-chart/:ticker/:past_date/:current_date', async (req, res) => {
    const { ticker, past_date, current_date } = req.params;
    try {
        const url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/hour/${past_date}/${current_date}?adjusted=true&sort=asc&apiKey=${POLYGON_API_KEY}`
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

//https://api.polygon.io/v2/aggs/ticker/TSLA/range/1/day/2022-03-24/2024-03-28?adjusted=true&sort=asc&apiKey=_FFzutmpHzGem1EklDpDjydbzBZr8l3h
app.get('/api/summary-chart-tab/:ticker/:past_date/:current_date', async (req, res) => {
    const { ticker, past_date, current_date } = req.params;
    try {
        const url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/day/${past_date}/${current_date}?adjusted=true&sort=asc&apiKey=${POLYGON_API_KEY_2}`
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// https://finnhub.io/api/v1/company-news?symbol=MSFT&from=2021-09-01&to=2021-09-09&token=cmvtpepr01qkcvkfa1g0cmvtpepr01qkcvkfa1gg
app.get('/api/company-news/:ticker/:past_date/:current_date', async (req, res) => {
    const { ticker, past_date, current_date } = req.params;
    try {
        const url = `https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=${past_date}&to=${current_date}&token=${FINNHUB_API_KEY}`
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// https://finnhub.io/api/v1/stock/insider-sentiment?symbol=MSFT&from=2022-01-01&token=cmvtpepr01qkcvkfa1g0cmvtpepr01qkcvkfa1gg
app.get('/api/insight/:ticker', async (req, res) => {
    const { ticker } = req.params;
    try {
        const url = `https://finnhub.io/api/v1/stock/insider-sentiment?symbol=${ticker}&from=2022-01-01&token=${FINNHUB_API_KEY}`
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// https://finnhub.io/api/v1/stock/earnings?symbol=MSFT&token=cmvtpepr01qkcvkfa1g0cmvtpepr01qkcvkfa1gg
app.get('/api/earnings/:ticker', async (req, res) => {
    const { ticker } = req.params;
    try {
        const url = `https://finnhub.io/api/v1/stock/earnings?symbol=${ticker}&token=${FINNHUB_API_KEY}`
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});


// https://finnhub.io/api/v1/stock/recommendation?symbol=MSFT&token=cmvtpepr01qkcvkfa1g0cmvtpepr01qkcvkfa1gg
app.get('/api/recommendation-trends/:ticker', async (req, res) => {
    const { ticker } = req.params;
    try {
        const url = `https://finnhub.io/api/v1/stock/recommendation?symbol=${ticker}&token=${FINNHUB_API_KEY}`
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// https://finnhub.io/api/v1/search?q=AMZ&token=cmvtpepr01qkcvkfa1g0cmvtpepr01qkcvkfa1gg
app.get('/api/auto/:ticker', async (req, res) => {
    let { ticker } = req.params;
    try {
        ticker = ticker.toUpperCase();
        const url = `https://finnhub.io/api/v1/search?q=${ticker}&token=${FINNHUB_API_KEY}`
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
