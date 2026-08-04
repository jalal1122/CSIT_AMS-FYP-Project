import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Download, BrainCircuit, Clock, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from "recharts";
import ReportFilterBar from "../../components/reports/ReportFilterBar";
import { fetchV2Reports, exportV2Report } from "../../store/slices/analyticsSlice";
import EmptyState from "../../components/shared/EmptyState";

export default function BehavioralAnalytics() {
  const dispatch = useDispatch();
  const { timeOfDayAbsenteeism, loading } = useSelector((state) => state.analytics);
  const [currentFilters, setCurrentFilters] = useState(null);

  const handleFilterChange = (filterPayload) => {
    setCurrentFilters(filterPayload);
    dispatch(fetchV2Reports({ target: "time-of-day-absenteeism", ...filterPayload }));
  };

  const handleExport = (target, format) => {
    if (!currentFilters) return;
    dispatch(exportV2Report({ target, ...currentFilters, format }));
  };

  const formatHour = (hour) => {
    if (hour === 0) return "12am";
    if (hour < 12) return `${hour}am`;
    if (hour === 12) return "12pm";
    return `${hour - 12}pm`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Behavioral Analytics</h1>
          <p className="text-slate-600 mt-1">Deep dive into operational and attendance behavior patterns</p>
        </div>
      </div>

      <ReportFilterBar onFilterChange={handleFilterChange} userRole="admin" />

      {loading && currentFilters && (
        <div className="text-center text-slate-500 py-10">Analyzing behavior patterns...</div>
      )}

      {!loading && !currentFilters && (
        <div className="card p-10 bg-slate-50/50 flex items-center justify-center">
          <EmptyState 
            icon={BrainCircuit} 
            title="Select Filters" 
            subtitle="Choose a timeframe and departments to load behavioral insights." 
          />
        </div>
      )}

      {!loading && currentFilters && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Report 30: Time-of-Day Absenteeism */}
          <div className="card p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-fuchsia-100 flex items-center justify-center text-fuchsia-600">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">Time-of-Day Absenteeism Heatmap</h2>
                  <p className="text-sm text-slate-500">Correlation between class timing and absence rates</p>
                </div>
              </div>
              <button 
                onClick={() => handleExport("time-of-day-absenteeism", "xlsx")}
                className="btn-secondary flex items-center justify-center gap-2 border-fuchsia-200 text-fuchsia-700 hover:bg-fuchsia-50"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>

            {timeOfDayAbsenteeism && timeOfDayAbsenteeism.length > 0 ? (
              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeOfDayAbsenteeism} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="hour" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#64748b'}} 
                      tickFormatter={formatHour}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#64748b'}}
                      domain={[0, 100]}
                      tickFormatter={(val) => `${val}%`}
                    />
                    <RechartsTooltip 
                      labelFormatter={(label) => `Hour: ${formatHour(label)}`}
                      cursor={{fill: '#f1f5f9'}}
                      contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    />
                    <Legend iconType="circle" />
                    <Bar dataKey="absentRate" fill="#d946ef" name="Absence Rate (%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState icon={BarChart3} title="No Data Available" subtitle="No attendance sessions recorded to build a heatmap." />
            )}
          </div>

        </div>
      )}
    </div>
  );
}
