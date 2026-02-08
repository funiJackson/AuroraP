import React, { useRef, useState, useEffect } from 'react';

interface CameraPageProps {
  onBack: () => void;
}

const CameraPage: React.FC<CameraPageProps> = ({ onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [error, setError] = useState<string | null>(null);

  // Initialize Camera
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  const startCamera = async () => {
    stopCamera();
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      setError("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Save to state
        const dataUrl = canvas.toDataURL('image/png');
        setCapturedImage(dataUrl);
      }
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  const savePhoto = () => {
    if (capturedImage) {
      const link = document.createElement('a');
      link.href = capturedImage;
      link.download = `aurora-capture-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const sharePhoto = async () => {
    if (capturedImage) {
      try {
        const blob = await (await fetch(capturedImage)).blob();
        const file = new File([blob], "aurora-moment.png", { type: blob.type });

        if (navigator.share) {
          await navigator.share({
            title: 'Aurora Pulse Capture',
            text: 'Check out this beautiful moment I captured with Aurora Pulse!',
            files: [file],
          });
        } else {
          alert("Web sharing is not supported on this browser. Please use the Save button.");
        }
      } catch (err) {
        console.error("Error sharing:", err);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-black flex flex-col font-sans">
      {/* Hidden Canvas for processing */}
      <canvas ref={canvasRef} className="hidden"></canvas>

      {/* Top Header Area */}
      <div className="absolute top-0 left-0 right-0 z-50 pt-6 px-6 flex items-center justify-between">
        {/* Back Button - Transparent Circle */}
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all shadow-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Brand Header */}
        <div className="absolute left-1/2 -translate-x-1/2 text-white font-display font-bold text-xl tracking-wide drop-shadow-md">
           AuroraP.
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center rounded-b-3xl">
        {error ? (
          <div className="text-center p-6">
             <p className="text-red-400 mb-4">{error}</p>
             <button onClick={() => startCamera()} className="bg-white/10 px-4 py-2 rounded text-white">Retry</button>
          </div>
        ) : capturedImage ? (
          // Photo Preview
          <img src={capturedImage} alt="Captured" className="h-full w-full object-cover" />
        ) : (
          // Live Camera Feed
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="h-full w-full object-cover"
          />
        )}
      </div>

      {/* Controls Bar */}
      <div className="h-32 bg-black absolute bottom-0 left-0 right-0 pb-6 flex items-center justify-center z-50">
        
        {capturedImage ? (
          // Review Controls - Minimalist Transparent Style
          <div className="flex items-center justify-around w-full max-w-sm px-6">
            <button 
              onClick={retakePhoto}
              className="flex flex-col items-center gap-1 group opacity-80 hover:opacity-100 transition-opacity"
            >
              <div className="p-2 transition-transform group-active:scale-95">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <span className="text-[11px] font-medium text-white">Retake</span>
            </button>

            <button 
              onClick={savePhoto}
              className="flex flex-col items-center gap-1 group opacity-80 hover:opacity-100 transition-opacity"
            >
               <div className="p-2 transition-transform group-active:scale-95">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <span className="text-[11px] font-bold text-white">Save</span>
            </button>

            <button 
              onClick={sharePhoto}
              className="flex flex-col items-center gap-1 group opacity-80 hover:opacity-100 transition-opacity"
            >
              <div className="p-2 transition-transform group-active:scale-95">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </div>
              <span className="text-[11px] font-bold text-white">Share</span>
            </button>
          </div>
        ) : (
          // Capture Controls
          <div className="flex items-center justify-around w-full max-w-sm px-6">
             <button 
               onClick={toggleCamera} 
               className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
             >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
               </svg>
             </button>

             <button 
               onClick={takePhoto}
               className="w-20 h-20 rounded-full border-[5px] border-white flex items-center justify-center group active:scale-95 transition-transform"
             >
               <div className="w-16 h-16 rounded-full bg-white transition-all"></div>
             </button>

             {/* Spacer to balance layout */}
             <div className="w-12"></div> 
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraPage;