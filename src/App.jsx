import { useState, useEffect } from 'react'
import ChainsDirectoryPro from './ChainsDirectoryPro.jsx'
import INTDocsMaker from './INTDocsMaker.jsx'
import LoginForm from './components/LoginForm.jsx'
import AppHeader from './AppHeader.jsx'
import { LogOut } from 'lucide-react'

function App() {
  const [currentApp, setCurrentApp] = useState('chains') // 'chains', 'int-docs'
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  
  // Sprawdzenie stanu logowania przy starcie aplikacji
  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);
  
  // Funkcja obsługująca logowanie
  const handleLogin = (status) => {
    setIsAuthenticated(status);
    if (status) {
      localStorage.setItem('isAuthenticated', 'true');
    }
    // Po zalogowaniu, wróć do ChainsDirectory
    if (status) {
      setCurrentApp('chains');
    }
  };
  
  // Funkcja obsługująca wylogowanie
  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
    // Powrót do aplikacji ChainsDirectory po wylogowaniu
    setCurrentApp('chains');
  };

  // Renderowanie głównej zawartości aplikacji
  const renderMainContent = () => {
    if (currentApp === 'chains') {
      return <ChainsDirectoryPro />;
    } else if (currentApp === 'int-docs' && isAuthenticated) {
      return <INTDocsMaker />;
    } else {
      return <LoginForm onLogin={handleLogin} />;
    }
  };
  
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Nowy header w stylu CMB Web */}
      <AppHeader 
        currentApp={currentApp} 
        onNavigate={setCurrentApp}
        isAuthenticated={isAuthenticated}
      />
      
      {/* Tylko wyświetlaj pasek narzędzi jeśli jesteśmy w jakimś module */}
      {(currentApp === 'chains' || currentApp === 'int-docs') && (
        <div className="bg-white shadow-md p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-lg font-semibold text-gray-700">
                {currentApp === 'chains' ? 'ChainsDirectory PRO' : 'INT docs maker'}
              </h1>
            </div>
            
            {/* Przycisk wylogowania */}
            {isAuthenticated && (
              <button 
                onClick={handleLogout}
                className="px-4 py-2 rounded-md text-red-600 hover:text-red-800 flex items-center"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Wyloguj
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Główna zawartość aplikacji */}
      <div className="flex-1">
        {renderMainContent()}
      </div>
    </div>
  )
}

export default App