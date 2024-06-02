import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import "../App.css"
import CircularProgress from '@mui/material/CircularProgress';
import { Contexts } from '../contexts/SearchContext';

function Portfolio() {
    const [portfolioData, setPortfolioData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quoteList, setQuoteList] = useState(null);
    const [showBuyModal, setShowBuyModal] = useState(false);
    const [showSellModal, setShowSellModal] = useState(false);
    const [quantity, setQuantity] = useState('');
    const [totalCost, setTotalCost] = useState(0);
    const [notEnoughMoney, setNotEnoughMoney] = useState(false);
    const [notEnoughStock, setNotEnoughStock] = useState(false);
    const [selectedTicker, setSelectedTicker] = useState('');
    const { contextLoad, setContextLoad } = useContext(Contexts);

    useEffect(() => {
        fetchPortfolioData();
    }, []);

    const fetchPortfolioData = async () => {
        try {
            const response = await axios.get('/api/portfolio');
            setPortfolioData(response.data);
            fetchQuotesForPortfolio(response.data.stocks)
        } catch (error) {
            console.error('Error fetching portfolio data:', error);
        }
    };


    const fetchQuotesForPortfolio = async (portfolioList) => {
        try {
            const promises = portfolioList.map(async (company) => {
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
            console.error('Error fetching quotes for portfolio:', error);
        }
    };


    const handleSell = (ticker) => {
        setShowSellModal(true);
        setSelectedTicker(ticker);
        setQuantity('');
        setTotalCost(0);
    };

    const handleBuy = (ticker) => {
        setShowBuyModal(true);
        setSelectedTicker(ticker);
        setQuantity('');
        setTotalCost(0);
    };

    const handleCloseModal = () => {
        setShowBuyModal(false);
        setShowSellModal(false);
        setQuantity('');
        setTotalCost(0);
        setNotEnoughMoney(false);
        setNotEnoughStock(false);
        setSelectedTicker('');
    };

    const handleQuantityChange = (event) => {
        const value = event.target.value !== '' ? parseInt(event.target.value) : '';
        setQuantity(value);
        const cost = value !== '' ? value * quoteList.find(item => item.ticker === selectedTicker)?.c || 0 : 0;
        setTotalCost(cost);

        if (cost > portfolioData?.balance) {
            setNotEnoughMoney(true);
        } else {
            setNotEnoughMoney(false);
        }
    };

    const handleQuantityChangeSell = (event) => {
        const value = event.target.value !== '' ? parseInt(event.target.value) : '';
        setQuantity(value);

        const selectedStock = portfolioData.stocks.find(item => item.ticker === selectedTicker);

        if (!selectedStock) {
            return;
        }

        if (value > selectedStock.quantity) {
            setNotEnoughStock(true);
        } else {
            setNotEnoughStock(false);
            const cost = value !== '' ? value * quoteList.find(item => item.ticker === selectedTicker)?.c || 0 : 0;
            setTotalCost(cost);
        }
    };

    const handleBuyStock = async () => {
        try {
            const updatedBalance = portfolioData.balance - totalCost;

            const response = await axios.post('/api/portfolio', {
                balance: updatedBalance,
                stock: {
                    ticker: selectedTicker,
                    name: portfolioData.stocks.find(stock => stock.ticker === selectedTicker).name,
                    quantity: quantity,
                    totalCost: totalCost
                }
            });

            setShowBuyModal(false);
            await fetchPortfolioData();
            setContextLoad((currentData) => ({ ...currentData, successMessagePortfolioTab: `${selectedTicker} bought successfully.`, errorMessagePortfolioTab: '' }));

            setTimeout(() => {
                setContextLoad((currentData) => ({ ...currentData, successMessagePortfolioTab: '', errorMessagePortfolioTab: '' }));
            }, 2000);
        } catch (error) {
            console.error('Error buying stock:', error);
        }
    };

    const handleSellStock = async () => {
        try {
            const selectedStock = portfolioData.stocks.find(item => item.ticker === selectedTicker);

            if (!selectedStock) {
                return;
            }

            const stockQuantity = selectedStock.quantity;

            const remainingQuantity = stockQuantity - quantity;

            if (remainingQuantity === 0) {
                const updatedBalance = portfolioData.balance + totalCost;
                await axios.post(`/api/portfolio/${updatedBalance}`);
                await axios.delete(`/api/portfolio/${selectedTicker}`);
            } else {
                const response = await axios.post('/api/portfolio', {
                    balance: portfolioData.balance + totalCost,
                    stock: {
                        ticker: selectedTicker,
                        name: selectedStock.name,
                        quantity: -quantity,
                        totalCost: -totalCost
                    }
                });
            }

            setShowSellModal(false);
            await fetchPortfolioData();

            setContextLoad((currentData) => ({ ...currentData, successMessagePortfolioTab: '', errorMessagePortfolioTab: `${selectedTicker} sold successfully.` }));

            setTimeout(() => {
                setContextLoad((currentData) => ({ ...currentData, successMessagePortfolioTab: '', errorMessagePortfolioTab: '' }));
            }, 2000);
        } catch (error) {
            console.error('Error selling stock:', error);
        }
    };

    const getChangeColorClass = (change) => {
        if (change === 0 || change == 0.00) {
            return 'text-black';
        }
        return change > 0 ? 'text-success' : 'text-danger';
    };



    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
                <CircularProgress />
            </div>
        );
    }

    return (
        <div className="container mt-2">
            {contextLoad.successMessagePortfolioTab && (
                <div className="alert alert-success alert-dismissible fade show text-center" role="alert">
                    {contextLoad.successMessagePortfolioTab}
                    <button type="button" className="btn-close" onClick={() => setContextLoad((currentData) => ({ ...currentData, successMessagePortfolioTab: '', errorMessagePortfolioTab: '' }))}></button>
                </div>
            )}
            {contextLoad.errorMessagePortfolioTab && (
                <div className="alert alert-danger alert-dismissible fade show text-center" role="alert">
                    {contextLoad.errorMessagePortfolioTab}
                    <button type="button" className="btn-close" onClick={() => setContextLoad((currentData) => ({ ...currentData, successMessagePortfolioTab: '', errorMessagePortfolioTab: '' }))}></button>
                </div>
            )}
            <h1 className="mb-4 pt-5">My Portfolio</h1>
            <div className="mb-3">
                <h5>Money in Wallet: ${portfolioData.balance.toFixed(2)}</h5>
            </div>
            {!portfolioData || portfolioData.stocks.length === 0 && (
                <div className="alert alert-warning text-center" role="alert">
                    <h6 className="text-dark">Currently you don't have any stock</h6>
                </div>
            )}
            {portfolioData.stocks.map((stock, index) => (
                <div key={stock.ticker} className="card mb-3">
                    <div className="card-header">
                        <Link to={`/search/${stock.ticker}`} style={{ textDecoration: 'none' }}>
                            <h5 className="card-title">
                                <span className="text-black">{stock.ticker}</span>{' '}
                                <span style={{ fontSize: '0.8em', color: 'grey' }}>{stock.name}</span>
                            </h5>
                        </Link>
                    </div>

                    <div className="card-body">
                        <div className='d-flex flex-column flex-lg-row'>
                            <div className='d-flex flex-row w-100 w-lg-50'>
                                <div className='w-50 fw-bold'>
                                    <p>Quantity: </p>
                                    <p>Average Cost: </p>
                                    <p>Total Cost:</p>
                                </div>
                                <div className='mx-5 w-50 fw-bold'>
                                    <p>{stock.quantity}</p>
                                    <p>{(stock.totalCost / stock.quantity).toFixed(2)}</p>
                                    <p>{stock.totalCost.toFixed(2)}</p>
                                </div>
                            </div>

                            <div className='d-flex flex-row w-100 w-lg-50 mt-3 mt-lg-0'>
                                <div className='w-50 fw-bold'>
                                    <p>Change: </p>
                                    <p>Current Price: </p>
                                    <p>Market Value:</p>
                                </div>


                                <div className={`mx-5 w-50 fw-bold ${getChangeColorClass(((stock.totalCost / stock.quantity) - quoteList[index].c).toFixed(2))}`}>
                                    <p>
                                        {((stock.totalCost / stock.quantity) - quoteList[index].c).toFixed(2) > 0 ? <i className="bi bi-caret-up-fill text-success"></i> : (((stock.totalCost / stock.quantity) - quoteList[index].c).toFixed(2) < 0 ? <i className="bi bi-caret-down-fill text-danger"></i> : null)}
                                        {((stock.totalCost / stock.quantity) - quoteList[index].c).toFixed(2)}
                                    </p>
                                    <p>{quoteList[index].c.toFixed(2)}</p>
                                    <p>{(stock.quantity * quoteList[index].c).toFixed(2)}</p>
                                </div>

                            </div>
                        </div>
                    </div>
                    <div className="card-footer d-flex justify-content-start">
                        <button className="btn btn-primary me-2" onClick={() => handleBuy(stock.ticker)}>Buy</button>
                        <button className="btn btn-danger" onClick={() => handleSell(stock.ticker)}>Sell</button>
                    </div>

                    {showBuyModal && selectedTicker === stock.ticker && (
                        <div className="modal" id={`buyModal-${stock.ticker}`} tabIndex="-1" style={{ display: 'block' }}>
                            <div className="modal-dialog">
                                <div className="modal-content">
                                    <div className="modal-header">
                                        <h5 className="modal-title">{stock.ticker}</h5>
                                        <button type="button" className="btn-close" aria-label="Close" onClick={handleCloseModal}></button>
                                    </div>
                                    <div className="modal-body" style={{ paddingLeft: '20px' }}>
                                        <p style={{ textAlign: 'left' }}>Current Price: {quoteList.find(item => item.ticker === stock.ticker)?.c}</p>
                                        <p style={{ textAlign: 'left' }}>Money in wallet: ${portfolioData?.balance.toFixed(2)}</p>
                                        <div className="row">
                                            <div className="col-auto" style={{ paddingRight: '5px' }}>
                                                <p style={{ textAlign: 'left' }}>Quantity:</p>
                                            </div>
                                            <div className="col">
                                                <input type="number" autoFocus value={quantity} onChange={handleQuantityChange} className="form-control" style={{ width: '100%' }} />
                                            </div>
                                        </div>
                                        {notEnoughMoney && (
                                            <p style={{ textAlign: 'left', color: 'red' }}>Not enough money in Wallet!</p>
                                        )}
                                    </div>
                                    <div className="modal-footer" style={{ justifyContent: 'space-between', paddingLeft: '20px' }}>
                                        <p style={{ textAlign: 'left' }}>Total: ${totalCost.toFixed(2)}</p>
                                        <button type="button" className="btn btn-success" disabled={quantity === '' || totalCost > portfolioData.balance} onClick={handleBuyStock}>Buy</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {showSellModal && selectedTicker === stock.ticker && (
                        <div className="modal" id={`sellModal-${stock.ticker}`} tabIndex="-1" style={{ display: 'block' }}>
                            <div className="modal-dialog">
                                <div className="modal-content">
                                    <div className="modal-header">
                                        <h5 className="modal-title">{stock.ticker}</h5>
                                        <button type="button" className="btn-close" aria-label="Close" onClick={handleCloseModal}></button>
                                    </div>
                                    <div className="modal-body" style={{ paddingLeft: '20px' }}>
                                        <p style={{ textAlign: 'left' }}>Current Price: {quoteList.find(item => item.ticker === stock.ticker)?.c}</p>
                                        <p style={{ textAlign: 'left' }}>Money in wallet: ${portfolioData?.balance.toFixed(2)}</p>
                                        <div className="row">
                                            <div className="col-auto" style={{ paddingRight: '5px' }}>
                                                <p style={{ textAlign: 'left' }}>Quantity:</p>
                                            </div>
                                            <div className="col">
                                                <input type="number" autoFocus value={quantity} onChange={handleQuantityChangeSell} className="form-control" style={{ width: '100%' }} />
                                            </div>
                                        </div>
                                        {notEnoughStock && (
                                            <p style={{ textAlign: 'left', color: 'red' }}>You cannot sell stocks that you don't have!</p>
                                        )}
                                    </div>
                                    <div className="modal-footer" style={{ justifyContent: 'space-between', paddingLeft: '20px' }}>
                                        <p style={{ textAlign: 'left' }}>Total: ${totalCost.toFixed(2)}</p>
                                        <button type="button" className="btn btn-success" disabled={quantity === '' || quantity <= 0 || quantity > stock.quantity} onClick={handleSellStock}>Sell</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            ))
            }
        </div >
    );
}

export default Portfolio;
