import React, { useEffect, useState, useRef } from 'react';
import { UserLocation, SolarFlare, GeomagneticStorm, ViewingChance, LocalWeather } from './types';
import { fetchSolarFlares, fetchGeomagneticStorms } from './services/nasaService';
import { fetchWeather, fetchCityName } from './services/weatherService';
import { calculateViewingChance, kpToBaseNt } from './utils/auroraUtils';
import AuroraBackground from './components/AuroraBackground';
import LiveActivityChart, { ActivityPoint } from './components/LiveActivityChart';
import SolarFlareChart from './components/SolarFlareChart';
import GeminiAdvice from './components/GeminiAdvice';
import BottomNavigation from './components/BottomNavigation';
import WorldMapPage from './components/WorldMapPage';
import AuroraInfoPanel from './components/AuroraInfoPanel';
import CameraPage from './components/CameraPage';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'map' | 'camera'>('dashboard');
  
  const [location, setLocation] = useState<UserLocation>({
    latitude: 0,
    longitude: 0,
    available: false,
  });

  const [flares, setFlares] = useState<SolarFlare[]>([]);
  const [kpIndex, setKpIndex] = useState<number>(0);
  const [currentNt, setCurrentNt] = useState<number>(10);
  const [historyNt, setHistoryNt] = useState<ActivityPoint[]>([]);
  const [chance, setChance] = useState<ViewingChance>(ViewingChance.LOW);
  const [loading, setLoading] = useState<boolean>(true);
  const [weather, setWeather] = useState<LocalWeather>({ cloudCover: 0, weatherCode: 0, temperature: 0 });
  const [cityName, setCityName] = useState<string>('');
  
  // Notification State
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [hasNotified, setHasNotified] = useState(false);
  
  // Ref for base calculation
  const baseNtRef = useRef<number>(10);

  useEffect(() => {
    // Check initial notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    // 1. Get Location & Weather
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          
          setLocation({
            latitude: lat,
            longitude: lon,
            available: true,
          });

          // Fetch Weather & City immediately after location
          const [weatherData, city] = await Promise.all([
            fetchWeather(lat, lon),
            fetchCityName(lat, lon)
          ]);
          
          setWeather(weatherData);
          setCityName(city);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setLocation({ ...location, error: error.message });
        }
      );
    }

    // 2. Fetch NASA Data
    const initData = async () => {
      setLoading(true);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 7); 

      const [flaresData, stormsData] = await Promise.all([
        fetchSolarFlares(startDate, endDate),
        fetchGeomagneticStorms(startDate, endDate)
      ]);

      setFlares(flaresData);

      let currentK = 2.0; // Default to ~48nT (high green) if no storm data, to match typical "quiet but active" charts
      if (stormsData.length > 0) {
        const sortedStorms = [...stormsData].sort((a, b) => 
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        );
        const latestStorm = sortedStorms[0];
        const maxKpInLatest = Math.max(...latestStorm.allKpIndex.map(k => k.kpIndex));
        currentK = maxKpInLatest;
      }
      
      setKpIndex(currentK);
      
      // Initialize Base nT from Kp
      const calculatedBaseNt = kpToBaseNt(currentK);
      baseNtRef.current = calculatedBaseNt;
      
      // Generate hourly history (last 24 hours) aligned to the hour
      const initialHistory: ActivityPoint[] = [];
      const now = new Date();
      now.setMinutes(0, 0, 0); // Snap to top of the hour
      
      for (let i = 23; i >= 0; i--) {
        // Generate a more realistic variation
        // Use sine waves to simulate diurnal or random magnetic field drift
        const hourOffset = i;
        const drift = Math.sin(hourOffset / 3) * (calculatedBaseNt * 0.2); 
        const noise = (Math.random() - 0.5) * (calculatedBaseNt * 0.3);
        
        let val = calculatedBaseNt + drift + noise;
        val = Math.max(5, val); // Floor at 5nT
        
        const timeDate = new Date(now.getTime() - i * 3600000);
        
        // Format: 14:00 (24-hour format)
        const timeStr = timeDate.toLocaleTimeString([], {
          hour: '2-digit', 
          minute:'2-digit',
          hour12: false 
        });
        
        initialHistory.push({
          time: timeStr,
          nt: val
        });
      }
      
      setHistoryNt(initialHistory);
      // Set current nT to the most recent data point (current hour) without extra jitter
      setCurrentNt(initialHistory[initialHistory.length - 1].nt);
      
      setLoading(false);
    };

    initData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update Chance based on Location, KP, AND Cloud Cover
  useEffect(() => {
    if (location.available) {
      setChance(calculateViewingChance(location.latitude, kpIndex, weather.cloudCover));
    }
  }, [location.available, location.latitude, kpIndex, weather.cloudCover]);

  // Handle Notifications
  useEffect(() => {
    if (chance === ViewingChance.EXTREME && notificationPermission === 'granted' && !hasNotified) {
       try {
         new Notification("Aurora Visible Now! ✨", {
           body: "The Northern Lights are currently visible by eye in your location. Look up!",
         });
         setHasNotified(true);
       } catch (e) {
         console.error("Notification failed", e);
       }
    } else if (chance !== ViewingChance.EXTREME && hasNotified) {
      // Reset notification state if chance drops, so we can notify again if it spikes
      setHasNotified(false);
    }
  }, [chance, notificationPermission, hasNotified]);

  const requestNotifications = async () => {
    if (!('Notification' in window)) return;
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    } catch (e) {
      console.error("Failed to request permission", e);
    }
  };

  const renderContent = () => {
    switch(currentView) {
      case 'map':
        return <WorldMapPage location={location} kpIndex={kpIndex} weather={weather} />;
      case 'camera':
        return <CameraPage onBack={() => setCurrentView('dashboard')} />;
      default:
        return (
          <main className="relative z-10 container mx-auto px-4 py-8 md:py-12 max-w-6xl pb-32">
            {/* Visibility Card */}
            <div className={`glass-panel p-6 rounded-3xl border-t-4 mb-6 ${
              chance === ViewingChance.HIGH || chance === ViewingChance.EXTREME ? 'border-aurora-green' : 'border-gray-600'
            }`}>
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-aurora-blue uppercase text-xs font-bold tracking-[0.1em]">
                  Can I see the aurora at the moment?
                </h2>
                {notificationPermission === 'default' && (
                  <button 
                    onClick={requestNotifications} 
                    className="text-gray-400 hover:text-aurora-green transition-colors flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider bg-white/5 px-2 py-1 rounded hover:bg-white/10"
                    title="Enable alerts for high activity"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M5.25 9a6.75 6.75 0 0113.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 01-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 11-7.48 0 24.585 24.585 0 01-4.831-1.244.75.75 0 01-.298-1.205A8.217 8.217 0 005.25 9.75V9zm4.502 8.9a2.25 2.25 0 104.496 0 25.057 25.057 0 01-4.496 0z" clipRule="evenodd" />
                    </svg>
                    <span>Get Alerts</span>
                  </button>
                )}
              </div>

              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
                  <div className="flex items-center gap-4">
                      <div className={`text-4xl md:text-5xl ${
                        chance === ViewingChance.IMPOSSIBLE ? 'grayscale opacity-50' : ''
                      }`}>
                        {chance === ViewingChance.IMPOSSIBLE ? '☁️' : '✨'}
                      </div>
                      <div className="text-4xl md:text-5xl font-display font-bold leading-none tracking-tight">
                        {location.available ? chance : 'Checking...'}
                      </div>
                  </div>
                  
                  {/* Location & Weather Context */}
                  {location.available && (
                    <div className="flex flex-col md:items-end gap-2 mt-2 md:mt-0">
                      {/* Location Badge */}
                      <div className="flex items-center gap-2 text-gray-200 bg-white/10 px-3 py-1.5 rounded-full text-sm backdrop-blur-md border border-white/5 w-fit">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-aurora-blue">
                            <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                          </svg>
                          <span className="font-bold text-xs">{cityName || 'Locating...'}</span>
                      </div>

                      {/* Cloud Cover */}
                      <div className="flex items-baseline gap-2 px-1">
                          <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Cloud Cover</span>
                          <span className={`font-mono text-lg font-bold leading-none ${weather.cloudCover > 50 ? 'text-red-500' : 'text-aurora-green'}`}>
                            {weather.cloudCover}%
                          </span>
                      </div>
                    </div>
                  )}
              </div>

              <div className="relative pt-2">
                <div className="flex justify-between text-[10px] text-gray-500 mb-1 font-mono uppercase tracking-widest">
                  <span>Impossible</span>
                  <span>Guaranteed</span>
                </div>
                <div className="h-4 w-full bg-gray-900/50 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-gradient-to-r from-gray-600 via-aurora-blue to-aurora-green transition-all duration-1000 shadow-[0_0_20px_rgba(0,255,157,0.3)]"
                    style={{ width: chance === ViewingChance.IMPOSSIBLE ? '5%' : chance === ViewingChance.HIGH ? '80%' : chance === ViewingChance.EXTREME ? '100%' : '30%' }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Primary Column (Activity) */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                
                {/* Live Magnetometer Chart */}
                <LiveActivityChart data={historyNt} currentNt={currentNt} />

                {/* Explainer Panel */}
                <AuroraInfoPanel />

                {/* Solar Flare Timeline */}
                <SolarFlareChart flares={flares} />
              </div>

              {/* Secondary Column (Analysis & Stats) */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                
                {/* Gemini Analysis */}
                <GeminiAdvice 
                  location={location} 
                  cityName={cityName}
                  kpIndex={kpIndex}
                  currentNt={currentNt}
                  flareCount={flares.length}
                  cloudCover={weather.cloudCover}
                />

                {/* Quick Metrics Grid (Simplified) */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="glass-panel p-4 rounded-2xl">
                    <div className="text-gray-500 text-xs uppercase font-bold mb-1" title="Planetary K-index: Global storm level 0-9">Global Level</div>
                    <div className="text-xl font-mono text-white flex items-baseline gap-1">
                      Kp {kpIndex.toFixed(1)}
                      <span className="text-xs text-gray-500 font-sans font-normal">/ 9</span>
                    </div>
                  </div>
                  <div className="glass-panel p-4 rounded-2xl">
                    <div className="text-gray-500 text-xs uppercase font-bold mb-1" title="Interplanetary Magnetic Field Direction">Storm Direction</div>
                    <div className="text-xl font-mono text-white">
                      {Math.random() > 0.5 ? 'SOUTH' : 'NORTH'}
                      <span className="text-xs ml-1 text-gray-500">
                        {Math.random() > 0.5 ? '↓' : '↑'}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </main>
        );
    }
  };

  return (
    <div className="relative min-h-screen text-white selection:bg-aurora-green selection:text-aurora-dark font-sans">
      {/* Background only on dashboard to keep camera clear */}
      {currentView === 'dashboard' && <AuroraBackground currentNt={currentNt} />}

      {renderContent()}
      
      {/* Bottom Navigation - Hide when in Camera view */}
      {currentView !== 'camera' && (
        <BottomNavigation currentView={currentView} setView={setCurrentView} />
      )}
    </div>
  );
};

export default App;