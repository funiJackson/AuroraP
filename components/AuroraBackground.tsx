import React from 'react';

interface AuroraBackgroundProps {
  currentNt?: number;
}

const AuroraBackground: React.FC<AuroraBackgroundProps> = ({ currentNt = 0 }) => {
  // Threshold for "Storm" level where background changes
  const isStorm = currentNt > 200;

  // Van Gogh Starry Night (Default)
  const calmBg = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/1280px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg';
  
  // Red Aurora (Storm Mode) - Vibrant Red/Vertical structure
  const stormBg = 'https://images.unsplash.com/photo-1531306728370-e2ebd9d7bb99?q=80&w=2574&auto=format&fit=crop';

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#050a14] transition-colors duration-1000">
      {/* Background Image Layer - Dynamic */}
      <div 
        className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 ease-in-out`}
        style={{
          backgroundImage: `url('${isStorm ? stormBg : calmBg}')`,
          // Increased opacity significantly for storm mode (was 0.5) to make it more visible
          opacity: isStorm ? 0.75 : 0.6, 
          mixBlendMode: 'screen',
          // Boosted saturation (130->180), contrast (120->140) and added brightness for vibrancy
          filter: isStorm 
            ? 'saturate(180%) contrast(140%) brightness(120%) hue-rotate(-10deg)' 
            : 'saturate(150%) contrast(125%)'
        }}
      ></div>

      {/* Dark overlay to ensure text readability - slightly lighter during storm to show more color */}
      <div className={`absolute inset-0 bg-gradient-to-b ${isStorm ? 'from-[#050a14]/60 via-[#050a14]/40 to-[#050a14]/60' : 'from-[#050a14]/70 via-[#050a14]/50 to-[#050a14]/70'} mix-blend-multiply transition-all duration-1000`}></div>

      {/* Aurora Effects overlaying the painting - Colors shift to Red/Orange during storm */}
      {/* Increased opacity of gradients (from /30 to /50) and used brighter shades (500 vs 600) */}
      <div 
        className={`absolute -top-[50%] -left-[20%] w-[150%] h-[150%] bg-gradient-to-b from-transparent ${isStorm ? 'via-red-500/50' : 'via-aurora-green/10'} to-transparent blur-[80px] animate-aurora-flow rounded-full mix-blend-color-dodge transition-colors duration-1000`}
      ></div>
      
      <div 
        className={`absolute top-[20%] -right-[20%] w-[80%] h-[80%] bg-gradient-to-l from-transparent ${isStorm ? 'via-orange-500/50' : 'via-aurora-purple/20'} to-transparent blur-[100px] animate-pulse-slow rounded-full mix-blend-color-dodge transition-colors duration-1000`}
      ></div>
      
      <div 
        className={`absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t ${isStorm ? 'from-red-600/50' : 'from-aurora-blue/10'} to-transparent blur-3xl mix-blend-screen transition-colors duration-1000`}
      ></div>
      
      {/* Subtle grain for texture */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay"></div>
    </div>
  );
};

export default AuroraBackground;