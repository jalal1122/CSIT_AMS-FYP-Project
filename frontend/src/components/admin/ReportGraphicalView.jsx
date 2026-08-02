import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import { Users, UserX, AlertTriangle, TrendingUp } from 'lucide-react';

const COLORS = ['#0ea5e9', '#f43f5e', '#f59e0b', '#10b981', '#8b5cf6'];

export default function ReportGraphicalView({ data }) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        No graphical data available for these filters.
      </div>
    );
  }

  // Transform data for charts if needed
  // For demonstration, expecting data to have metrics, trends, and distribution
  const { summary, attendanceTrend, sectionComparison } = data;

  return (
    <div className="space-y-6 overflow-y-auto max-h-[600px] p-2 hide-scrollbar">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-sky-50 border border-sky-100 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sky-700 font-medium text-sm">Total Sessions</span>
            <TrendingUp className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-2xl font-bold text-sky-900">{summary?.totalSessions || 0}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-emerald-700 font-medium text-sm">Avg Attendance</span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-900">{summary?.avgAttendancePercentage || 0}%</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-amber-700 font-medium text-sm">Defaulters</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-900">{summary?.defaultersCount || 0}</p>
        </div>
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-rose-700 font-medium text-sm">Absences</span>
            <UserX className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-rose-900">{summary?.totalAbsences || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Attendance Trend Chart */}
        <div className="card p-4 border border-slate-200">
          <h4 className="font-semibold text-slate-700 mb-4">Attendance Trend</h4>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={attendanceTrend || []} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{fontSize: 12}} stroke="#94a3b8" />
                <YAxis tick={{fontSize: 12}} stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="present" stroke="#0ea5e9" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Section Comparison Chart */}
        <div className="card p-4 border border-slate-200">
          <h4 className="font-semibold text-slate-700 mb-4">Section Comparison</h4>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectionComparison || []} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="section" tick={{fontSize: 12}} stroke="#94a3b8" />
                <YAxis tick={{fontSize: 12}} stroke="#94a3b8" />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} />
                <Bar dataKey="avgAttendance" name="Avg Attendance %" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
