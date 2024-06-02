import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import SearchLeftResult from './searchLeft';
import SearchMiddleResult from './searchMiddle';
import SearchRightResult from './searchRight';
import TabNav from './tabnav';
import { Contexts } from '../contexts/SearchContext';
import { useLocation } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import Autocomplete from '@mui/material/Autocomplete';

function HomePage() {
    const [searchInput, setSearchInput] = useState('');
    const [searchTriggered, setSearchTriggered] = useState(false);
    const [searchData, setSearchData] = useState(null);
    const [quoteData, setQuoteData] = useState(null);
    const [selectedTab, setSelectedTab] = useState('Summary');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { contextLoad, setContextLoad } = useContext(Contexts);
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [options, setOptions] = useState([]);
    const [fetchingSuggestions, setFetchingSuggestions] = useState(false);
    const [shouldSearch, setShouldSearch] = useState(false);

    useEffect(() => {
        if (contextLoad.searchData && contextLoad.quoteData) {
            setSearchData(contextLoad.searchData);
            setQuoteData(contextLoad.quoteData);
            setSearchTriggered(true);
        }
    }, [contextLoad.searchData, contextLoad.quoteData]);

    useEffect(() => {
        if (contextLoad.searchData) {
            fetchQuoteData(contextLoad.searchData.ticker);
            const intervalId = setInterval(() => fetchQuoteData(contextLoad.searchData.ticker), 15000);
            return () => clearInterval(intervalId);
        }
    }, [contextLoad.searchData]);

    const fetchQuoteData = async (ticker) => {
        try {

            const response = await axios.get(`/api/quote/${ticker}`);
            setQuoteData(response.data);
            setContextLoad(prevState => ({ ...prevState, quoteData: response.data }));

        } catch (error) {
            console.error('Error fetching quote data:', error);

        }
    };

    const handleInputChange = (event, newValue) => {
        setFetchingSuggestions(true);
        console.log("Checking if reached inside handleInputChange: ", newValue);
        if (newValue.includes('|')) {

            const displaySymbol = newValue.split('|')[0].trim();
            console.log("inside handleInputChange after trimming: ", displaySymbol);
            setSearchInput(displaySymbol);
        } else {
            console.log("inside handleInputChange WITHOUT trimming: ", newValue);
            setSearchInput(newValue);
        }
        setFetchingSuggestions(false);
    };

    useEffect(() => {
        let timer;

        const fetchSuggestions = async () => {
            try {
                setOptions([]);
                setFetchingSuggestions(true);
                const response = await axios.get(`/api/auto/${searchInput}`);
                const formattedOptions = response.data.result
                    .filter(option => option.type === 'Common Stock' && !option.symbol.includes('.'))
                    .map(option => ({
                        label: `${option.displaySymbol} | ${option.description}`,
                        value: option.displaySymbol.toString()
                    }));
                setOptions(formattedOptions);
            } catch (error) {
                console.error('Error fetching suggestions:', error);
            } finally {
                setFetchingSuggestions(false);
            }
        };

        const handleSearchInputChange = () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                if (searchInput.length > 0) {
                    fetchSuggestions();
                } else {
                    setOptions([]);
                }
            }, 300);
        };

        if (searchInput.length > 0) {
            handleSearchInputChange();
        } else {
            setOptions([]);
        }

        return () => clearTimeout(timer);
    }, [searchInput]);


    useEffect(() => {
        if (shouldSearch) {
            handleSearch();
            setShouldSearch(false);
        }
    }, [shouldSearch]);


    const handleSearch = async () => {
        console.log("Checking the search input obtained: ", searchInput);
        try {
            setLoading(true);
            if (!searchInput) {
                setError('Please enter a valid ticker symbol.');
                setContextLoad((currentData) => ({
                    ...currentData, searchData: null, quoteData: null, hourlyPrices: null, news: null,
                    chartOptions: null, peers: null, insightData: null, trendsData: null, earningsData: null
                }));
                setLoading(false);
                return;
            }

            const response = await axios.get(`/api/search/${searchInput}`);
            if (Object.keys(response.data).length === 0) {
                setError("No data found. Please enter a valid Ticker");
                setSearchData(null);
                setQuoteData(null);
                setSearchTriggered(false);
                setContextLoad((currentData) => ({
                    ...currentData, searchData: null, quoteData: null, hourlyPrices: null, news: null,
                    chartOptions: null, peers: null, insightData: null, trendsData: null, earningsData: null
                }));
                setLoading(false);
                return;
            }

            const quoteResponse = await axios.get(`/api/quote/${searchInput}`);
            setQuoteData(quoteResponse.data);

            setSearchTriggered(true);
            setError('');
            navigate(`/search/${searchInput}`);

            setContextLoad((currentData) => ({ ...currentData, searchData: response.data, quoteData: quoteResponse.data }))
            setSearchData(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data', error);
            setError('Error fetching data. Please try again later.');
            setLoading(false);
        }
    };


    useEffect(() => {
        const ticker = location.pathname.split('/')[2];

        if (location.pathname === '/search/home') {
            return;
        }

        if (ticker) {
            setSearchInput(ticker);
            fetchDataForTicker(ticker);
        }
    }, [location.pathname]);

    const fetchDataForTicker = async (ticker) => {
        try {
            const response = await axios.get(`/api/search/${ticker}`);
            const quoteResponse = await axios.get(`/api/quote/${ticker}`);
            setContextLoad((currentData) => ({
                ...currentData,
                searchData: response.data,
                quoteData: quoteResponse.data
            }));
            setSearchData(response.data);
            setQuoteData(quoteResponse.data);
            setSearchTriggered(true);
        } catch (error) {
            console.error('Error fetching data', error);
            setError('Error fetching data. Please try again later.');
        }
    };


    const handleClear = () => {
        setSearchInput('');
        setSearchTriggered(false);
        setSearchData(null);
        setQuoteData(null);
        setOptions([]);
        navigate('/search/home');
        setError('');
        setContextLoad((currentData) => ({
            ...currentData, searchData: null, quoteData: null, hourlyPrices: null, news: null,
            chartOptions: null, peers: null, insightData: null, trendsData: null, earningsData: null
        }));
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch();
        }
    };


    const handleTabChange = (tab) => {
        setSelectedTab(tab);
    };


    return (
        <div className="d-flex align-items-center flex-column">
            <div className="container mt-3 d-flex justify-content-center align-items-center flex-column">
                <h2 className="mt-4 mb-4">STOCK SEARCH</h2>
                <div className="mb-3 border border-primary px-3 border-4 custom-input-group rounded-pill position-relative">

                    <Autocomplete
                        id="stock-search"
                        freeSolo
                        disableClearable={true}
                        options={options.map(option => option.label)}
                        value={searchInput}
                        onChange={(event, newValue) => {
                            if (newValue.includes('|')) {
                                const displaySymbol = newValue.split('|')[0].trim();
                                setSearchInput(displaySymbol);
                                setShouldSearch(true);
                            } else {
                                setSearchInput(newValue);
                                setShouldSearch(true);
                            }
                            // handleSearch();
                            // setShouldSearch(true);
                        }}

                        onInputChange={(event, newValue, reason) => {
                            console.log("Is onInputChange even being called? ", newValue);
                            if (newValue.includes('|')) {

                                const displaySymbol = newValue.split('|')[0].trim();
                                setSearchInput(displaySymbol);
                            } else {
                                setSearchInput(newValue);
                            }

                        }}
                        loading={fetchingSuggestions}
                        loadingText={<CircularProgress />}
                        renderInput={(params) => (
                            <div className="input-group" ref={params.InputProps.ref}>
                                <input
                                    type="text"
                                    {...params.inputProps}
                                    className="form-control form-control-sm border-0"
                                    placeholder="Enter stock ticker symbol"
                                    value={searchInput}
                                    onChange={(event) => {
                                        const newValue = event.target.value;
                                        handleInputChange(event, newValue);
                                        console.log("Inside the input in AUTOCOMPLETE: ", newValue);
                                        console.log("Inside the input in AUTOCOMPLETE serahcInput: ", searchInput);
                                    }}
                                    onKeyDown={handleKeyDown}
                                />
                                <button className="btn border-0" type="button" onClick={handleSearch}>
                                    <i className="bi bi-search btn-color-1"></i>
                                </button>
                                <button className="btn border-0" type="button" onClick={handleClear}>
                                    <i className="bi bi-x btn-color-1"></i>
                                </button>
                            </div>
                        )}
                    />

                </div>
            </div>
            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}
            {loading && <CircularProgress />}
            {searchTriggered && searchData && quoteData && (
                <div className="mt-4 text-center">
                    {contextLoad.successMessage && (
                        <div className="alert alert-success alert-dismissible fade show" role="alert">
                            {contextLoad.successMessage}
                            <button type="button" className="btn-close" onClick={() => setContextLoad((currentData) => ({ ...currentData, successMessage: '', errorMessage: '' }))}></button>
                        </div>
                    )}
                    {contextLoad.errorMessage && (
                        <div className="alert alert-danger alert-dismissible fade show" role="alert">
                            {contextLoad.errorMessage}
                            <button type="button" className="btn-close" onClick={() => setContextLoad((currentData) => ({ ...currentData, successMessage: '', errorMessage: '' }))}></button>
                        </div>
                    )}
                    {contextLoad.successMessagePortfolio && (
                        <div className="alert alert-success alert-dismissible fade show" role="alert">
                            {contextLoad.successMessagePortfolio}
                            <button type="button" className="btn-close" onClick={() => setContextLoad((currentData) => ({ ...currentData, successMessagePortfolio: '', errorMessagePortfolio: '' }))}></button>
                        </div>
                    )}
                    {contextLoad.errorMessagePortfolio && (
                        <div className="alert alert-danger alert-dismissible fade show" role="alert">
                            {contextLoad.errorMessagePortfolio}
                            <button type="button" className="btn-close" onClick={() => setContextLoad((currentData) => ({ ...currentData, successMessagePortfolio: '', errorMessagePortfolio: '' }))}></button>
                        </div>
                    )}

                    <div className="d-flex justify-content-center">
                        <div className="col-md-4 mb-2">
                            <SearchLeftResult searchData={searchData} />
                        </div>
                        <div className="col-md-4 mb-2">
                            <SearchMiddleResult searchData={searchData} quoteData={quoteData} />
                        </div>
                        <div className="col-md-4 mb-2">
                            <SearchRightResult quoteData={quoteData} />
                        </div>
                    </div>
                </div>
            )}


            {searchTriggered && searchData && quoteData && (
                <TabNav
                    searchData={searchData}
                    quoteData={quoteData}
                    selectedTab={selectedTab}
                    handleTabChange={handleTabChange}
                    setSearchInput={setSearchInput}
                    handleSearch={handleSearch}
                    searchInput={searchInput}
                    searchTriggered={searchTriggered}
                    setSearchTriggered={setSearchTriggered}
                />

            )}
        </div>
    );

}

export default HomePage;
