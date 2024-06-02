import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CircularProgress from '@mui/material/CircularProgress';
import QuoteFetch from './quoteFetch';
import { Link } from 'react-router-dom';


function WatchList() {
    const [watchList, setWatchList] = useState([]);
    const [quoteList, setQuoteList] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWatchList();
    }, []);

    const fetchWatchList = async () => {
        try {
            const response = await axios.get('/api/watchlist');
            setWatchList(response.data);
            fetchQuotesForWatchList(response.data);

        } catch (error) {
            console.error('Error fetching watchlist:', error);
        }
    };

    const removeFromWatchList = async (ticker, event) => {
        try {
            event.preventDefault();
            // Remove company from watchlist in MongoDB Atlas
            await axios.delete(`/api/watchlist/${ticker}/`);
            setWatchList(watchList.filter(company => company.ticker !== ticker));
        } catch (error) {
            console.error('Error removing from watchlist:', error);
        }
    };


    const fetchQuotesForWatchList = async (watchlist) => {
        try {
            const promises = watchlist.map(async (company) => {
                const response = await axios.get(`/api/quote/${company.ticker}`);
                const quoteData = response.data;
                const { c, d, dp, t } = quoteData;
                return {
                    ticker: company.ticker,
                    c,
                    d,
                    dp
                };

            });


            const quoteListResp = await Promise.all(promises);
            setQuoteList(quoteListResp)

            setLoading(false);
        } catch (error) {
            console.error('Error fetching quotes for watchlist:', error);
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
                <CircularProgress />
            </div>
        );
    }

    if (watchList.length === 0) {
        return (
            <div className="container">
                <h1 className="mb-4 pt-5">My WatchList</h1>
                <div className="alert alert-warning text-center" role="alert">
                    <h6 className="text-dark">Currently you don't have any stock in your watchlist</h6>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <h1 className="mb-4 pt-5">My WatchList</h1>
            {watchList.map((company, index) => (
                <Link to={`/search/${company.ticker}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div key={company.ticker} className="mb-3  p-2 border rounded d-flex flex-row align-items-center">
                        <div className="d-flex flex-column align-items-start align-items-md-start" style={{ flex: '1' }}>
                            <i className="bi bi-x text-secondary" style={{ fontSize: '1rem', cursor: 'pointer' }} onClick={(event) => removeFromWatchList(company.ticker, event)}></i>
                            <h2 className="mb-1">{company.ticker}</h2>
                            <h5 className="mb-1">{company.name}</h5>
                        </div>
                        <div className="ms-md-auto pt-3 d-flex align-items-start" style={{ flex: '1' }}>
                            {quoteList[index] && <QuoteFetch quoteData={quoteList[index]} />}
                        </div>
                    </div>
                </Link>
            ))}
        </div>


    );
}

export default WatchList;

