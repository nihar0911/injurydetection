import React, { useRef, useState, useEffect } from 'react';
import { Camera, Info, CheckCircle2, AlertTriangle, Scan, Play, Monitor, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Pose, POSE_CONNECTIONS } from '@mediapipe/pose';
import { Camera as MediaPipeCamera } from '@mediapipe/camera_utils';
import { processImageFeatures, CVFeatures, drawHeatmapOverlay, generateAIModelImage } from '../lib/cvProcessor';

export interface ScanData {
  images: string[];
  aiModelImage?: string;
  features: CVFeatures;
  minJointAngle: number | null;
}

interface VisualScanProps {
  onComplete: (data: ScanData) => void;
  selectedPart?: string;
}

const VisualScan: React.FC<VisualScanProps> = ({ onComplete, selectedPart }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isAnalyzingOverlay, setIsAnalyzingOverlay] = useState(false);
  
  // Gemini Verification State
  const [isVerifyingAnatomy, setIsVerifyingAnatomy] = useState(false);
  const [anatomyError, setAnatomyError] = useState<string | null>(null);

  // Real CV Data
  const [accumulatedFeatures, setAccumulatedFeatures] = useState<CVFeatures>({ rednessPercentage: 0, bruisePercentage: 0, swellingPercentage: 0 });
  const [minJointAngle, setMinJointAngle] = useState<number | null>(null);

  const poseRef = useRef<Pose | null>(null);
  const mpCameraRef = useRef<MediaPipeCamera | null>(null);

  const steps = [
    { label: 'Front View', instructions: 'Align the injury in the center. MediaPipe tracking initialized.' },
    { label: 'Side View', instructions: 'Capture from the side for depth.' },
    { label: 'Zoomed View', instructions: 'Get closer for OpenCV redness/bruise extraction.' },
    { label: 'Motion Check', instructions: 'Bend the joint slowly. Calculating Range of Motion.' }
  ];

  // Helper to calculate angle between 3 points (e.g., Hip, Knee, Ankle)
  const calculateAngle = (a: any, b: any, c: any) => {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    if (angle > 180.0) angle = 360 - angle;
    return angle;
  };

  const initMediaPipe = () => {
    if (!videoRef.current || !overlayCanvasRef.current) return;

    const pose = new Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    pose.onResults((results) => {
      const canvasCtx = overlayCanvasRef.current?.getContext('2d');
      if (!canvasCtx || !overlayCanvasRef.current || !videoRef.current) return;

      overlayCanvasRef.current.width = videoRef.current.videoWidth;
      overlayCanvasRef.current.height = videoRef.current.videoHeight;

      canvasCtx.save();
      canvasCtx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);

      if (results.poseLandmarks) {
        // Draw Skeleton
        canvasCtx.globalCompositeOperation = 'source-over';
        // Simplified drawing since we don't have drawConnectors util
        for (const landmark of results.poseLandmarks) {
          canvasCtx.beginPath();
          canvasCtx.arc(landmark.x * overlayCanvasRef.current.width, landmark.y * overlayCanvasRef.current.height, 5, 0, 2 * Math.PI);
          canvasCtx.fillStyle = '#10B981'; // Emerald 500
          canvasCtx.fill();
        }

        // Calculate Knee Angle (Right leg for demo: 24-Hip, 26-Knee, 28-Ankle)
        const hip = results.poseLandmarks[24];
        const knee = results.poseLandmarks[26];
        const ankle = results.poseLandmarks[28];

        if (hip && knee && ankle && hip.visibility! > 0.5 && knee.visibility! > 0.5 && ankle.visibility! > 0.5) {
          const angle = calculateAngle(hip, knee, ankle);
          // Only track if we are on the motion step
          if (currentStep === 3) {
            setMinJointAngle(prev => (prev === null ? angle : Math.min(prev, angle)));
          }
          
          canvasCtx.font = "30px Arial";
          canvasCtx.fillStyle = "white";
          canvasCtx.fillText(`Angle: ${Math.round(angle)}Â°`, (knee.x * overlayCanvasRef.current.width) + 20, knee.y * overlayCanvasRef.current.height);
        }
      }
      canvasCtx.restore();
    });

    poseRef.current = pose;

    const camera = new MediaPipeCamera(videoRef.current, {
      onFrame: async () => {
        await pose.send({ image: videoRef.current! });
      },
      width: 1280,
      height: 720
    });

    camera.start();
    mpCameraRef.current = camera;
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      setStream(mediaStream);
      setIsCameraActive(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  useEffect(() => {
    if (isCameraActive && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play().catch(e => console.error("Error playing video:", e));
        initMediaPipe();
      };
    }
    return () => {
      mpCameraRef.current?.stop();
      poseRef.current?.close();
    };
  }, [isCameraActive, stream]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraActive(false);
      mpCameraRef.current?.stop();
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current && !isValidating && !isAnalyzingOverlay) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context && video.readyState >= 2) {
        setIsValidating(true);
        setAnatomyError(null);

        setTimeout(() => {
          setIsValidating(false);
          setIsAnalyzingOverlay(true);

          setTimeout(() => {
            setIsAnalyzingOverlay(false);

            const MAX_WIDTH = 768;
            let width = video.videoWidth;
            let height = video.videoHeight;

            if (width === 0 || height === 0) return;
            if (width > MAX_WIDTH) {
              height = Math.round((MAX_WIDTH / width) * height);
              width = MAX_WIDTH;
            }

            canvas.width = width;
            canvas.height = height;
            context.drawImage(video, 0, 0, width, height);
            
            // --- REAL FEATURE EXTRACTION ---
            const imageData = context.getImageData(0, 0, width, height);
            const features = processImageFeatures(imageData);
            
            setAccumulatedFeatures(prev => ({
              rednessPercentage: Math.max(prev.rednessPercentage, features.rednessPercentage),
              bruisePercentage: Math.max(prev.bruisePercentage, features.bruisePercentage),
              swellingPercentage: Math.max(prev.swellingPercentage, features.swellingPercentage)
            }));

            // Draw heatmap overlay on top of the captured image
            drawHeatmapOverlay(context, width, height, features);

            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            const aiModelDataUrl = generateAIModelImage(canvas, width, height, features);
            
            // --- GEMINI ANATOMY VERIFICATION ---
            const verifyAndProceed = async () => {
              if (selectedPart) {
                setIsValidating(false);
                setIsVerifyingAnatomy(true);
                try {
                  const { verifyAnatomy } = await import('../lib/gemini');
                  const formattedPart = selectedPart.replace(/_/g, ' ');
                  const result = await verifyAnatomy(dataUrl, formattedPart);
                  
                  if (!result.match) {
                    setIsVerifyingAnatomy(false);
                    setAnatomyError(`Mismatch Detected: You selected '${formattedPart}', but the AI detected something else. Reason: ${result.reason}`);
                    return; // Halt process
                  }
                } catch (err: any) {
                  console.error(err);
                  setIsVerifyingAnatomy(false);
                  setAnatomyError(`Verification Service Error: ${err.message}. Check your API Key or Network.`);
                  return; // Halt process on error
                }
                setIsVerifyingAnatomy(false);
              }
              
              const newImages = [...capturedImages, dataUrl];
              setCapturedImages(newImages);
              
              if (currentStep < steps.length - 1) {
                setCurrentStep(currentStep + 1);
              } else {
                stopCamera();
                onComplete({
                  images: newImages,
                  aiModelImage: aiModelDataUrl,
                  features: {
                    rednessPercentage: Math.max(accumulatedFeatures.rednessPercentage, features.rednessPercentage),
                    bruisePercentage: Math.max(accumulatedFeatures.bruisePercentage, features.bruisePercentage),
                    swellingPercentage: Math.max(accumulatedFeatures.swellingPercentage, features.swellingPercentage)
                  },
                  minJointAngle
                });
              }
            };

            verifyAndProceed();
          }, 1500); 
        }, 1000); 
      }
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !canvasRef.current) return;

    setIsValidating(true);
    setAnatomyError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setIsValidating(false);
        setIsAnalyzingOverlay(true);

        setTimeout(() => {
          setIsAnalyzingOverlay(false);

          const canvas = canvasRef.current!;
          const context = canvas.getContext('2d');
          if (!context) return;

          const MAX_WIDTH = 768;
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height = Math.round((MAX_WIDTH / width) * height);
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;
          context.drawImage(img, 0, 0, width, height);
          
          // --- REAL FEATURE EXTRACTION ---
          const imageData = context.getImageData(0, 0, width, height);
          const features = processImageFeatures(imageData);

          // Draw heatmap overlay on top of the uploaded image
          drawHeatmapOverlay(context, width, height, features);

          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          const aiModelDataUrl = generateAIModelImage(canvas, width, height, features);

          // --- GEMINI ANATOMY VERIFICATION ---
          const verifyAndProceed = async () => {
            if (selectedPart) {
              setIsVerifyingAnatomy(true);
              try {
                const { verifyAnatomy } = await import('../lib/gemini');
                const formattedPart = selectedPart.replace(/_/g, ' ');
                const result = await verifyAnatomy(dataUrl, formattedPart);
                
                if (!result.match) {
                  setIsVerifyingAnatomy(false);
                  setAnatomyError(`Mismatch Detected: You selected '${formattedPart}', but the AI detected something else. Reason: ${result.reason}`);
                  return; // Halt process
                }
              } catch (err: any) {
                console.error(err);
                setIsVerifyingAnatomy(false);
                setAnatomyError(`Verification Service Error: ${err.message}. Check your API Key.`);
                return;
              }
              setIsVerifyingAnatomy(false);
            }

            // Immediately complete triage based on static image
            onComplete({
              images: [dataUrl],
              aiModelImage: aiModelDataUrl,
              features,
              minJointAngle: null // No motion in static images
            });
          };

          verifyAndProceed();
        }, 1500);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleScreenshotCapture = async () => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const videoElement = document.createElement('video');
      videoElement.srcObject = displayStream;
      videoElement.play();

      videoElement.onloadeddata = () => {
        setTimeout(() => {
          setIsValidating(true);
          setAnatomyError(null);
          
          if (!canvasRef.current) {
             displayStream.getTracks().forEach(t => t.stop());
             return;
          }

          setIsValidating(false);
          setIsAnalyzingOverlay(true);
          
          setTimeout(() => {
            setIsAnalyzingOverlay(false);

            const canvas = canvasRef.current!;
            const context = canvas.getContext('2d');
            if (!context) return;

            const MAX_WIDTH = 768;
            let width = videoElement.videoWidth;
            let height = videoElement.videoHeight;

            if (width > MAX_WIDTH) {
              height = Math.round((MAX_WIDTH / width) * height);
              width = MAX_WIDTH;
            }

            canvas.width = width;
            canvas.height = height;
            context.drawImage(videoElement, 0, 0, width, height);
            
            displayStream.getTracks().forEach(t => t.stop());

            const imageData = context.getImageData(0, 0, width, height);
            const features = processImageFeatures(imageData);

            drawHeatmapOverlay(context, width, height, features);

            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            const aiModelDataUrl = generateAIModelImage(canvas, width, height, features);

            // --- GEMINI ANATOMY VERIFICATION ---
            const verifyAndProceed = async () => {
              if (selectedPart) {
                setIsVerifyingAnatomy(true);
                try {
                  const { verifyAnatomy } = await import('../lib/gemini');
                  const formattedPart = selectedPart.replace(/_/g, ' ');
                  const result = await verifyAnatomy(dataUrl, formattedPart);
                  
                  if (!result.match) {
                    setIsVerifyingAnatomy(false);
                    setAnatomyError(`Mismatch Detected: You selected '${formattedPart}', but the AI detected something else. Reason: ${result.reason}`);
                    return; // Halt process
                  }
                } catch (err: any) {
                  console.error(err);
                  setIsVerifyingAnatomy(false);
                  setAnatomyError(`Verification Service Error: ${err.message}. Check your API Key.`);
                  return;
                }
                setIsVerifyingAnatomy(false);
              }

              onComplete({
                images: [dataUrl],
                aiModelImage: aiModelDataUrl,
                features,
                minJointAngle: null
              });
            };

            verifyAndProceed();
          }, 1500);
        }, 500); // Small delay to let the screen render first frame
      };
    } catch (err) {
      console.error("Error capturing screenshot:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 flex gap-3 items-start">
        <Info className="text-indigo-400 w-5 h-5 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-indigo-100 font-medium leading-relaxed">
          {steps[currentStep].instructions}
        </p>
      </div>

      <AnimatePresence>
        {anatomyError && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex gap-3 items-start shadow-lg shadow-red-500/10"
          >
            <AlertTriangle className="text-red-400 w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
               <p className="text-sm text-red-200 font-bold">Wrong Image Doesn't Match</p>
               <p className="text-sm text-red-300/80 font-medium leading-relaxed">{anatomyError}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative aspect-video rounded-3xl bg-slate-950 overflow-hidden shadow-2xl border border-slate-800">
        {!isCameraActive ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 gap-6">
            <div className="flex flex-col items-center">
              <Camera className="w-12 h-12 mb-4 opacity-50" />
              <button 
                onClick={startCamera}
                className="px-8 py-3 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"
              >
                <Scan className="w-5 h-5" /> Initialize Real CV Tracking
              </button>
            </div>
            
            <div className="flex items-center gap-4 w-full max-w-[250px]">
               <div className="h-px bg-slate-800 flex-1" />
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">OR</span>
               <div className="h-px bg-slate-800 flex-1" />
            </div>

            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-8 py-3 bg-slate-800 text-slate-200 border border-slate-700 rounded-full font-bold hover:bg-slate-700 transition-all shadow-lg flex items-center gap-2"
            >
              <ImageIcon className="w-5 h-5" /> Upload Photo from Gallery
            </button>
            
            <button 
              onClick={handleScreenshotCapture}
              className="px-8 py-3 bg-slate-800 text-slate-200 border border-slate-700 rounded-full font-bold hover:bg-slate-700 transition-all shadow-lg flex items-center gap-2"
            >
              <Monitor className="w-5 h-5" /> Capture Screenshot
            </button>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageUpload} 
            />
          </div>
        ) : (
          <>
            <video 
              ref={videoRef} 
              playsInline 
              muted
              className="w-full h-full object-cover"
            />
            
            <canvas ref={overlayCanvasRef} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />

            {/* Validation State Overlay */}
            <AnimatePresence>
              {(isValidating || isVerifyingAnatomy) && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm z-20"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <span className="mono-label !text-indigo-300 shadow-xl">
                      {isVerifyingAnatomy ? "Verifying Anatomy via Google AI..." : "Running OpenCV Process..."}
                    </span>
                  </div>
                </motion.div>
              )}

              {isAnalyzingOverlay && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden"
                >
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.2)_1px,transparent_1px)] bg-[size:40px_40px] opacity-30 animate-pulse" />
                  <div className="absolute bottom-4 left-4 flex flex-col gap-1">
                     <span className="mono-label !text-emerald-400">EXTRACTING PIXEL CLUSTERS</span>
                     <span className="mono-label !text-indigo-400">R:{accumulatedFeatures.rednessPercentage}% B:{accumulatedFeatures.bruisePercentage}%</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Controls */}
            {!isValidating && !isAnalyzingOverlay && !isVerifyingAnatomy && (
              <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-4 z-30">
                <button 
                  onClick={captureImage}
                  className={`w-20 h-20 bg-slate-950/50 backdrop-blur-md rounded-full border-4 ${currentStep === 3 ? 'border-emerald-500' : 'border-indigo-500'} flex items-center justify-center shadow-2xl active:scale-95 transition-all`}
                >
                  {currentStep === 3 ? (
                    <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center"><Play className="w-5 h-5 text-white" /></div>
                  ) : (
                    <div className="w-14 h-14 bg-indigo-600 rounded-full" />
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex gap-4 justify-center overflow-x-auto pb-2 custom-scrollbar">
        {steps.map((step, idx) => (
          <div key={idx} className="flex flex-col items-center gap-2 flex-shrink-0">
            <div className={`w-3 h-3 rounded-full flex items-center justify-center ${idx === currentStep ? 'bg-indigo-500 animate-pulse ring-4 ring-indigo-500/20' : idx < capturedImages.length ? 'bg-emerald-500' : 'bg-slate-800'}`}>
              {idx < capturedImages.length && <CheckCircle2 className="w-2 h-2 text-slate-950" />}
            </div>
            <span className={`mono-label !text-[9px] ${idx === currentStep ? '!text-indigo-400 font-bold' : ''}`}>{step.label}</span>
          </div>
        ))}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default VisualScan;
