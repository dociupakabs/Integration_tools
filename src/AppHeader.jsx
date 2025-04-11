import React, { useState, useRef } from 'react';
import { Menu, HelpCircle, User, ChevronDown } from 'lucide-react';
import './AppHeader.css';

const AppHeader = ({ currentApp, onNavigate, isAuthenticated }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuContainerRef = useRef(null);
  
  // Funkcja dodająca opóźnienie przed zamknięciem menu
  const handleMouseLeave = () => {
    // Ustawiamy timeout, aby menu nie znikało natychmiast
    setTimeout(() => {
      // Sprawdzamy, czy kursor nie wrócił do kontenera menu
      if (!menuContainerRef.current.matches(':hover')) {
        setShowMenu(false);
      }
    }, 300); // Opóźnienie 300ms przed zamknięciem menu
  };

  return (
    <header className="bg-gray-900 text-white py-2 px-4 flex items-center justify-between">
      <div className="flex items-center space-x-6">
        <button className="p-1">
          <Menu className="w-5 h-5" />
        </button>
        <div className="font-semibold">CMB Web</div>
        <div className="h-6 border-l border-gray-600 mx-2"></div>
        <nav className="flex space-x-4">
          <div className="flex items-center px-2 py-1 text-white/80">
            <span>EDI</span>
          </div>
          <div className="flex items-center px-2 py-1 text-white/80">
            <span>EDI Zarządzanie</span>
          </div>
          
          {/* Menu INTEGRACJA z rozwijaną listą */}
          <div 
            ref={menuContainerRef}
            className="relative"
            onMouseEnter={() => setShowMenu(true)}
            onMouseLeave={handleMouseLeave}
          >
            <button 
              className={`flex items-center px-2 py-1 rounded hover:bg-gray-800 ${
                ['chains', 'int-docs'].includes(currentApp) ? 'bg-gray-800' : ''
              }`}
            >
              <span>INTEGRACJA</span>
            </button>
            
            {/* Rozwijane menu */}
            {showMenu && (
              <div 
                className="absolute left-0 top-full mt-1 bg-white text-gray-800 shadow-md rounded-md p-2 w-48 z-50 dropdown-menu"
              >
                <button 
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 menu-item"
                  onClick={() => {
                    onNavigate('chains');
                    setShowMenu(false);
                  }}
                >
                  ChainsDirectory PRO
                </button>
                <button 
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 menu-item"
                  onClick={() => {
                    if (isAuthenticated) {
                      onNavigate('int-docs');
                    } else {
                      onNavigate('login');
                    }
                    setShowMenu(false);
                  }}
                >
                  INT docs maker
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>
      <div className="flex items-center space-x-4">
        <button className="p-1">
          <HelpCircle className="w-5 h-5" />
        </button>
        <button className="p-1">
          <User className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

export default AppHeader;