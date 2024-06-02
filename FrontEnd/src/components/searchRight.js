import React, { useState, useEffect } from 'react';

function formatDate() {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function SearchRightResult({ quoteData }) {
    const [formattedDate, setFormattedDate] = useState(formatDate);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setFormattedDate(formatDate());
        }, 15000);

        return () => clearInterval(intervalId);
    }, []);
    const isPositive = parseFloat(quoteData.d) >= 0;
    const textColorClass = isPositive ? 'text-success' : 'text-danger';

    return (
        <div className="mb-5 d-flex justify-content-center align-items-center flex-column">
            < h2 className={`${textColorClass}`} > {quoteData.c.toFixed(2)}</h2 >
            <h5 className={`${textColorClass}`}>
                {isPositive ? <i className="bi bi-caret-up-fill"></i> : <i className="bi bi-caret-down-fill"></i>}
                {quoteData.d.toFixed(2)} ({quoteData.dp.toFixed(2)}%)</h5>
            <h6 className="small mt-1">{formattedDate}</h6>
        </div >
    );
}

export default SearchRightResult;
