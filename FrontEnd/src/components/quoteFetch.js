import React from 'react';

function QuoteFetcher({ quoteData }) {
    if (!quoteData) return;
    const isPositive = parseFloat(quoteData.d) >= 0;
    const textColorClass = isPositive ? 'text-success' : 'text-danger';

    return (
        <div className="d-flex my-auto justify-content-center align-items-start flex-column">
            < h2 className={`${textColorClass}`} > {quoteData.c}</h2 >
            <h5 className={`${textColorClass}`}>
                {isPositive ? <i className="bi bi-caret-up-fill"></i> : <i className="bi bi-caret-down-fill"></i>}
                {quoteData.d} ({quoteData.dp.toFixed(2)}%)</h5>
        </div >
    );
}

export default QuoteFetcher;
