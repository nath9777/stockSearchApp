import React, { useState, useContext, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Contexts } from '../contexts/SearchContext';

function Navigation() {
    const location = useLocation();
    const { contextLoad, setContextLoad } = useContext(Contexts);
    let mainroute = contextLoad?.searchData ? `/search/${contextLoad.searchData.ticker}` : '/search/home';

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchActive, setIsSearchActive] = useState(mainroute);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const handleTabClick = () => {
        setIsSearchActive(false);
    };


    const isActive = (path) => {
        if (path === '/search/home') {
            return location.pathname.startsWith('/search') || location.pathname === '/' ? 'active' : '';
        }
        if (path === '/' || location.pathname === '/') {
            return 'active';
        }
        return location.pathname === path ? 'active' : '';
    };


    const handleSearchClick = () => {
        setIsSearchActive(true);
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-dark sticky-top" style={{ backgroundColor: '#1d279d' }}>
            <div className="container-fluid">
                <span className="navbar-brand">Stock Search</span>
                <button className="navbar-toggler" type="button" onClick={toggleMenu} style={{ margin: '0.25rem' }}>
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className={`collapse navbar-collapse ${isMenuOpen ? 'show' : ''}`}>
                    <ul className="navbar-nav ms-auto" style={{ padding: '0.5rem' }}>
                        <li className={`nav-item ${isSearchActive ? 'active' : ''}`} style={{ margin: '0.5rem' }}>
                            <Link to={mainroute} className="nav-link" onClick={handleSearchClick}>Search</Link>
                        </li>
                        <li className={`nav-item ${isActive('/search/Watchlist')}`} style={{ margin: '0.5rem' }}>
                            <Link to="/search/Watchlist" className="nav-link" onClick={() => { handleTabClick(); }}>Watchlist</Link>
                        </li>
                        <li className={`nav-item ${isActive('/search/Portfolio')}`} style={{ margin: '0.5rem' }}>
                            <Link to="/search/Portfolio" className="nav-link" onClick={() => { handleTabClick(); }}>Portfolio</Link>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    );
}

export default Navigation;

