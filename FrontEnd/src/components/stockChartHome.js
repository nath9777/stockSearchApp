import React, { useEffect, useState } from 'react';
import Highcharts from 'highcharts';

const StockChartHome = ({ data, quoteData }) => {
    const [chartInitialized, setChartInitialized] = useState(false);

    useEffect(() => {
        setChartInitialized(false);
    }, [data, quoteData]);

    useEffect(() => {
        if (!chartInitialized && data && data.results && data.results.length > 0) {
            const timestamps = data.results.map(result => result.t);
            const closePrices = data.results.map(result => result.c);
            const isPositive = parseFloat(quoteData.d) >= 0;

            const options = {
                chart: {
                    type: 'line',
                    backgroundColor: '#f2f2f2',

                    scrollablePlotArea: {
                        minWidth: 500
                    }
                },
                title: {
                    text: `${data.ticker} Hourly Price Variation`,
                    style: {
                        fontSize: '16px',
                        color: '#666666'
                    }
                },
                xAxis: {
                    type: 'datetime',
                    labels: {
                        formatter: function () {
                            const date = Highcharts.dateFormat('%H:%M', this.value);
                            if (date === '00:00') {
                                return Highcharts.dateFormat('%e %b', this.value);
                            } else {
                                return date;
                            }
                        }
                    }
                },
                yAxis: {
                    opposite: true,
                    title: {
                        text: null
                    }
                },
                legend: {
                    enabled: false
                },
                series: [{
                    name: 'Close Price',
                    marker: {
                        enabled: false
                    },
                    color: isPositive ? '#198754' : '#ff0000',
                    data: timestamps.map((timestamp, index) => [timestamp, closePrices[index]])
                }]
            };

            Highcharts.chart('chart-container', options);
            setChartInitialized(true);
        }
    }, [data, quoteData, chartInitialized]);

    return (
        <div id="chart-container">
            {(!data || !data.results || data.results.length === 0) && (
                <div className="box text-center text-danger">
                    Charts not available due to Rate Limiter, Please try again later
                </div>

            )}
        </div>
    );
};

export default StockChartHome;
