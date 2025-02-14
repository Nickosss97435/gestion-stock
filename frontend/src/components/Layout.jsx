import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';

const Layout = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    };

    handleResize(); // Appel initial pour définir l'état de la sidebar
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="flex">
      {/* Sidebar avec état dynamique */}
      <Sidebar isOpen={isOpen} toggleSidebar={toggleSidebar} />

      {/* Contenu principal */}
      <div className={`${isOpen ? 'ml-64' : 'ml-16'} p-4 w-full transition-all duration-300`}>
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;