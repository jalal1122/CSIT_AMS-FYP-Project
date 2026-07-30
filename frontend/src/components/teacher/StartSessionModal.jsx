import { useState } from "react";
import { X, MapPin, QrCode, PlayCircle, Settings, Crosshair } from "lucide-react";

export default function StartSessionModal({ isOpen, onClose, onStart, className }) {
  const [sessionType, setSessionType] = useState("Lecture");
  const [radius, setRadius] = useState(50);
  const [manualApproval, setManualApproval] = useState(false);
  const [ipMatchEnabled, setIpMatchEnabled] = useState(true);
  const [deviceLockEnabled, setDeviceLockEnabled] = useState(true);
  const [qrRefreshRate, setQrRefreshRate] = useState(15);
  const [isLocating, setIsLocating] = useState(false);
  const [geoEnabled, setGeoEnabled] = useState(true);

  if (!isOpen) return null;

  const handleStart = () => {
    const finalRadius = geoEnabled ? radius : 0;
    const settings = { type: sessionType, radius: finalRadius, manualApproval, ipMatchEnabled, deviceLockEnabled, qrRefreshRate };
    
    // Only fetch location if Geofencing is used (radius > 0)
    if (finalRadius > 0) {
      if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
      }
      
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsLocating(false);
          onStart({ 
            ...settings, 
            latitude: position.coords.latitude, 
            longitude: position.coords.longitude 
          });
        },
        (error) => {
          setIsLocating(false);
          alert("Unable to retrieve your location for geofencing. Please check permissions.");
          console.error("Geolocation error:", error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      onStart(settings);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Card */}
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Start Live Session</h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{className || "Class"}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Session Type</label>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              {['Lecture', 'Lab', 'Exam'].map(type => (
                <button
                  key={type}
                  onClick={() => setSessionType(type)}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                    sessionType === type 
                      ? "bg-white text-sky-600 shadow-sm" 
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Location & Geofencing */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sky-500" />
                <label className="text-sm font-semibold text-slate-700">Geofencing Radius</label>
              </div>
              <div className="relative inline-flex items-center h-5 rounded-full w-9 shrink-0">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={geoEnabled}
                  onChange={(e) => setGeoEnabled(e.target.checked)}
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
              </div>
            </div>
            
            <div className={`transition-opacity duration-200 ${geoEnabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
              <div className="flex items-center gap-4 mb-2">
                <input 
                  type="range" 
                  min="10" 
                  max="200" 
                  step="10"
                  value={radius}
                  onChange={(e) => setRadius(parseInt(e.target.value))}
                  className="flex-1 accent-sky-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  disabled={!geoEnabled}
                />
                <span className="text-sm font-semibold text-sky-600 w-12 text-right">{radius}m</span>
              </div>
              
              <div className="p-3 bg-sky-50 border border-sky-100 rounded-lg flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
                  <Crosshair className="w-4 h-4 text-sky-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Location tracking active</p>
                  <p className="text-xs text-slate-500 mt-0.5">Students must be within {radius}m of your current device coordinates.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Settings */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-slate-400" />
                <label className="text-sm font-semibold text-slate-700">Security Options</label>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500">QR Refresh:</span>
                <select 
                  className="text-xs border border-slate-200 rounded p-1 bg-slate-50 text-slate-700 focus:outline-none focus:border-sky-500"
                  value={qrRefreshRate}
                  onChange={(e) => setQrRefreshRate(parseInt(e.target.value))}
                >
                  <option value={5}>5s</option>
                  <option value={10}>10s</option>
                  <option value={15}>15s</option>
                  <option value={30}>30s</option>
                  <option value={60}>60s</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
              <label className="flex items-center justify-between p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-slate-700">Require Manual Approval</p>
                  <p className="text-xs text-slate-500">You must approve each student scan</p>
                </div>
                <div className="relative inline-flex items-center h-5 rounded-full w-9 shrink-0">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={manualApproval}
                    onChange={(e) => setManualApproval(e.target.checked)}
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
                </div>
              </label>

              <label className="flex items-center justify-between p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-slate-700">University Network Only</p>
                  <p className="text-xs text-slate-500">Students must match your IP address</p>
                </div>
                <div className="relative inline-flex items-center h-5 rounded-full w-9 shrink-0">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={ipMatchEnabled}
                    onChange={(e) => setIpMatchEnabled(e.target.checked)}
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
                </div>
              </label>

              <label className="flex items-center justify-between p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-slate-700">Prevent Buddy Punching</p>
                  <p className="text-xs text-slate-500">Lock attendance to one physical device</p>
                </div>
                <div className="relative inline-flex items-center h-5 rounded-full w-9 shrink-0">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={deviceLockEnabled}
                    onChange={(e) => setDeviceLockEnabled(e.target.checked)}
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
                </div>
              </label>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleStart}
            disabled={isLocating}
            className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors shadow-sm shadow-emerald-200 disabled:opacity-50"
          >
            {isLocating ? "Getting Location..." : (
              <>Start Session <PlayCircle className="w-4 h-4" /></>
            )}
          </button>
        </div>
        
      </div>
    </div>
  );
}
