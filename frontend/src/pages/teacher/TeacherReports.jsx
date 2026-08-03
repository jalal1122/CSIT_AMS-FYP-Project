import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Download, FileSpreadsheet, AlertOctagon, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import EmptyState from "../../components/shared/EmptyState";
import ReportFilterBar from "../../components/reports/ReportFilterBar";
import { fetchV2Reports, exportV2Report } from "../../store/slices/analyticsSlice";
import toast from "react-hot-toast";

export default function TeacherReports() {
  const dispatch = useDispatch();
  const { atRiskTrajectory, teacherUtilization, loading } = useSelector((state) => state.analytics);

  const [currentFilters, setCurrentFilters] = useState(null);

  const handleFilterChange = (filterPayload) => {
    setCurrentFilters(filterPayload);
    // Fetch insights for Teacher
    dispatch(fetchV2Reports({ target: "at-risk-trajectory", ...filterPayload }));
    dispatch(fetchV2Reports({ target: "teacher-utilization", ...filterPayload }));
  };

  const handleExport = (format) => {
    if (!currentFilters) {
      toast.error("Please apply filters first.");
      return;
    }
    // Teachers usually export the defaulter matrix
    dispatch(exportV2Report({ target: "defaulter-matrix", ...currentFilters, format }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Class Reports & Insights</h2>
          <p className="text-slate-500 text-sm mt-1">Analyze attendance trajectories and export class matrices.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button 
            onClick={() => handleExport("pdf")}
            className="flex-1 md:flex-none btn-secondary flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" /> Export Defaulters (PDF)
          </button>
          <button 
            onClick={() => handleExport("xlsx")}
            className="flex-1 md:flex-none btn-primary flex items-center justify-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export Defaulters (Excel)
          </button>
        </div>
      </div>

      <ReportFilterBar onFilterChange={handleFilterChange} userRole="teacher" />

      {loading && <div className="text-center text-slate-500 py-10">Loading insights...</div>}

      {!loading && currentFilters && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* At Risk Radar */}
          <div className="card p-5 bg-white border-slate-200">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
              <AlertOctagon className="w-5 h-5 text-rose-500" />
              At-Risk Trajectory
            </h3>
            {atRiskTrajectory && atRiskTrajectory.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={atRiskTrajectory}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="name" />
                    <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} />
                    <Radar name="Absences (Last 5 Sessions)" dataKey="absencesInLastFive" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.6} />
                    <RechartsTooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState 
                icon={AlertOctagon} 
                title="No At-Risk Students" 
                subtitle="All students have good attendance in the recent sessions." 
              />
            )}
          </div>

          {/* Teacher Utilization */}
          <div className="card p-5 bg-white border-slate-200">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-indigo-500" />
              Session Verification Modes
            </h3>
            {teacherUtilization && teacherUtilization.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teacherUtilization} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="totalSessions" fill="#6366f1" name="Total Sessions" />
                    <Bar dataKey="manualOverrideRate" fill="#f59e0b" name="Manual Override %" />
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
        </div>
      )}

      {!loading && !currentFilters && (
        <div className="card p-10 bg-slate-50/50 flex items-center justify-center">
          <EmptyState 
            icon={FileSpreadsheet} 
            title="Select filters to generate insights" 
            subtitle="Apply filters above to view the At-Risk radar and session analytics." 
          />
        </div>
      )}
    </div>
  );
}
