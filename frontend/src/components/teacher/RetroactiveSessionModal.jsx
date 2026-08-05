import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { X, Save, Clock, Calendar } from "lucide-react";
import api from "../../services/api";
import { addToast } from "../../store/slices/toastSlice";

export default function RetroactiveSessionModal({ isOpen, onClose, allocationId, sectionName, students, onSuccess }) {
  const dispatch = useDispatch();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    startTime: "09:00",
    endTime: "10:00",
    type: "Lecture",
    location: { latitude: 0, longitude: 0 },
  });
  
  // Attendance records state
  const [attendance, setAttendance] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Initialize attendance records when moving to step 2
  const handleNext = () => {
    if (!formData.date || !formData.startTime || !formData.endTime) {
      dispatch(addToast({ title: "Error", message: "Please fill all details", type: "error" }));
      return;
    }
    
    if (!students || students.length === 0) {
      dispatch(addToast({ title: "Error", message: "No students enrolled in this section. Please add students first.", type: "error" }));
      return;
    }
    
    // Set default attendance to Present for everyone
    const defaultAttendance = {};
    students.forEach(s => {
      defaultAttendance[s.id || s._id] = "Present";
    });
    setAttendance(defaultAttendance);
    setStep(2);
  };

  const handleToggleAttendance = (studentId) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: prev[studentId] === "Present" ? "Absent" : "Present"
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // 1. Create retroactive session
      const sessionRes = await api.post("/api/v2/session/retroactive", {
        allocationId,
        sectionName,
        ...formData
      });
      
      const sessionId = sessionRes.data.data._id;

      // 2. Format attendance records for bulk insert
      const attendanceRecords = Object.entries(attendance).map(([studentId, status]) => ({
        studentId,
        status: status === "Present" ? "Present (Manual)" : "Absent"
      }));

      if (attendanceRecords.length === 0) {
        dispatch(addToast({ title: "Error", message: "No attendance records to save.", type: "error" }));
        setIsSubmitting(false);
        return;
      }

      // 3. Bulk insert attendance
      await api.post("/api/v2/attendance/bulk", {
        sessionId,
        attendanceRecords
      });

      dispatch(addToast({ title: "Success", message: "Retroactive session and attendance saved", type: "success" }));
      
      onSuccess();
      onClose();
      
      // Reset state
      setStep(1);
      setAttendance({});
      
    } catch (error) {
      dispatch(addToast({ title: "Error", message: error.response?.data?.message || "Failed to save retroactive session", type: "error" }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">
            {step === 1 ? "Add Retroactive Session Details" : "Mark Attendance for Retroactive Session"}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {step === 1 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                    <input 
                      type="date" 
                      value={formData.date}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                      className="input pl-10 w-full"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Session Type</label>
                  <select 
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value})}
                    className="input w-full"
                  >
                    <option value="Lecture">Lecture</option>
                    <option value="Lab">Lab</option>
                    <option value="Tutorial">Tutorial</option>
                    <option value="Exam">Exam</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Start Time</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                    <input 
                      type="time" 
                      value={formData.startTime}
                      onChange={e => setFormData({...formData, startTime: e.target.value})}
                      className="input pl-10 w-full"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">End Time</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                    <input 
                      type="time" 
                      value={formData.endTime}
                      onChange={e => setFormData({...formData, endTime: e.target.value})}
                      className="input pl-10 w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-slate-500 font-medium">Click on a student to toggle their status.</p>
                <div className="flex items-center gap-4 text-sm font-semibold">
                  <div className="flex items-center gap-1.5 text-emerald-600"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Present ({Object.values(attendance).filter(v => v === "Present").length})</div>
                  <div className="flex items-center gap-1.5 text-rose-600"><div className="w-3 h-3 rounded-full bg-rose-500"></div> Absent ({Object.values(attendance).filter(v => v === "Absent").length})</div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {students.map(student => {
                  const sid = student.id || student._id;
                  return (
                    <div 
                      key={sid} 
                      onClick={() => handleToggleAttendance(sid)}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${attendance[sid] === 'Present' ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{student.name}</p>
                          <p className="text-xs text-slate-500 font-mono">{student.rollNo}</p>
                        </div>
                        <div className={`px-2 py-1 rounded-md text-xs font-bold ${attendance[sid] === 'Present' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {attendance[sid]}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button 
            onClick={step === 2 ? () => setStep(1) : onClose}
            className="btn-secondary"
          >
            {step === 2 ? "Back" : "Cancel"}
          </button>
          
          {step === 1 ? (
            <button 
              onClick={handleNext}
              className="btn-primary"
            >
              Continue to Attendance
            </button>
          ) : (
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn-primary flex items-center gap-2"
            >
              {isSubmitting ? "Saving..." : <><Save className="w-4 h-4" /> Save Session & Attendance</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
