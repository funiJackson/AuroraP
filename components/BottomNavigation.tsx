import React from 'react';

interface BottomNavigationProps {
  currentView: 'dashboard' | 'map' | 'camera';
  setView: (view: 'dashboard' | 'map' | 'camera') => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ currentView, setView }) => {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-[320px] px-4">
      <div className="bg-[#1c1c1e]/90 backdrop-blur-xl border border-white/10 rounded-full p-2 flex justify-between items-center shadow-2xl">
        
        {/* Aurora / Dashboard Tab */}
        <button 
          onClick={() => setView('dashboard')}
          className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-full transition-all duration-300 ${
            currentView === 'dashboard' ? 'bg-[#2c2c2e]' : 'hover:bg-white/5'
          }`}
        >
          <div className={`transition-colors ${currentView === 'dashboard' ? 'text-aurora-green' : 'text-gray-400'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className={`text-[10px] font-medium ${currentView === 'dashboard' ? 'text-white' : 'text-gray-500'}`}>
            Aurora
          </span>
        </button>

        {/* Camera Tab */}
        <button 
          onClick={() => setView('camera')}
          className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-full transition-all duration-300 ${
            currentView === 'camera' ? 'bg-[#2c2c2e]' : 'hover:bg-white/5'
          }`}
        >
          <div className={`transition-colors ${currentView === 'camera' ? 'text-purple-400' : 'text-gray-400'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span className={`text-[10px] font-medium ${currentView === 'camera' ? 'text-white' : 'text-gray-500'}`}>
            Camera
          </span>
        </button>

        {/* Map Tab */}
        <button 
          onClick={() => setView('map')}
          className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-full transition-all duration-300 ${
            currentView === 'map' ? 'bg-[#2c2c2e]' : 'hover:bg-white/5'
          }`}
        >
           <div className={`transition-colors ${currentView === 'map' ? 'text-aurora-blue' : 'text-gray-400'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <span className={`text-[10px] font-medium ${currentView === 'map' ? 'text-white' : 'text-gray-500'}`}>
            Map
          </span>
        </button>

      </div>
    </div>
  );
};

export default BottomNavigation;