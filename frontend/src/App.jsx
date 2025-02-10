import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import Login from './pages/Login';
import Layout from './components/Layout';
import Home from './pages/Home';
import Transfer from './pages/Transfer';
import Sortie from './pages/Sortie';
import Enter from './pages/Enter';


function App() {
  return (
    <Router>
      <Routes>
        {/* <Route path="/" element={<Login />} /> */}
        <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/entree" element={<Enter />} />
        <Route path="/transfer" element={<Transfer />} />
        <Route path="/sortie" element={<Sortie />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;