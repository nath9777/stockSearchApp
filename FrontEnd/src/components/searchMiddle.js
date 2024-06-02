import React, { useContext } from 'react';
import { Contexts } from '../contexts/SearchContext';

function formatDate(timestamp) {
    const date = new Date(timestamp * 1000);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}


function SearchMiddleResult({ searchData, quoteData }) {

    const calculateMarketStatus = () => {
        if (!quoteData || !quoteData.t) return null;

        const lastTimestamp = quoteData.t;

        const currentTime = Math.floor(Date.now() / 1000);
        const elapsedTime = currentTime - lastTimestamp;

        if (elapsedTime > 300) {
            const formattedDate = formatDate(lastTimestamp);
            return {
                message: `Market Closed On ${formattedDate}`,
                color: 'text-danger'
            };
        } else {
            return {
                message: 'Market is Open',
                color: 'text-success'
            };
        }
    };

    const marketStatus = calculateMarketStatus();

    return (
        <div className="mb-2 d-lg-flex justify-content-center align-items-center flex-column">
            <img className="img-fluid" src={searchData.logo} alt="Logo" style={{ width: '90px', height: 'auto' }} />
            <p className={`mt-5 small  ${marketStatus.color}`}><b>{marketStatus.message}</b></p>
        </div >
    );
}

export default SearchMiddleResult;
