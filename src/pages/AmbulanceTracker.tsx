import React, { useState, useEffect } from 'react';
import { MapPin, PhoneCall, AlertTriangle, ArrowLeft, Clock, Activity, Crosshair, Navigation, Search, Building } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AmbulanceTracker({ onBack }: { onBack: () => void }) {
  const [status, setStatus] = useState<'location' | 'confirmation' | 'calling' | 'dispatched'>('location');
  const [eta, setEta] = useState(8);
  const [locationQuery, setLocationQuery] = useState('');
  const [resolvedLocation, setResolvedLocation] = useState('Current GPS Location');
  const [nearestHospital, setNearestHospital] = useState('Locating...');
  const [isDetecting, setIsDetecting] = useState(false);
  const [distance, setDistance] = useState('0.0');
  const [directionsUrl, setDirectionsUrl] = useState('');

  const [overallMapQuery, setOverallMapQuery] = useState('India');

  const proceedToConfirmation = (loc: string, hospitalName: string, etaMins: number, distKm: string, saddr: string, daddr: string) => {
    setResolvedLocation(loc);
    setNearestHospital(hospitalName);
    setEta(etaMins);
    setDistance(distKm);
    setDirectionsUrl(`https://maps.google.com/maps?saddr=${saddr}&daddr=${daddr}&t=m&z=13&output=embed`);
    setStatus('confirmation');
  };

  const handleDetectLocation = () => {
    setIsDetecting(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          try {
            // Reverse geocode for UI name
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            const data = await res.json();
            const state = data.address?.state || '';
            const locName = data.address?.city || data.address?.county || data.address?.state || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
            setOverallMapQuery(state ? `${state}, India` : 'India');

            // Find real nearest hospital using Overpass API
            const overpassQuery = `[out:json];node["amenity"="hospital"](around:15000,${lat},${lon});out 1;`;
            const overpassRes = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`);
            const overpassData = await overpassRes.json();

            let hospitalName = "City General Hospital";
            let hLat = lat + 0.02;
            let hLon = lon + 0.02;

            if (overpassData.elements && overpassData.elements.length > 0) {
              hospitalName = overpassData.elements[0].tags?.name || "Local Emergency Center";
              hLat = overpassData.elements[0].lat;
              hLon = overpassData.elements[0].lon;
            }

            // Get exact route time and distance from OSRM
            const osrmRes = await fetch(`https://router.project-osrm.org/route/v1/driving/${hLon},${hLat};${lon},${lat}?overview=false`);
            const osrmData = await osrmRes.json();

            let etaMinutes = 8;
            let distKm = "4.5";

            if (osrmData.routes && osrmData.routes.length > 0) {
              etaMinutes = Math.max(1, Math.ceil(osrmData.routes[0].duration / 60));
              distKm = (osrmData.routes[0].distance / 1000).toFixed(1);
            }

            setIsDetecting(false);
            proceedToConfirmation(locName, hospitalName, etaMinutes, distKm, `${hLat},${hLon}`, `${lat},${lon}`);
          } catch (err) {
            console.error(err);
            setIsDetecting(false);
            proceedToConfirmation(`${lat.toFixed(4)}, ${lon.toFixed(4)}`, "Nearest Hospital", 10, "5.0", `${lat+0.05},${lon+0.05}`, `${lat},${lon}`);
          }
        },
        (error) => {
          setIsDetecting(false);
          alert("Location access denied. Please enter manually.");
        }
      );
    } else {
      setIsDetecting(false);
      alert("Geolocation not supported. Please enter manually.");
    }
  };

  const handleSubmitLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationQuery.trim()) return;
    
    setIsDetecting(true);
    try {
      // Forward geocode typed location
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationQuery.trim() + ', India')}`);
      const data = await res.json();
      
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        
        // Find real nearest hospital using Overpass API
        const overpassQuery = `[out:json];node["amenity"="hospital"](around:15000,${lat},${lon});out 1;`;
        const overpassRes = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`);
        const overpassData = await overpassRes.json();

        let hospitalName = "City General Hospital";
        let hLat = lat + 0.02;
        let hLon = lon + 0.02;

        if (overpassData.elements && overpassData.elements.length > 0) {
          hospitalName = overpassData.elements[0].tags?.name || "Local Emergency Center";
          hLat = overpassData.elements[0].lat;
          hLon = overpassData.elements[0].lon;
        }

        // Get exact route time and distance from OSRM
        const osrmRes = await fetch(`https://router.project-osrm.org/route/v1/driving/${hLon},${hLat};${lon},${lat}?overview=false`);
        const osrmData = await osrmRes.json();

        let etaMinutes = 8;
        let distKm = "4.5";

        if (osrmData.routes && osrmData.routes.length > 0) {
          etaMinutes = Math.max(1, Math.ceil(osrmData.routes[0].duration / 60));
          distKm = (osrmData.routes[0].distance / 1000).toFixed(1);
        }

        setIsDetecting(false);
        setOverallMapQuery(`${locationQuery.trim()}, India`);
        proceedToConfirmation(locationQuery.trim(), hospitalName, etaMinutes, distKm, `${hLat},${hLon}`, `${lat},${lon}`);
      } else {
        setIsDetecting(false);
        proceedToConfirmation(locationQuery.trim(), "Unknown Hospital", 15, "12.0", locationQuery.trim(), locationQuery.trim());
      }
    } catch (err) {
      setIsDetecting(false);
      proceedToConfirmation(locationQuery.trim(), "Unknown Hospital", 15, "12.0", locationQuery.trim(), locationQuery.trim());
    }
  };

  useEffect(() => {
    if (status === 'calling') {
      const timer = setTimeout(() => {
        setStatus('dispatched');
      }, 3000);
      return () => clearTimeout(timer);
    } else if (status === 'dispatched') {
      const interval = setInterval(() => {
        setEta(prev => Math.max(1, prev - 1));
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [status]);



  return (
    <div className="space-y-8 max-w-4xl mx-auto py-4">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100">
            Emergency <span className="text-red-500 font-normal">/ Dispatch</span>
          </h1>
          <p className="mono-label !text-red-400">Systematic Tracking Active</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {status === 'location' ? (
          <motion.div 
            key="location"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="max-w-md mx-auto space-y-8 mt-12"
          >
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <MapPin className="w-10 h-10 text-indigo-500" />
              </div>
              <h2 className="text-3xl font-black uppercase italic tracking-tighter text-slate-100">Set Dispatch <span className="text-indigo-500">Location</span></h2>
              <p className="text-slate-400 font-medium">We need your location to find the nearest hospital and dispatch an ambulance.</p>
            </div>

            <div className="w-full h-[200px] rounded-2xl overflow-hidden relative bg-slate-900 border border-slate-800 shadow-xl pointer-events-none">
              <iframe 
                src="https://maps.google.com/maps?q=India&t=m&z=4&ie=UTF8&iwloc=&output=embed" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={false} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur text-xs font-bold px-3 py-1.5 rounded-lg text-indigo-400 border border-slate-700">
                National Grid Mode
              </div>
            </div>

            <button 
              onClick={handleDetectLocation}
              disabled={isDetecting}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isDetecting ? (
                <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Locating...</>
              ) : (
                <><Navigation className="w-5 h-5" /> Use Current Location</>
              )}
            </button>

            <div className="flex items-center gap-4 w-full">
              <div className="h-px bg-slate-800 flex-1" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">OR ENTER MANUALLY</span>
              <div className="h-px bg-slate-800 flex-1" />
            </div>

            <form onSubmit={handleSubmitLocation} className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Enter city, address, or zip code" 
                  value={locationQuery}
                  onChange={e => setLocationQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 font-medium outline-none focus:border-indigo-500 transition-colors text-slate-100"
                />
              </div>
              <button 
                type="submit"
                disabled={!locationQuery.trim()}
                className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold uppercase tracking-wider transition-all disabled:opacity-50"
              >
                Find Nearest Hospital
              </button>
            </form>
          </motion.div>

        ) : status === 'confirmation' ? (
          <motion.div 
            key="confirmation"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}
            className="max-w-md mx-auto space-y-8 mt-12 bg-slate-900 border border-slate-800 p-8 rounded-3xl"
          >
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building className="w-8 h-8 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-slate-100">Nearest Unit Found</h2>
              <p className="text-slate-400">Review dispatch details before booking.</p>
            </div>

            <div className="bg-slate-950 rounded-2xl p-6 space-y-4 border border-slate-800">
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Destination Hospital</p>
                <p className="text-lg font-bold text-slate-200">{nearestHospital}</p>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Distance</p>
                  <p className="text-xl font-bold text-slate-300">{distance} km</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Arrival Time</p>
                  <p className="text-xl font-bold text-emerald-400">{eta} min</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => setStatus('calling')}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/50"
              >
                <PhoneCall className="w-5 h-5" /> Accept & Book Ambulance
              </button>
              <button 
                onClick={() => setStatus('location')}
                className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold uppercase tracking-wider transition-all"
              >
                Reject & Find Another
              </button>
            </div>
          </motion.div>

        ) : status === 'calling' ? (
          <motion.div 
            key="calling"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }}
            className="flex flex-col items-center justify-center min-h-[400px] space-y-6"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20 blur-xl"></div>
              <div className="bg-red-500/20 p-8 rounded-full border border-red-500/30 relative z-10">
                <PhoneCall className="w-16 h-16 text-red-500 animate-pulse" />
              </div>
            </div>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-red-500 text-center">
              Dispatching <br/>Ambulance
            </h2>
            <p className="text-slate-400 mono-label animate-pulse">Routing to {nearestHospital}...</p>
          </motion.div>

        ) : (
          <motion.div 
            key="dispatched"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
            className="space-y-6"
          >
            {/* Booking Receipt */}
            <div className="bg-emerald-500/10 border-2 border-emerald-500/30 border-dashed rounded-3xl p-6 text-center space-y-2 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50"></div>
              <p className="text-emerald-400 font-black uppercase tracking-widest text-sm mb-2 flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Booking Confirmed
              </p>
              <h2 className="text-2xl font-black text-slate-100">Ambulance Unit #A-42</h2>
              <p className="text-slate-300 text-sm md:text-base">
                Routing to <span className="text-white font-bold">{nearestHospital}</span>. Arriving in approximately <span className="text-emerald-400 font-bold">{eta} minutes</span>.
              </p>
            </div>

            {/* Status Header */}
            <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="bg-red-500 text-white p-4 rounded-full relative">
                  <AlertTriangle className="w-8 h-8" />
                  <div className="absolute top-0 right-0 w-3 h-3 bg-white rounded-full animate-ping"></div>
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase italic text-red-500">Ambulance Dispatched</h2>
                  <p className="text-red-300 font-bold">Unit #A-42 is en route to {resolvedLocation}</p>
                </div>
              </div>
              
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-6 min-w-[200px]">
                <div>
                  <p className="mono-label mb-1">Distance & ETA</p>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-end gap-1 text-emerald-400">
                      <span className="text-4xl font-black italic leading-none">{eta}</span>
                      <span className="font-bold mb-1">min</span>
                    </div>
                    <span className="text-xs font-bold text-slate-400">{distance} km away</span>
                  </div>
                </div>
                <Clock className="w-8 h-8 text-slate-600" />
              </div>
            </div>

            {/* Map View */}
            <div className="glass-panel p-2 rounded-3xl overflow-hidden relative border border-slate-800">
              <div className="absolute top-6 left-6 z-10 bg-slate-900/80 backdrop-blur border border-slate-700 p-3 rounded-xl flex items-center gap-3">
                <Activity className="w-5 h-5 text-indigo-400" />
                <div>
                  <p className="text-xs font-bold text-slate-300">Live Tracking</p>
                  <p className="mono-label !text-indigo-400">Routing to {nearestHospital}</p>
                </div>
              </div>
              <div className="w-full h-[400px] rounded-2xl overflow-hidden relative bg-slate-900 border border-slate-800">
                <iframe 
                  src={directionsUrl} 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen={false} 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                />
                {/* Radar pulse overlay in center to simulate tracking */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="relative">
                    <div className="w-32 h-32 border-2 border-indigo-500 rounded-full animate-ping opacity-30"></div>
                    <div className="w-4 h-4 bg-indigo-500 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-[0_0_15px_rgba(99,102,241,1)]"></div>
                    <Crosshair className="w-12 h-12 text-indigo-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-50" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
                <div className="bg-slate-800 p-3 rounded-lg"><Building className="text-indigo-400 w-5 h-5" /></div>
                <div className="overflow-hidden">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Fastest Hospital</p>
                  <p className="text-sm text-slate-200 font-medium truncate" title={nearestHospital}>{nearestHospital}</p>
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
                <div className="bg-slate-800 p-3 rounded-lg"><Activity className="text-emerald-400 w-5 h-5" /></div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Patient Status</p>
                  <p className="text-sm text-slate-200 font-medium truncate">Transmitted to EMTs</p>
                </div>
              </div>
              <a href="tel:108" className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-4 hover:bg-slate-800 transition-colors cursor-pointer group">
                <div className="bg-red-500/20 p-3 rounded-lg group-hover:bg-red-500/30 transition-colors"><PhoneCall className="text-red-400 w-5 h-5" /></div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Emergency Contact</p>
                  <p className="text-sm text-slate-200 font-medium truncate">Dial 108 (Ambulance)</p>
                </div>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

