// App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import HomePage from './components/HomePage';
import WatchList from './components/WatchList';
import Portfolio from './components/Portfolio';
import { Contexts } from './contexts/SearchContext';

function App() {
  const [contextLoad, setContextLoad] = useState({});

  return (
    <Router>
      <Contexts.Provider value={{ contextLoad: contextLoad, setContextLoad: setContextLoad }}>
        <div className="app-container d-flex flex-column min-vh-100">
          <Navigation />
          <div className="flex-grow-1">
            <Routes>
              <Route path="/" element={<Navigate to="/search/home" />} />
              <Route path="/search/home" element={<HomePage />} />
              <Route path="/search/:ticker" element={<HomePage />} />
              <Route path="/search/Watchlist" element={<WatchList />} />
              <Route path="/search/Portfolio" element={<Portfolio />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </Contexts.Provider>
    </Router>
  );
}

export default App;

