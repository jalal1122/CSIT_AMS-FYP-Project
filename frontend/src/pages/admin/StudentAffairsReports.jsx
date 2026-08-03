import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Download, Users, UserPlus, HeartPulse, RefreshCw } from "lucide-react";
import ReportFilterBar from "../../components/reports/ReportFilterBar";
import { fetchV2Reports, exportV2Report } from "../../store/slices/analyticsSlice";
import EmptyState from "../../components/shared/EmptyState";

export default function StudentAffairsReports() {
  const dispatch = useDispatch();
  const { medicalLeaveLedger, repeaterTracking, studentOnboardingStatus, loading } = useSelector((state) => state.analytics);
  const [currentFilters, setCurrentFilters] = useState(null);

  const handleFilterChange = (filterPayload) => {
    setCurrentFilters(filterPayload);
    dispatch(fetchV2Reports({ target: "medical-leave-ledger", ...filterPayload }));
    dispatch(fetchV2Reports({ target: "repeater-tracking", ...filterPayload }));
    dispatch(fetchV2Reports({ target: "student-onboarding-status", ...filterPayload }));
  };

  const handleExport = (target, format) => {
    if (!currentFilters) return;
    dispatch(exportV2Report({ target, ...currentFilters, format }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Student Affairs & Edge Cases</h1>
          <p className="text-slate-600 mt-1">Specialized tracking for leaves, repeaters, and onboarding</p>
        </div>
      </div>

      <ReportFilterBar onFilterChange={handleFilterChange} userRole="admin" />

      {loading && currentFilters && (
        <div className="text-center text-slate-500 py-10">Fetching student affairs records...</div>
      )}

      {!loading && !currentFilters && (
        <div className="card p-10 bg-slate-50/50 flex items-center justify-center">
          <EmptyState 
            icon={Users} 
            title="Select Filters" 
            subtitle="Choose a timeframe and departments to load student affairs data." 
          />
        </div>
      )}

      {!loading && currentFilters && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Report 24: Medical Leave Ledger */}
          <div className="card p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center text-pink-600">
                  <HeartPulse className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">Medical Leave & Approved Absences</h2>
                  <p className="text-sm text-slate-500">Audit report of officially granted leaves</p>
                </div>
              </div>
              <button 
                onClick={() => handleExport("medical-leave-ledger", "xlsx")}
                className="btn-secondary flex items-center justify-center gap-2 border-pink-200 text-pink-700 hover:bg-pink-50"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>

            {medicalLeaveLedger && medicalLeaveLedger.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 bg-slate-50/80 uppercase">
                    <tr>
                      <th className="px-4 py-3 rounded-l-lg">Roll No</th>
                      <th className="px-4 py-3">Student Name</th>
                      <th className="px-4 py-3 text-right">Total Approved Leaves</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medicalLeaveLedger.slice(0, 10).map((record) => (
                      <tr key={record.studentId} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-medium text-slate-700">{record.rollNo || "N/A"}</td>
                        <td className="px-4 py-3">{record.name}</td>
                        <td className="px-4 py-3 text-right font-semibold text-pink-600">{record.totalLeaves}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState icon={HeartPulse} title="No Leaves Recorded" subtitle="No official leaves found for this filter." />
            )}
          </div>

          {/* Report 25: Repeater Matrix */}
          <div className="card p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">Repeater & Casual Student Roster</h2>
                  <p className="text-sm text-slate-500">Students attending classes outside their primary batch</p>
                </div>
              </div>
              <button 
                onClick={() => handleExport("repeater-tracking", "xlsx")}
                className="btn-secondary flex items-center justify-center gap-2 border-orange-200 text-orange-700 hover:bg-orange-50"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>

            {repeaterTracking && repeaterTracking.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 bg-slate-50/80 uppercase">
                    <tr>
                      <th className="px-4 py-3 rounded-l-lg">Roll No</th>
                      <th className="px-4 py-3">Student Name</th>
                      <th className="px-4 py-3">Enrolled Subject</th>
                      <th className="px-4 py-3 text-right">Attendance %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {repeaterTracking.slice(0, 10).map((record, i) => (
                      <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-medium text-slate-700">{record.rollNo || "N/A"}</td>
                        <td className="px-4 py-3">{record.name}</td>
                        <td className="px-4 py-3 text-slate-600">{record.subjectName}</td>
                        <td className="px-4 py-3 text-right font-medium">
                          {record.percentage ? record.percentage.toFixed(1) : 0}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState icon={RefreshCw} title="No Repeaters Found" subtitle="No out-of-batch students detected." />
            )}
          </div>

          {/* Report 26: Onboarding Status */}
          <div className="card p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center text-sky-600">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">Incomplete Onboarding Tracker</h2>
                  <p className="text-sm text-slate-500">Students who haven't set up their profile</p>
                </div>
              </div>
              <button 
                onClick={() => handleExport("student-onboarding-status", "xlsx")}
                className="btn-secondary flex items-center justify-center gap-2 border-sky-200 text-sky-700 hover:bg-sky-50"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>

            {studentOnboardingStatus && studentOnboardingStatus.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 bg-slate-50/80 uppercase">
                    <tr>
                      <th className="px-4 py-3 rounded-l-lg">Roll No</th>
                      <th className="px-4 py-3">Student Name</th>
                      <th className="px-4 py-3">Missing Email</th>
                      <th className="px-4 py-3">Default Password</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentOnboardingStatus.slice(0, 10).map((record) => (
                      <tr key={record._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-medium text-slate-700">{record.rollNo || "N/A"}</td>
                        <td className="px-4 py-3">{record.name}</td>
                        <td className="px-4 py-3">
                          {(!record.email || record.email === "") ? (
                            <span className="text-rose-600 font-medium">Yes</span>
                          ) : (
                            <span className="text-emerald-600">No</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {record.mustChangePassword ? (
                            <span className="text-rose-600 font-medium">Yes</span>
                          ) : (
                            <span className="text-emerald-600">No</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-4 text-sm text-slate-500 border-t border-slate-100 pt-4 flex justify-between items-center">
                  <span>{studentOnboardingStatus.length} students have incomplete profiles.</span>
                  <button className="text-sky-600 hover:text-sky-700 font-medium">Send Reminders</button>
                </div>
              </div>
            ) : (
              <EmptyState icon={UserPlus} title="All Setup" subtitle="All students have completed profile setup." />
            )}
          </div>

        </div>
      )}
    </div>
  );
}
