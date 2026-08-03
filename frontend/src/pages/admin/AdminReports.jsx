import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Download, FileSpreadsheet, AlertOctagon, TrendingUp, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from "recharts";
import EmptyState from "../../components/shared/EmptyState";
import ReportFilterBar from "../../components/reports/ReportFilterBar";
import { fetchV2Reports, exportV2Report } from "../../store/slices/analyticsSlice";
import toast from "react-hot-toast";

export default function AdminReports() {
  const dispatch = useDispatch();
  const { defaulterMatrix, teacherUtilization, loading } = useSelector((state) => state.analytics);

  const [currentFilters, setCurrentFilters] = useState(null);

  const handleFilterChange = (filterPayload) => {
    setCurrentFilters(filterPayload);
    // Admins usually want to see defaulters and teacher utilization across the filtered domain
    dispatch(fetchV2Reports({ target: "defaulter-matrix", ...filterPayload }));
    dispatch(fetchV2Reports({ target: "teacher-utilization", ...filterPayload }));
  };

  const handleExport = (target, format) => {
    if (!currentFilters) {
      toast.error("Please apply filters first.");
      return;
    }
    dispatch(exportV2Report({ target, ...currentFilters, format }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Global Analytics & Reports</h2>
          <p className="text-slate-500 text-sm mt-1">Analyze multi-level attendance trends, defaulters, and staff utilization.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button 
            onClick={() => handleExport("defaulter-matrix", "xlsx")}
            className="flex-1 md:flex-none btn-secondary flex items-center justify-center gap-2 border-amber-200 text-amber-700 hover:bg-amber-50"
          >
            <AlertOctagon className="w-4 h-4" /> Export Defaulters
          </button>
          <button 
            onClick={() => handleExport("teacher-utilization", "xlsx")}
            className="flex-1 md:flex-none btn-primary flex items-center justify-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export Utilization
          </button>
        </div>
      </div>

      <ReportFilterBar onFilterChange={handleFilterChange} userRole="admin" />

      {loading && <div className="text-center text-slate-500 py-10">Aggregating global insights...</div>}

      {!loading && currentFilters && (
        <div className="space-y-6">
          {/* Teacher Utilization */}
          <div className="card p-5 bg-white border-slate-200">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-indigo-500" />
              Staff Verification Analytics
            </h3>
            {teacherUtilization && teacherUtilization.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teacherUtilization} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" stroke="#6366f1" />
                    <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" />
                    <RechartsTooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="totalSessions" fill="#6366f1" name="Total Sessions" />
                    <Bar yAxisId="right" dataKey="manualOverrideRate" fill="#f59e0b" name="Manual Override %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState 
                icon={Users} 
                title="No Sessions Recorded" 
                subtitle="No session verification data available for this timeframe." 
              />
            )}
          </div>

          {/* Top Defaulters Table Preview */}
          <div className="card p-5 bg-white border-slate-200">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
              <AlertOctagon className="w-5 h-5 text-rose-500" />
              Critical Defaulters Preview
            </h3>
            {defaulterMatrix && defaulterMatrix.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="p-3 font-semibold">Student Name</th>
                      <th className="p-3 font-semibold">Roll No</th>
                      <th className="p-3 font-semibold">Total Classes</th>
                      <th className="p-3 font-semibold">Present</th>
                      <th className="p-3 font-semibold">Percentage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {defaulterMatrix.slice(0, 5).map((def) => (
                      <tr key={def.studentId} className="hover:bg-slate-50">
                        <td className="p-3 font-medium text-slate-800">{def.name}</td>
                        <td className="p-3 text-slate-600">{def.rollNo}</td>
                        <td className="p-3 text-slate-600">{def.total}</td>
                        <td className="p-3 text-slate-600">{def.present}</td>
                        <td className="p-3">
                          <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold">
                            {def.percentage.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {defaulterMatrix.length > 5 && (
                  <div className="text-center mt-4">
                    <p className="text-sm text-slate-500">And {defaulterMatrix.length - 5} more... Please export for the full list.</p>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState 
                icon={AlertOctagon} 
                title="No Defaulters Found" 
                subtitle="All students meet the 75% threshold in the selected scope." 
              />
            )}
          </div>
        </div>
      )}

      {!loading && !currentFilters && (
        <div className="card p-10 bg-slate-50/50 flex items-center justify-center">
          <EmptyState 
            icon={TrendingUp} 
            title="Select filters to generate global insights" 
            subtitle="Apply filters above to analyze multi-level attendance trends and defaulters." 
          />
        </div>
      )}
    </div>
  );
}
