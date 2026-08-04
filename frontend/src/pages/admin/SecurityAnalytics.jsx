import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Download, Shield, MapPin, Activity, Smartphone } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from "recharts";
import { formatPKTDateTime } from "../../utils/dateUtils";
import ReportFilterBar from "../../components/reports/ReportFilterBar";
import { fetchV2Reports, exportV2Report } from "../../store/slices/analyticsSlice";
import EmptyState from "../../components/shared/EmptyState";

export default function SecurityAnalytics() {
  const dispatch = useDispatch();
  const { geofenceDrift, deviceBindingAudit, systemUsagePeaks, loading } = useSelector((state) => state.analytics);
  const [currentFilters, setCurrentFilters] = useState(null);

  const handleFilterChange = (filterPayload) => {
    setCurrentFilters(filterPayload);
    dispatch(fetchV2Reports({ target: "geofence-drift", ...filterPayload }));
    dispatch(fetchV2Reports({ target: "device-binding-audit", ...filterPayload }));
    dispatch(fetchV2Reports({ target: "system-usage-peaks", ...filterPayload }));
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

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">IT & Security Analytics</h1>
          <p className="text-slate-600 mt-1">Monitor system integrity, sensor anomalies, and traffic</p>
        </div>
      </div>

      <ReportFilterBar onFilterChange={handleFilterChange} userRole="admin" />

      {loading && currentFilters && (
        <div className="text-center text-slate-500 py-10">Running security diagnostics...</div>
      )}

      {!loading && !currentFilters && (
        <div className="card p-10 bg-slate-50/50 flex items-center justify-center">
          <EmptyState 
            icon={Shield} 
            title="Select Filters" 
            subtitle="Choose a timeframe and departments to load security analytics." 
          />
        </div>
      )}

      {!loading && currentFilters && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Report 28: Geofence Drift */}
          <div className="card p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">Geofence Drift & Sensor Anomalies</h2>
                  <p className="text-sm text-slate-500">Flagged attendances marked outside high-accuracy bounds</p>
                </div>
              </div>
              <button 
                onClick={() => handleExport("geofence-drift", "xlsx")}
                className="btn-secondary flex items-center justify-center gap-2 border-red-200 text-red-700 hover:bg-red-50"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>

            {geofenceDrift && geofenceDrift.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 bg-slate-50/80 uppercase">
                    <tr>
                      <th className="px-4 py-3 rounded-l-lg">Roll No</th>
                      <th className="px-4 py-3">Student Name</th>
                      <th className="px-4 py-3 text-right">Drift Incidents</th>
                      <th className="px-4 py-3 text-right">Total Scans</th>
                    </tr>
                  </thead>
                  <tbody>
                    {geofenceDrift.slice(0, 10).map((record) => (
                      <tr key={record.studentId} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-medium text-slate-700">{record.rollNo || "N/A"}</td>
                        <td className="px-4 py-3">{record.name}</td>
                        <td className="px-4 py-3 text-right font-semibold text-red-600">{record.driftIncidents}</td>
                        <td className="px-4 py-3 text-right">{record.totalScans}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState icon={MapPin} title="No Anomalies" subtitle="All location scans are within expected bounds." />
            )}
          </div>

          {/* Report 27: Device Binding Audit */}
          <div className="card p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">Device Binding Audit Log</h2>
                  <p className="text-sm text-slate-500">Record of manual device fingerprint resets</p>
                </div>
              </div>
              <button 
                onClick={() => handleExport("device-binding-audit", "xlsx")}
                className="btn-secondary flex items-center justify-center gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>

            {deviceBindingAudit && deviceBindingAudit.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 bg-slate-50/80 uppercase">
                    <tr>
                      <th className="px-4 py-3 rounded-l-lg">Date</th>
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3">Reason</th>
                      <th className="px-4 py-3">Reset By Admin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deviceBindingAudit.slice(0, 10).map((record) => (
                      <tr key={record._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-medium text-slate-700">
                          {formatPKTDateTime(record.resetDate, { month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })}
                        </td>
                        <td className="px-4 py-3">{record.studentName} <span className="text-slate-400">({record.rollNo})</span></td>
                        <td className="px-4 py-3 text-slate-600">{record.reason}</td>
                        <td className="px-4 py-3">{record.adminName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState icon={Smartphone} title="No Resets Found" subtitle="No devices were manually reset during this period." />
            )}
          </div>

          {/* Report 29: System Usage Peaks */}
          <div className="card p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">System Usage & API Traffic Peaks</h2>
                  <p className="text-sm text-slate-500">Server load analysis for resource provisioning</p>
                </div>
              </div>
              <button 
                onClick={() => handleExport("system-usage-peaks", "xlsx")}
                className="btn-secondary flex items-center justify-center gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>

            {systemUsagePeaks && systemUsagePeaks.length > 0 ? (
              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={systemUsagePeaks} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
                    />
                    <RechartsTooltip 
                      labelFormatter={(label) => `Hour: ${formatHour(label)}`}
                      cursor={{fill: '#f1f5f9'}}
                      contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    />
                    <Legend iconType="circle" />
                    <Line type="monotone" dataKey="totalTraffic" stroke="#10b981" strokeWidth={3} name="Total Requests" activeDot={{r: 8}} />
                    <Line type="monotone" dataKey="avgTraffic" stroke="#6366f1" strokeWidth={3} name="Avg. Hourly Traffic" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState icon={Activity} title="No Traffic Data" subtitle="Traffic logging is either disabled or no data is available." />
            )}
          </div>

        </div>
      )}
    </div>
  );
}
