import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Download, FileSpreadsheet, ArrowLeft, GraduationCap, ShieldCheck, AlertTriangle } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";
import ReportFilterBar from "../../components/reports/ReportFilterBar";
import { fetchV2Reports, exportV2Report } from "../../store/slices/analyticsSlice";
import EmptyState from "../../components/shared/EmptyState";
import toast from "react-hot-toast";

const COLORS = {
  present: "#10b981", // emerald-500
  absent: "#f43f5e", // rose-500
  late: "#f59e0b", // amber-500
};

export default function StudentReports() {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { defaulterMatrix, loading } = useSelector(state => state.analytics);

  const [currentFilters, setCurrentFilters] = useState(null);

  const handleFilterChange = (filterPayload) => {
    setCurrentFilters(filterPayload);
    // Student fetches their own matrix row to get present/total counts
    dispatch(fetchV2Reports({ target: "defaulter-matrix", ...filterPayload }));
  };

  const handleExport = (format) => {
    if (!currentFilters) {
      toast.error("Please apply filters first.");
      return;
    }
    dispatch(exportV2Report({ target: "defaulter-matrix", ...currentFilters, format }));
  };

  // Safe Buffer Calculation
  const myData = defaulterMatrix && defaulterMatrix.length > 0 ? defaulterMatrix[0] : null;
  let safeBuffer = 0;
  let chartData = [];
  
  if (myData) {
    const present = myData.present || 0;
    const total = myData.total || 1;
    const absent = total - present;
    
    // How many classes can be missed before present/(total+X) < 0.75 ?
    // 0.75 * (total + X) = present  =>  X = (present / 0.75) - total
    safeBuffer = Math.floor((present / 0.75) - total);
    if (safeBuffer < 0) safeBuffer = 0;

    chartData = [
      { name: "Present", value: present, color: COLORS.present },
      { name: "Absent", value: absent, color: COLORS.absent },
    ];
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/student/dashboard" className="p-2 -ml-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-extrabold text-emerald-600 tracking-tight">My Analytics</h1>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Attendance insights for {user?.name}</p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold border border-emerald-200">
            {user?.name?.charAt(0) || "S"}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto w-full p-4 md:p-8 flex-1 space-y-6">
        <ReportFilterBar onFilterChange={handleFilterChange} userRole="student" />

        {loading && <div className="text-center text-slate-500 py-10">Loading insights...</div>}

        {!loading && currentFilters && myData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Safe Buffer Widget */}
            <div className="card p-6 bg-white border-slate-200 flex flex-col items-center justify-center text-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${safeBuffer > 2 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                {safeBuffer > 2 ? <ShieldCheck className="w-10 h-10" /> : <AlertTriangle className="w-10 h-10" />}
              </div>
              <h3 className="text-lg font-bold text-slate-800">Safe Buffer</h3>
              <p className="text-slate-500 text-sm mt-2 max-w-xs">
                You can afford to miss <strong className="text-slate-800 text-lg mx-1">{safeBuffer}</strong> more classes before dropping below the 75% threshold.
              </p>
              
              <div className="mt-8 flex gap-3 w-full max-w-xs">
                <button 
                  onClick={() => handleExport("pdf")}
                  className="flex-1 btn-secondary py-2 text-xs flex justify-center items-center gap-1"
                >
                  <Download className="w-4 h-4" /> PDF
                </button>
                <button 
                  onClick={() => handleExport("xlsx")}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded shadow-sm text-xs flex justify-center items-center gap-1"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Excel
                </button>
              </div>
            </div>

            {/* Status Breakdown Donut Chart */}
            <div className="card p-6 bg-white border-slate-200">
              <h3 className="font-bold text-slate-800 mb-4 text-center">Status Breakdown</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {!loading && currentFilters && !myData && (
           <EmptyState 
             icon={GraduationCap} 
             title="No Records Found" 
             subtitle="You don't have any attendance records for the selected timeframe." 
           />
        )}

        {!loading && !currentFilters && (
          <div className="card p-10 bg-slate-50/50 flex items-center justify-center">
            <EmptyState 
              icon={FileSpreadsheet} 
              title="Select filters to generate insights" 
              subtitle="Apply filters above to view your Safe Buffer and transcripts." 
            />
          </div>
        )}
      </main>
    </div>
  );
}
