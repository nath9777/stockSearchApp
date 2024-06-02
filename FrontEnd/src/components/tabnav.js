import React, { useState, useEffect, useContext } from 'react';
import { Grid, Card, CardMedia, CardContent, Tabs, Tab, Typography, Modal, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { X, Facebook, Close } from '@mui/icons-material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSquareFacebook, faXTwitter } from '@fortawesome/free-brands-svg-icons';
import axios from 'axios';
import StockChartHome from './stockChartHome';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import indicators from 'highcharts/indicators/indicators';
import vbp from 'highcharts/indicators/volume-by-price';
import "../App.css"
import { Contexts } from '../contexts/SearchContext';

indicators(Highcharts);
vbp(Highcharts);

function TabNav({ setSearchInput, handleSearch, searchInput, searchTriggered, setSearchTriggered }) {
    const [selectedTab, setSelectedTab] = useState(0);
    const [peers, setPeers] = useState([]);
    const [hourlyPrices, setHourlyPrices] = useState([]);
    const [peerClicked, setPeerClicked] = useState(false);
    const [news, setNews] = useState([]);
    const [selectedArticle, setSelectedArticle] = useState(null);
    const [chartOptions, setChartOptions] = useState(null);
    const [insightData, setInsightData] = useState(null);
    const [earningsData, setEarningsData] = useState([]);
    const [trendsData, setTrendsData] = useState([]);
    const { contextLoad, setContextLoad } = useContext(Contexts);

    const searchData = contextLoad.searchData
    const quoteData = contextLoad.quoteData

    useEffect(() => {
        if (contextLoad.peers && contextLoad.hourlyPrices) {
            setPeers(contextLoad.peers);
            setHourlyPrices(contextLoad.hourlyPrices);
        }

        if (contextLoad.news) {
            setNews(contextLoad.news);
        }

        if (contextLoad.chartOptions) {
            setChartOptions(generateChartOptions(contextLoad.chartOptions));
        }

        if (contextLoad.insightData && contextLoad.trendsData && contextLoad.earningsData) {
            setInsightData(contextLoad.insightData);
            setTrendsData(contextLoad.trendsData);
            setEarningsData(contextLoad.earningsData);
        }
    }, [contextLoad.peers, contextLoad.hourlyPrices, contextLoad.news, contextLoad.chartOptions]);

    const formatDateTime = (timestamp) => {
        if (!timestamp) return "";
        const date = new Date(timestamp * 1000);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };

    useEffect(() => {
        const fetchPeers = async () => {
            try {
                const response = await axios.get(`/api/peers/${searchData.ticker}`);
                setPeers(response.data);

                setContextLoad((currentData) => ({ ...currentData, peers: response.data }))

            } catch (error) {
                console.error('Error fetching peers:', error);
            }
        };
        fetchPeers();
    }, [searchData.ticker]);

    useEffect(() => {
        const fetchHourlyPrices = async () => {
            try {
                const currentTimestamp = Date.now();

                const quoteTimestamp = quoteData.t * 1000;

                const timeDifferenceMinutes = Math.abs((currentTimestamp - quoteTimestamp) / (1000 * 60));

                let pastDate = new Date();
                let currentDate = new Date();

                if (timeDifferenceMinutes > 5) {

                    currentDate = new Date(quoteTimestamp);
                    pastDate = new Date(currentDate);
                    pastDate.setDate(currentDate.getDate() - 1);
                } else {
                    pastDate = new Date(currentDate);
                    pastDate.setDate(currentDate.getDate() - 1);
                }

                const pastDateString = pastDate.toISOString().split('T')[0];
                const currentDateString = currentDate.toISOString().split('T')[0];

                const response = await axios.get(`/api/summary-chart/${searchData.ticker}/${pastDateString}/${currentDateString}`);
                setHourlyPrices(response.data);

                setContextLoad((currentData) => ({ ...currentData, hourlyPrices: response.data }))

            } catch (error) {
                console.error('Error fetching hourly prices:', error);
            }
        };
        fetchHourlyPrices();
    }, [quoteData.t, searchData.ticker]);


    useEffect(() => {
        const fetchTopNews = async () => {
            try {
                const currentDate = new Date();
                const pastDate = new Date();
                pastDate.setMonth(pastDate.getMonth() - 6);

                const pastDateString = pastDate.toISOString().split('T')[0];
                const currentDateString = currentDate.toISOString().split('T')[0];

                const response = await axios.get(`/api/company-news/${searchData.ticker}/${pastDateString}/${currentDateString}`);
                const filteredNews = response.data.filter(item => (
                    item.image && item.headline && item.url && item.datetime && item.summary && item.source
                )).slice(0, 20);

                setNews(filteredNews);

                setContextLoad((currentData) => ({ ...currentData, news: filteredNews }))

            } catch (error) {
                console.error('Error fetching top news:', error);
            }
        };
        fetchTopNews();
    }, [searchData.ticker]);

    const handleTabChange = (event, newValue) => {
        setSelectedTab(newValue);

    };

    const handlePeerClick = (peer) => {
        setSearchInput(peer);
        setPeerClicked(true);
    };

    const handleCardClick = (article) => {
        setSelectedArticle(article);
    };

    const handleCloseModal = () => {
        setSelectedArticle(null);
    };

    const handleTwitterShare = () => {
        window.open(`https://twitter.com/intent/tweet?text=${selectedArticle.headline}&url=${selectedArticle.url}`, '_blank');
    };

    const handleFacebookShare = () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${selectedArticle.url}`, '_blank');
    };

    const handleMoreDetailsClick = () => {
        window.open(selectedArticle.url, '_blank');
    };

    useEffect(() => {

        if (searchInput && searchTriggered && peerClicked) {
            setContextLoad((currentData) => ({
                ...currentData, hourlyPrices: null, news: null,
                chartOptions: null, peers: null, insightData: null, trendsData: null, earningsData: null
            }));
            handleSearch();
            setPeerClicked(false);
        }
    }, [searchInput, searchTriggered, peerClicked]);


    useEffect(() => {
        const fetchSummaryData = async () => {
            try {
                const currentDate = new Date();
                const pastDate = new Date();
                pastDate.setFullYear(pastDate.getFullYear() - 2);

                const pastDateString = pastDate.toISOString().split('T')[0];
                const currentDateString = currentDate.toISOString().split('T')[0];

                const response = await axios.get(`/api/summary-chart-tab/${searchData.ticker}/${pastDateString}/${currentDateString}`);
                const chartData = processData(response.data, response.data.ticker);
                setChartOptions(generateChartOptions(chartData));

                setContextLoad((currentData) => ({ ...currentData, chartOptions: chartData }))

            } catch (error) {
                console.error('Error fetching summary chart data:', error);
            }
        };

        fetchSummaryData();
    }, [searchData.ticker]);

    const processData = (data, ticker) => {
        const ohlcData = [];
        const volumeData = [];

        data.results.forEach(item => {
            const timestamp = item.t;
            const open = item.o;
            const high = item.h;
            const low = item.l;
            const close = item.c;
            const volume = item.v;

            ohlcData.push([timestamp, open, high, low, close]);
            volumeData.push([timestamp, volume]);
        });

        return { ohlc: ohlcData, volume: volumeData, ticker: ticker };
    };

    const generateChartOptions = (chartData) => {

        return {
            chart: {
                backgroundColor: '#f2f2f2',
                zoomType: 'x',
                height: 500
            },
            rangeSelector: {
                buttons: [{
                    type: 'month',
                    count: 1,
                    text: '1m'
                }, {
                    type: 'month',
                    count: 3,
                    text: '3m'
                }, {
                    type: 'month',
                    count: 6,
                    text: '6m'
                }, {
                    type: 'ytd',
                    text: 'YTD'
                },
                {
                    type: 'year',
                    count: 1,
                    text: '1y'
                },
                {
                    type: 'all',
                    text: 'All'
                }],
                selected: 2,
                inputEnabled: true,
            },
            title: {
                text: `${chartData.ticker} Historical`,
            },
            subtitle: {
                text: 'With OHLC and Volume by Price technical indicators'
            },
            series: [
                {
                    type: 'candlestick',
                    name: `${chartData.ticker}`,
                    id: `${chartData.ticker}`,
                    data: chartData.ohlc
                },
                {
                    type: 'column',
                    name: 'Volume',
                    id: 'volume',
                    data: chartData.volume,
                    yAxis: 1
                },
                {
                    type: 'vbp',
                    linkedTo: `${chartData.ticker}`,
                    params: {
                        volumeSeriesID: 'volume'
                    },
                    dataLabels: {
                        enabled: false
                    },
                    zoneLines: {
                        enabled: false
                    }
                },
                {
                    type: 'sma',
                    linkedTo: `${chartData.ticker}`,
                    zIndex: 1,
                    marker: {
                        enabled: false
                    }
                }
            ],
            yAxis: [
                {
                    startOnTick: false,
                    endOnTick: false,
                    labels: {
                        align: 'right',
                        x: -3
                    },
                    title: {
                        text: 'OHLC'
                    },
                    height: '60%',
                    lineWidth: 2,
                    resize: {
                        enabled: true
                    },
                    opposite: true
                },
                {
                    labels: {
                        align: 'right',
                        x: -3
                    },
                    title: {
                        text: 'Volume'
                    },
                    top: '65%',
                    height: '35%',
                    offset: 0,
                    lineWidth: 2,
                    opposite: true
                }
            ],
            tooltip: {
                split: true
            },
            plotOptions: {
                series: {
                    dataGrouping: {
                        units: [
                            [
                                'week',
                                [1]
                            ],
                            [
                                'month',
                                [1, 2, 3, 4, 6]
                            ]
                        ]
                    }
                }
            }
        };
    };

    // for 4th tab insights
    useEffect(() => {
        const fetchInsightData = async () => {
            try {
                const response = await axios.get(`/api/insight/${searchData.ticker}`);
                setInsightData(response.data);

                setContextLoad((currentData) => ({ ...currentData, insightData: response.data }))
            } catch (error) {
                console.error('Error fetching insight data:', error);
            }
        };

        fetchInsightData();
    }, [searchData.ticker]);

    // for 4th tab left chart (trends)
    useEffect(() => {
        const fetchTrendsData = async () => {
            try {
                const response = await axios.get(`/api/recommendation-trends/${searchData.ticker}`);
                setTrendsData(response.data);

                setContextLoad((currentData) => ({ ...currentData, trendsData: response.data }))

            } catch (error) {
                console.error('Error fetching earnings data:', error);
            }
        };
        fetchTrendsData();
    }, [searchData.ticker]);

    // for 4th tab right chart (earnings)
    useEffect(() => {
        const fetchEarningsData = async () => {
            try {
                const response = await axios.get(`/api/earnings/${searchData.ticker}`);
                setEarningsData(response.data);

                setContextLoad((currentData) => ({ ...currentData, earningsData: response.data }))

            } catch (error) {
                console.error('Error fetching earnings data:', error);
            }
        };
        fetchEarningsData();
    }, [searchData.ticker]);

    return (
        <div class="container-fluid justify-content-center col col-md-7 mx-auto my-1">
            <Tabs
                value={selectedTab}
                onChange={handleTabChange}
                TabIndicatorProps={{
                    style: {
                        backgroundColor: "#1d279d"
                    }
                }}
                textColor='inherit'
                variant="scrollable"
                scrollButtons
                allowScrollButtonsMobile
                sx={{ marginBottom: '20px' }}
            >
                <Tab
                    label="Summary"
                    sx={{
                        textTransform: 'none',
                        color: selectedTab === 0 ? '#1d279d' : 'inherit',
                        '&:hover': { backgroundColor: '#f5f5f5' },
                        minWidth: "fit-content", flex: 1
                    }}
                />
                <Tab
                    label="Top News"
                    sx={{
                        textTransform: 'none',
                        color: selectedTab === 1 ? '#1d279d' : 'inherit',
                        '&:hover': { backgroundColor: '#f5f5f5' },
                        minWidth: "fit-content", flex: 1
                    }}
                />
                <Tab
                    label="Charts"
                    sx={{
                        textTransform: 'none',
                        color: selectedTab === 2 ? '#1d279d' : 'inherit',
                        '&:hover': { backgroundColor: '#f5f5f5' },
                        minWidth: "fit-content", flex: 1
                    }}
                />
                <Tab
                    label="Insights"
                    sx={{
                        textTransform: 'none',
                        color: selectedTab === 3 ? '#1d279d' : 'inherit',
                        '&:hover': { backgroundColor: '#f5f5f5' },
                        minWidth: "fit-content", flex: 1
                    }}
                />
            </Tabs>

            <TabPanel value={selectedTab} index={0} searchData={searchData} quoteData={quoteData}>
                <div className="tab-data-container">
                    <div className="w-100 row">
                        <div className="col-md-6">
                            <div className="leftHalf">
                                <div className="leftHalfUpper d-flex flex-column justify-content-center align-items-center col-md-6 col-sm-12">
                                    <Typography variant="body2"><b>High Price:</b> {quoteData.h.toFixed(2)}</Typography>
                                    <Typography variant="body2"><b>Low Price</b>: {quoteData.l.toFixed(2)}</Typography>
                                    <Typography variant="body2"><b>Open Price</b>: {quoteData.o.toFixed(2)}</Typography>
                                    <Typography variant="body2"><b>Prev. Close:</b> {quoteData.pc.toFixed(2)}</Typography>
                                </div>

                                <div className="leftHalfLower">
                                    <Typography variant="body1"><u><b>About the Company</b></u></Typography><br></br>
                                    <Typography variant="body2"><b>IPO Start Date:</b> {searchData.ipo}</Typography>
                                    <Typography variant="body2"><b>Industry:</b> {searchData.finnhubIndustry}</Typography>
                                    <Typography variant="body2">
                                        <b>Webpage:</b> <a href={searchData.weburl} target="_blank" rel="noopener noreferrer">{searchData.weburl}</a>
                                    </Typography><br></br>
                                    <Typography variant="body2"><b>Company Peers:</b> </Typography>
                                    <div className='text-center'>
                                        {peers
                                            .filter(peer => !peer.includes('.'))
                                            .map((peer, index) => (
                                                <button key={peer} onClick={() => handlePeerClick(peer)}
                                                    style={{
                                                        fontSize: 'smaller',
                                                        border: 'none',
                                                        background: 'none',
                                                        color: 'blue',
                                                        textDecoration: 'underline',
                                                        cursor: 'pointer',
                                                        display: 'inline-block',
                                                        padding: '0.10rem'
                                                    }}>
                                                    {index !== 0 && ','}
                                                    {peer}
                                                </button>
                                            ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="container-fluid col-md-6 col-sm-12 " >
                            <div className="rightHalf text-center">
                                <div className="col-md-12 col-sm-12 ">
                                    <StockChartHome data={hourlyPrices} quoteData={quoteData} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </TabPanel>
            <TabPanel value={selectedTab} index={1} searchData={searchData} quoteData={quoteData}>
                <div className="container">
                    <div className="row">
                        {news.map((article, index) => (
                            <div className="col-lg-6 col-md-6" key={index}>
                                <div className="card mb-3 border" onClick={() => handleCardClick(article)} style={{ cursor: 'pointer' }}>
                                    {/* For lg and md layout */}
                                    <div className="d-none d-sm-block">
                                        <div className='card-body d-flex align-items-center' style={{ backgroundColor: '#fbfbfb' }}>
                                            <img src={article.image} className="card-img" alt={article.headline} style={{ maxWidth: '120px', height: '80px', marginRight: '20px' }} />
                                            <div>
                                                <h5 className="card-title text-center mb-0" style={{ fontSize: 'smaller' }}>{article.headline}</h5>
                                            </div>
                                        </div>
                                    </div>

                                    {/* For sm layout */}
                                    <div className="d-block d-sm-none card-body d-flex flex-column align-items-center" style={{ backgroundColor: '#fbfbfb' }}>
                                        <img src={article.image} className="card-img" alt={article.headline} style={{ maxWidth: '300px', height: '200px', marginBottom: '10px' }} />
                                        <h5 className="card-title text-center mb-0" style={{ fontSize: 'smaller' }}>{article.headline}</h5>
                                    </div>

                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {selectedArticle && (
                    <div className="modal" id="articleModal" tabIndex="-1" style={{ display: 'block' }}>
                        <div className="modal-dialog">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <div>
                                        <h2 className="modal-title" id="articleModalLabel" style={{ fontWeight: 'bold', fontSize: '1.8rem', color: 'black' }}>{selectedArticle.source}</h2>
                                        <h5 className="modal-title" id="articleModalLabel" style={{ color: '#6c757d', fontSize: '0.8rem' }}>{formatDateTime(selectedArticle.datetime)}</h5>
                                    </div>
                                    <button type="button" className="btn btn-link" aria-label="Close" onClick={handleCloseModal}>
                                        <span aria-hidden="true">&times;</span>
                                    </button>
                                </div>
                                <div className="modal-body">
                                    <h5 style={{ fontSize: '1rem', color: 'black' }}>{selectedArticle.headline}</h5>
                                    <p style={{ color: '#6c757d', fontSize: '0.8rem' }}>{selectedArticle.summary}</p>
                                    <p style={{ color: '#6c757d', fontSize: '0.8rem' }}>For more details click <a href={selectedArticle.url} target="_blank" rel="noopener noreferrer">here</a></p>
                                    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '5px', marginTop: '20px' }}>
                                        Share
                                        <div>
                                            <FontAwesomeIcon icon={faXTwitter} className='fa-3x' onClick={handleTwitterShare} />
                                            <FontAwesomeIcon icon={faSquareFacebook} className='fa-3x' style={{ color: 'blue' }} onClick={handleFacebookShare} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </TabPanel>

            <TabPanel value={selectedTab} index={2} searchData={searchData} quoteData={quoteData}>
                {chartOptions ? (
                    <HighchartsReact highcharts={Highcharts} constructorType={"stockChart"} options={chartOptions} />
                ) : (
                    <div className="box text-center text-danger">
                        Charts not available due to Rate Limiter, Please try again later
                    </div>
                )}
            </TabPanel>


            <TabPanel value={selectedTab} index={3} searchData={searchData} quoteData={quoteData}>
                <Typography variant='h5' style={{ textAlign: 'center' }}>Insider Sentiments</Typography>
                {insightData && <InsightTable insightData={insightData} />}
                <br></br>
                <div className="container-fluid w-100">
                    <div className="row">
                        <div className="col-md-6 px-1">
                            <HighchartsReact
                                highcharts={Highcharts}
                                options={generateFirstHighchartOptions(trendsData)}
                            />
                        </div>
                        <div className="col-md-6 px-1">
                            <HighchartsReact
                                highcharts={Highcharts}
                                options={generateSecondHighchartOptions(earningsData)}
                            />
                        </div>
                    </div>
                </div>

            </TabPanel>

        </div >
    );
}


function InsightTable({ insightData }) {

    const totalMSPR = insightData.data.reduce((total, item) => total + item.mspr, 0).toFixed(2);
    const positiveMSPR = insightData.data.reduce((total, item) => total + (item.mspr > 0 ? item.mspr : 0), 0).toFixed(2);
    const negativeMSPR = insightData.data.reduce((total, item) => total + (item.mspr < 0 ? item.mspr : 0), 0).toFixed(2);
    const totalChange = insightData.data.reduce((total, item) => total + item.change, 0).toFixed(2);
    const positiveChange = insightData.data.reduce((total, item) => total + (item.change > 0 ? item.change : 0), 0).toFixed(2);
    const negativeChange = insightData.data.reduce((total, item) => total + (item.change < 0 ? item.change : 0), 0).toFixed(2);

    return (
        <div className="container">
            <div className="row justify-content-center">
                <div className="col-lg-6">
                    <TableContainer component={Paper} sx={{ width: '100%', height: 'auto', margin: 'auto', border: 'none', boxShadow: 'none' }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell align='center'><b>{insightData.symbol}</b></TableCell>
                                    <TableCell align='center'><b>MSPR</b></TableCell>
                                    <TableCell align='center'><b>Change</b></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell align='center'><b>Total</b></TableCell>
                                    <TableCell align='center'>{totalMSPR}</TableCell>
                                    <TableCell align='center'>{totalChange}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell align='center'><b>Positive</b></TableCell>
                                    <TableCell align='center'>{positiveMSPR}</TableCell>
                                    <TableCell align='center'>{positiveChange}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell align='center'><b>Negative</b></TableCell>
                                    <TableCell align='center'>{negativeMSPR}</TableCell>
                                    <TableCell align='center'>{negativeChange}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </div>
            </div>
        </div>
    );
}


function generateFirstHighchartOptions(trendsData) {
    const categories = trendsData.map(entry => entry.period);

    const seriesData = [
        {
            name: 'Strong Buy',
            data: trendsData.map(entry => entry.strongBuy)
        },
        {
            name: 'Buy',
            data: trendsData.map(entry => entry.buy)
        },
        {
            name: 'Hold',
            data: trendsData.map(entry => entry.hold)
        },
        {
            name: 'Sell',
            data: trendsData.map(entry => entry.sell)
        },
        {
            name: 'Strong Sell',
            data: trendsData.map(entry => entry.strongSell)
        }
    ];

    return {
        chart: {
            height: 500,
            backgroundColor: '#f2f2f2',
            zoomType: 'x',
            type: 'column'
        },
        title: {
            text: 'Recommendation Trends',
            align: 'center'
        },
        xAxis: {
            categories: categories.map(label => label.substring(0, 7))
        },
        yAxis: {
            min: 0,
            title: {
                text: '#Analysis'
            },
            stackLabels: {
                enabled: false
            }
        },
        tooltip: {
            headerFormat: '<b>{point.x}</b><br/>',
            pointFormat: '{series.name}: {point.y}<br/>Total: {point.stackTotal}'
        },
        plotOptions: {
            column: {
                stacking: 'normal',
                dataLabels: {
                    enabled: true
                }
            }
        },
        series: seriesData,
        colors: ['#207943', '#1fc15f', '#c2951e', '#e56968', '#8b3936'],
        credits: {
            enabled: false
        }
    };
}

function generateSecondHighchartOptions(data) {
    const actualData = data.map(item => [item.period, item.actual]);
    const estimateData = data.map(item => [item.period, item.estimate]);
    const surpriseData = data.map(item => [item.period, item.surprise]);

    return {
        chart: {
            height: 500,
            backgroundColor: '#f2f2f2',
            type: 'spline',
            zoomType: 'x',
            inverted: false
        },
        title: {
            text: 'Historical EPS Surprises',
            align: 'center'
        },
        xAxis: {
            categories: data.map(item => item.period),
            labels: {
                align: 'center',
                whiteSpace: "nowrap",
                textOverflow: "none",
                autoRotation: false,
                overflow: false,
                formatter: function () {
                    const index = this.pos;
                    const period = this.axis.categories[index];
                    const surpriseValue = data[index].surprise;
                    return `${period}<br>Surprise: ${surpriseValue}`;
                }
            },

        },
        yAxis: {
            title: {
                text: 'Quaterly EPS'
            },
            labels: {
                format: '{value}'
            },
            plotLines: [{
                value: 0,
                color: 'gray',
                width: 1,
                zIndex: 3
            }]
        },
        tooltip: {
            headerFormat: '<b>{series.name}</b><br/>',
            pointFormat: '{point.category}: {point.y}'
        },
        plotOptions: {
            spline: {
                marker: {
                    enabled: true
                }
            }
        },
        series: [{
            name: 'Actual',
            data: actualData
        }, {
            name: 'Estimate',
            data: estimateData
        }],
        credits: {
            enabled: false
        }
    };
};



function TabPanel(props) {
    const { children, value, index, searchData, quoteData, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`tabpanel-${index}`}
            aria-labelledby={`tab-${index}`}
            style={{ p: 3 }}
            {...other}
        >
            {value === index && (
                <Typography>{children}</Typography>
            )}
        </div>
    );
}

export default TabNav;
