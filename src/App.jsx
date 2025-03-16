import { useState } from 'react'
import ChainsDirectoryPro from './ChainsDirectoryPro.jsx'
import INTDocsMaker from './INTDocsMaker.jsx'

function App() {
  const [currentApp, setCurrentApp] = useState('chains') // 'chains' lub 'int-docs'
  
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="bg-white shadow-md p-4 mb-6">
        <div className="max-w-7xl mx-auto flex space-x-8">
          <button 
            onClick={() => setCurrentApp('chains')}
            className={`px-4 py-2 rounded-md ${currentApp === 'chains' ? 'bg-blue-100 text-blue-700' : 'text-blue-600 hover:text-blue-800'}`}
          >
            ChainsDirectory PRO
          </button>
          <button 
            onClick={() => setCurrentApp('int-docs')}
            className={`px-4 py-2 rounded-md ${currentApp === 'int-docs' ? 'bg-blue-100 text-blue-700' : 'text-blue-600 hover:text-blue-800'}`}
          >
            INT docs maker
          </button>
        </div>
      </div>
      
      {currentApp === 'chains' ? <ChainsDirectoryPro /> : <INTDocsMaker />}
    </div>
  )
}

export default App