import React from 'react';
import { FaHome, FaBox, FaBoxOpen, FaTruckMoving, FaSearch } from 'react-icons/fa';
import { Link } from 'react-router-dom';

/**
 * @param {Object} props
 * @param {boolean} props.isOpen - Indique si la sidebar est ouverte.
 * @param {function} props.toggleSidebar - Fonction pour basculer l'état de la sidebar.
 */
function Sidebar({ isOpen, toggleSidebar }) {
  return (
    <div
      className={`fixed top-0 left-0 h-screen bg-gray-800 text-white shadow-lg p-6 transition-all duration-300 ${
        isOpen ? 'w-64' : 'w-16'
      }`}
    >
      {/* Header avec logo et bouton de collapse */}
      <div className="flex items-center mb-8">
        <img
          src="/vite.svg" // Remplacez par votre propre logo
          alt="Logo"
          className={`h-8 w-auto ${isOpen ? '' : 'mx-auto'}`}
        />
        {isOpen && <span className="text-xl font-semibold ml-2">Gestion Stock</span>}
        <button onClick={toggleSidebar} className="ml-auto focus:outline-none">
          {isOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </button>
      </div>
{/********************************************************************************* */}
      {/* Navigation principale */}
      <nav>
        <ul>
          {/* Accueil */}
          <li className="mb-4">
            <Link
              to="/"
              className="flex items-center text-gray-400 hover:text-white rounded-lg transition-colors"
            >
              <FaSearch className={`${isOpen ? 'mr-2 text-xl' : 'mx-auto text-4xl'}`} />
              {isOpen && "Recherche"}
            </Link>
          </li>
          {/* Entree */}
          <li className="mb-4">
            <Link
              to="/entree-stock"
              className="flex items-center text-gray-400 hover:text-white rounded-lg transition-colors"
            >
              <FaBoxOpen className={`${isOpen ? 'mr-2 text-xl' : 'mx-auto text-4xl'}`} />
              {isOpen && "Ajouter"}
            </Link>
          </li>
          {/* Transfert */}
          <li className="mb-4">
            <Link
              to="transfer-stock"
              className="flex items-center text-gray-400 hover:text-white rounded-lg transition-colors"
            >
              <FaBox className={`${isOpen ? 'mr-2 text-xl' : 'mx-auto text-4xl'}`} />
              {isOpen && "Transfére"}
            </Link>
          </li>
          {/* Transfert */}
          <li className="mb-4">
            <Link
              to="transfer-palette"
              className="flex items-center text-gray-400 hover:text-white rounded-lg transition-colors"
            >
              <FaBox className={`${isOpen ? 'mr-2 text-xl' : 'mx-auto text-4xl'}`} />
              {isOpen && "Transfére de palette"}
            </Link>
          </li>
          {/* Sortie */}
           <li className="mb-4">
            <Link
              to="sortie-stock"
              className="flex items-center text-gray-400 hover:text-white rounded-lg transition-colors"
            >
              <FaTruckMoving className={`${isOpen ? 'mr-2 text-xl' : 'mx-auto text-4xl'}`} />
              {isOpen && "Sorties"}
            </Link>
          </li>
        </ul>
      </nav>
{/********************************************************************************* */}
      {/* Pied de page avec lien "Aide" */}
      <div className="absolute bottom-16 left-0 w-full p-6">
        <Link
          to="http://10.10.0.20:5000/api-docs"
          className="flex items-center w-full p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`${isOpen ? 'mr-2 text-xl' : 'mx-auto text-4xl'} h-6 w-6`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3c-.002-1.087-.938-2.036-2.24-2.24-.866-.865-1.999-1.237-3.222-1.237-1.224 0-2.369.378-3.222 1.237C2.939 13.037 2.002 13.913 2 15m0 3c0 .442.358.8 1 .8s1-.358 1-.8 0-.8-1-.8-1 .358-1 .8zm4-13c-.002-1.44.517-2.706 1.465-3.668.549-.548 1.297-.87 2.143-.87h.048c.846 0 1.594.322 2.143.87C16.483 2.707 16.999 3.56 17.465 5M12 15c2.206 0 4-1.794 4-4 0-2.205-1.794-4-4-4-2.207 0-4 1.795-4 4 0 2.205 1.793 4 4 4z"
            />
          </svg>
          {isOpen && "Aide"}
        </Link>
      </div>

      {/* Footer avec copyright */}
      {isOpen && (
        <div className="absolute bottom-0 left-0 w-full p-6 text-center text-sm text-gray-400 border-t border-gray-700">
        <a href='http://10.10.0.20:5000'>  &copy; {new Date().getFullYear()} Electric Pro. Tous droits réservés.</a>
        </div>
      )}
    </div>
  );
}

export default Sidebar;