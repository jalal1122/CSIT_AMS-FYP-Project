import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Download, FileSpreadsheet, Calendar, ArrowLeft, GraduationCap } from "lucide-react";
import { exportStudentTranscript } from "../../store/slices/analyticsSlice";

export default function StudentReports() {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleExport = (format) => {
    dispatch(exportStudentTranscript({ startDate, endDate, format }));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/student/dashboard" className="p-2 -ml-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-extrabold text-emerald-600 tracking-tight">My Transcripts</h1>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Attendance records for {user?.name}</p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold border border-emerald-200">
            {user?.name?.charAt(0) || "S"}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full p-4 md:p-8 flex-1">
        
        <div className="card p-8 border-emerald-200 bg-white shadow-sm flex flex-col md:flex-row gap-8 items-center md:items-start">
          <div className="w-32 h-32 bg-emerald-50 rounded-full flex items-center justify-center flex-shrink-0 border-8 border-emerald-100/50">
            <GraduationCap className="w-12 h-12 text-emerald-500" />
          </div>
          
          <div className="flex-1 w-full space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Export Attendance Transcript</h2>
              <p className="text-slate-500 text-sm mt-2 max-w-lg">
                Download a complete record of your attendance across all assigned classes. You can optionally filter by a specific date range.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Start Date (Optional)</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input 
                    type="date" 
                    className="input pl-10 py-2.5 w-full bg-slate-50 border-slate-200 focus:bg-white"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">End Date (Optional)</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input 
                    type="date" 
                    className="input pl-10 py-2.5 w-full bg-slate-50 border-slate-200 focus:bg-white"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button 
                onClick={() => handleExport("pdf")}
                className="btn-secondary py-3 px-6 flex justify-center items-center gap-2 border-slate-300 hover:bg-slate-50 text-slate-700"
              >
                <Download className="w-5 h-5" /> Download PDF Transcript
              </button>
              <button 
                onClick={() => handleExport("xlsx")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-6 rounded-lg shadow-sm transition-colors flex justify-center items-center gap-2"
              >
                <FileSpreadsheet className="w-5 h-5" /> Download Excel Format
              </button>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
