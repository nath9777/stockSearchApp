import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Contexts } from '../contexts/SearchContext';

function SearchLeftResult({ searchData }) {
    const [starred, setStarred] = useState(false);
    const [watchlist, setWatchlist] = useState([]);
    const [showSellButton, setShowSellButton] = useState(false);
    const [showBuyModal, setShowBuyModal] = useState(false);
    const [showSellModal, setShowSellModal] = useState(false);
    const [quantity, setQuantity] = useState(0);
    const [totalCost, setTotalCost] = useState(0);
    const [portfolioData, setPortfolioData] = useState(null);
    const [notEnoughMoney, setNotEnoughMoney] = useState(false);
    const [notEnoughStock, setNotEnoughStock] = useState(false);
    const { contextLoad, setContextLoad } = useContext(Contexts);

    const quoteData = contextLoad.quoteData

    useEffect(() => {
        const checkWatchlist = async () => {
            try {
                const response = await axios.get('/api/watchlist');
                const watchlistData = response.data;
                setWatchlist(watchlistData);
                setStarred(watchlistData.some(item => item.ticker === searchData.ticker));
            } catch (error) {
                console.error('Error fetching watchlist:', error);
            }
        };
        checkWatchlist();
    }, [searchData.ticker]);

    useEffect(() => {
        fetchData();
    }, [searchData.ticker]);

    const fetchData = async () => {
        try {
            const portfolioResponse = await axios.get('/api/portfolio');
            setPortfolioData(portfolioResponse.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    useEffect(() => {
        if (portfolioData) {
            const hasTickerInStocks = portfolioData.stocks.some(item => item.ticker === searchData.ticker);
            setShowSellButton(hasTickerInStocks);
        }
    }, [portfolioData, searchData.ticker]);

    const toggleStar = async () => {
        try {
            if (!starred) {
                // Add ticker to watchlist (POST WatchList API)
                await axios.post(`/api/watchlist/${searchData.ticker}/${searchData.name}`);
                setContextLoad((currentData) => ({ ...currentData, successMessage: `${searchData.ticker} added to WatchList`, errorMessage: '' }));
            } else {
                // Remove ticker from watchlist (DELETE WatchList API)
                await axios.delete(`/api/watchlist/${searchData.ticker}`);
                setContextLoad((currentData) => ({ ...currentData, successMessage: '', errorMessage: `${searchData.ticker} removed from WatchList` }));
            }

            setStarred(!starred);

            setTimeout(() => {
                setContextLoad((currentData) => ({ ...currentData, successMessage: '', errorMessage: '' }));
            }, 2000);
        } catch (error) {
            console.error('Error toggling star:', error);
        }
    };

    const handleBuy = () => {
        setShowBuyModal(true);
        setQuantity('');
        setTotalCost(0);
        setNotEnoughMoney(false);
    };

    const handleSell = () => {
        setShowSellModal(true);
        setQuantity('');
        setTotalCost(0);
        setNotEnoughStock(false);
    };


    const handleCloseModal = () => {
        setShowBuyModal(false);
        setShowSellModal(false);
        setQuantity('');
        setTotalCost(0);
        setNotEnoughMoney(false);
        setNotEnoughStock(false);
    };



    const handleQuantityChange = (event) => {
        const value = parseInt(event.target.value);
        setQuantity(value);
        const cost = value * quoteData.c;
        setTotalCost(cost);

        if (cost > portfolioData?.balance) {
            setNotEnoughMoney(true);
        } else {
            setNotEnoughMoney(false);
        }
    };

    const handleQuantityChangeSell = (event) => {
        const value = parseInt(event.target.value) || '';
        setQuantity(value);
        setNotEnoughStock(value > portfolioData.stocks.find(item => item.ticker === searchData.ticker)?.quantity);
        const cost = value ? value * quoteData.c : 0;
        setTotalCost(cost);
    };

    const handleBuyStock = async () => {
        try {
            const response = await axios.post('/api/portfolio', {
                balance: portfolioData.balance - totalCost,
                stock: {
                    ticker: searchData.ticker,
                    name: searchData.name,
                    quantity: quantity,
                    totalCost: totalCost
                }
            });

            setShowBuyModal(false);
            fetchData();
            setContextLoad((currentData) => ({ ...currentData, successMessagePortfolio: `${searchData.ticker} bought successfully.`, errorMessagePortfolio: '' }));

            setTimeout(() => {
                setContextLoad((currentData) => ({ ...currentData, successMessagePortfolio: '', errorMessagePortfolio: '' }));
            }, 2000);
        } catch (error) {
            console.error('Error buying stock:', error);
        }
    };

    const handleSellStock = async () => {
        try {
            const stockQuantity = portfolioData.stocks.find(item => item.ticker === searchData.ticker)?.quantity || 0;

            const remainingQuantity = stockQuantity - quantity;

            if (remainingQuantity === 0) {
                const updatedBalance = portfolioData.balance + totalCost;
                console.log(updatedBalance);
                await axios.post(`/api/portfolio/${updatedBalance}`);
                await axios.delete(`/api/portfolio/${searchData.ticker}`);
            } else {
                const response = await axios.post('/api/portfolio', {
                    balance: portfolioData.balance + totalCost,
                    stock: {
                        ticker: searchData.ticker,
                        name: searchData.name,
                        quantity: -quantity,
                        totalCost: -totalCost
                    }
                });
                console.log('Sell response:', response.data);
            }

            setShowSellModal(false);
            fetchData();
            setContextLoad((currentData) => ({ ...currentData, successMessagePortfolio: '', errorMessagePortfolio: `${searchData.ticker} sold successfully.` }));

            setTimeout(() => {
                setContextLoad((currentData) => ({ ...currentData, successMessagePortfolio: '', errorMessagePortfolio: '' }));
            }, 2000);
        } catch (error) {
            console.error('Error selling stock:', error);
        }
    };
    return (
        <div>
            <div className="mb-4 d-flex justify-content-center align-items-center flex-column">
                <div className="row align-items-center">
                    <div className="col-auto">
                        <h2 className="mb-0">{searchData.ticker}</h2>
                    </div>
                    <div className="col-auto">
                        {starred ? (
                            <i className="bi bi-star-fill text-warning" onClick={toggleStar}></i>
                        ) : (
                            <i className="bi bi-star" onClick={toggleStar}></i>
                        )}
                    </div>
                </div>
                <h4 className="text-secondary small">{searchData.name}</h4>
                <h6 className="text-secondary small">{searchData.exchange}</h6>
                <div className="ms-2">
                    <button type="button" className="btn btn-success" onClick={handleBuy}>Buy</button>
                    {showSellButton && (
                        <button type="button" className="btn btn-danger ms-2" onClick={handleSell}>Sell</button>
                    )}
                </div>
            </div>

            <div className={`modal fade ${showBuyModal ? 'show' : ''}`} id="buyModal" tabIndex="-1" aria-labelledby="buyModalLabel" aria-hidden={!showBuyModal} style={{ display: showBuyModal ? 'block' : 'none' }}>
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="buyModalLabel">{searchData.ticker}</h5>
                            <button type="button" className="btn-close" aria-label="Close" onClick={handleCloseModal}></button>
                        </div>
                        <div className="modal-body" style={{ paddingLeft: '20px' }}>
                            <p style={{ textAlign: 'left' }}>Current Price: {quoteData.c}</p>
                            <p style={{ textAlign: 'left' }}>Money in wallet: ${portfolioData?.balance.toFixed(2)}</p>
                            <div className="row">
                                <div className="col-auto" style={{ paddingRight: '5px' }}>
                                    <p style={{ textAlign: 'left' }}>Quantity:</p>
                                </div>
                                <div className="col">
                                    <input type="number" value={quantity} onChange={handleQuantityChange} className="form-control" style={{ width: '100%' }} />
                                </div>
                            </div>
                            {notEnoughMoney && (
                                <p style={{ textAlign: 'left', color: 'red' }}>Not enough money in Wallet!</p>
                            )}
                        </div>
                        <div className="modal-footer" style={{ justifyContent: 'space-between', paddingLeft: '20px' }}>
                            <p style={{ textAlign: 'left' }}>Total: ${totalCost.toFixed(2)}</p>
                            <button type="button" className="btn btn-success" onClick={handleBuyStock} disabled={!quantity || notEnoughMoney}>Buy</button>
                        </div>
                    </div>
                </div>
            </div>
            <div className={`modal-backdrop fade ${showBuyModal ? 'show' : ''}`} style={{ display: showBuyModal ? 'block' : 'none' }}></div>

            <div className={`modal fade ${showSellModal ? 'show' : ''}`} id="sellModal" tabIndex="-1" aria-labelledby="sellModalLabel" aria-hidden={!showSellModal} style={{ display: showSellModal ? 'block' : 'none' }}>
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="sellModalLabel">{searchData.ticker}</h5>
                            <button type="button" className="btn-close" aria-label="Close" onClick={handleCloseModal}></button>
                        </div>
                        <div className="modal-body" style={{ paddingLeft: '20px' }}>
                            <p style={{ textAlign: 'left' }}>Current Price: {quoteData.c}</p>
                            <p style={{ textAlign: 'left' }}>Money in wallet: {portfolioData?.balance.toFixed(2)}</p>
                            <div className="row">
                                <div className="col-auto" style={{ paddingRight: '5px' }}>
                                    <p style={{ textAlign: 'left' }}>Quantity:</p>
                                </div>
                                <div className="col">
                                    <input type="number" value={quantity === 0 ? '' : quantity} onChange={handleQuantityChangeSell} className="form-control" style={{ width: '100%' }} />
                                </div>
                            </div>
                            {notEnoughStock && (
                                <p style={{ textAlign: 'left', color: 'red' }}>You cannot sell stocks that you don't have!</p>
                            )}
                        </div>
                        <div className="modal-footer" style={{ justifyContent: 'space-between', paddingLeft: '20px' }}>
                            <p style={{ textAlign: 'left' }}>Total: ${totalCost.toFixed(2)}</p>
                            <button type="button" className="btn btn-success" onClick={handleSellStock} disabled={!quantity || notEnoughStock}>Sell</button>
                        </div>
                    </div>
                </div>
            </div>
            <div className={`modal-backdrop fade ${showSellModal ? 'show' : ''}`} style={{ display: showSellModal ? 'block' : 'none' }}></div>
        </div>
    );
}

export default SearchLeftResult;

