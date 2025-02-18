import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import Login from './pages/Login';
import Layout from './components/Layout';
import Home from './pages/Home';
import ArticlesTransfer from './pages/ArticlesTransfert';
import Out from './pages/Out';
import Add from './pages/Add';
import PaletteTransfer from './pages/PaletteTransfert';


function App() {
  return (
    <Router>
      <Routes>
        {/* <Route path="/" element={<Login />} /> */}
        <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/entree-stock" element={<Add />} />
        <Route path="/transfer-stock" element={<ArticlesTransfer />} />
        <Route path="/transfer-palette" element={<PaletteTransfer />} />
        <Route path="/sortie-stock" element={<Out />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;