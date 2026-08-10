import { Info, Users, X } from "lucide-react";

export default function SessionDetailsModal({ 
  isOpen, 
  onClose, 
  isLoading, 
  sessionDetails 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl relative z-10 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-500" />
            <h3 className="font-bold text-slate-800 text-lg">Session Attendance Details</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {isLoading ? (
            <div className="py-12 text-center text-slate-500 flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-sky-500 rounded-full animate-spin"></div>
              Loading attendance records...
            </div>
          ) : sessionDetails.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No attendance records found for this session.</p>
            </div>
          ) : (
            <div className="space-y-1 border border-slate-100 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center text-xs font-semibold uppercase text-slate-500">
                <div className="flex-1">Student</div>
                <div className="w-24 text-right">Status</div>
              </div>
              <div className="divide-y divide-slate-50">
                {sessionDetails.map((record) => (
                  <div key={record.id || record._id} className="flex items-center px-4 py-3 hover:bg-slate-50/50">
                    <div className="flex-1">
                      <p className="font-bold text-slate-800 text-sm">{record.name}</p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{record.rollNo}</p>
                    </div>
                    <div className="w-24 text-right">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                        ['Present', 'Present (Manual)', 'Late'].includes(record.status) 
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-rose-50 text-rose-600'
                      }`}>
                        {record.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
