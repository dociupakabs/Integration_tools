import { useState, useEffect } from 'react'
import ChainsDirectoryPro from './ChainsDirectoryPro.jsx'
import INTDocsMaker from './INTDocsMaker.jsx'
import LoginForm from './components/LoginForm.jsx'
import { Lock, LogOut } from 'lucide-react'

function App() {
  const [currentApp, setCurrentApp] = useState('chains') // 'chains' lub 'int-docs'
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
  };
  
  // Funkcja obsługująca wylogowanie
  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
    // Powrót do aplikacji ChainsDirectory po wylogowaniu
    setCurrentApp('chains');
  };
  
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="bg-white shadow-md p-4 mb-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex space-x-8">
            {/* ChainsDirectory zawsze dostępny */}
            <button 
              onClick={() => setCurrentApp('chains')}
              className={`px-4 py-2 rounded-md ${currentApp === 'chains' ? 'bg-blue-100 text-blue-700' : 'text-blue-600 hover:text-blue-800'}`}
            >
              ChainsDirectory PRO
            </button>
            
            {/* Inne aplikacje dostępne tylko po zalogowaniu */}
            {isAuthenticated ? (
              <button 
                onClick={() => setCurrentApp('int-docs')}
                className={`px-4 py-2 rounded-md ${currentApp === 'int-docs' ? 'bg-blue-100 text-blue-700' : 'text-blue-600 hover:text-blue-800'}`}
              >
                INT docs maker
              </button>
            ) : (
              <button 
                onClick={() => setCurrentApp('login')}
                className={`px-4 py-2 rounded-md flex items-center ${currentApp === 'login' ? 'bg-blue-100 text-blue-700' : 'text-blue-600 hover:text-blue-800'}`}
              >
                <Lock className="w-4 h-4 mr-1" />
                Narzędzia zaawansowane
              </button>
            )}
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
      
      {/* Wyświetlanie odpowiedniej aplikacji lub formularza logowania */}
      {currentApp === 'chains' ? (
        <ChainsDirectoryPro />
      ) : currentApp === 'int-docs' && isAuthenticated ? (
        <INTDocsMaker />
      ) : (
        <LoginForm onLogin={handleLogin} />
      )}
    </div>
  )
}

export default App