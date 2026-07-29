import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from "recharts";
import StatCard from "../../components/shared/StatCard";
import Badge from "../../components/shared/Badge";

export default function AdminDashboard() {
  const { user } = useSelector(state => state.auth);
  
  const stats = [
    { label: "Total Users",      value: "12,450", gradient: "from-slate-700 to-slate-900" },
    { label: "Classes",          value: "342",    gradient: "from-sky-400 to-sky-600" },
    { label: "Students",         value: "11,200", gradient: "from-emerald-400 to-emerald-600" },
    { label: "Teachers",         value: "850",    gradient: "from-violet-400 to-violet-600" },
    { label: "Admins",           value: "24",     gradient: "from-fuchsia-400 to-fuchsia-600" },
    { label: "Active Sessions",  value: "156",    gradient: "from-amber-400 to-amber-600" },
  ];

  const pieData = [
    { name: "Students", value: 11200 },
    { name: "Teachers", value: 850 },
    { name: "Admins", value: 24 }
  ];
  const PIE_COLORS = ['#10B981', '#0EA5E9', '#8B5CF6']; // emerald, sky, violet

  const barData = [
    { name: "B1", students: 4000 },
    { name: "B2", students: 3000 },
    { name: "B3", students: 2000 },
    { name: "B4", students: 1500 },
    { name: "B5", students: 700 }
  ];

  const recentClasses = [
    { id: 1, name: "CS101 - Intro to Programming", batch: "Batch 2024-A", teacher: "Dr. Smith", status: "Active" },
    { id: 2, name: "MAT202 - Linear Algebra", batch: "Batch 2023-B", teacher: "Prof. Johnson", status: "Active" },
    { id: 3, name: "ENG105 - Academic Writing", batch: "Batch 2024-C", teacher: "Dr. Williams", status: "Inactive" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Admin Dashboard</h2>
        <p className="text-slate-500 text-sm mt-1">System overview and real-time management</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat, i) => (
          <StatCard key={i} title={stat.label} value={stat.value} gradient={stat.gradient} />
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* User Distribution */}
        <div className="card">
          <h3 className="text-lg font-bold text-slate-800 mb-6">User Distribution</h3>
          <div className="h-64 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={pieData} 
                  cx="50%" cy="50%" 
                  innerRadius={70} outerRadius={90} 
                  paddingAngle={2} 
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#475569' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total</span>
              <span className="text-xl font-bold text-slate-800">12.4k</span>
            </div>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div><span className="text-sm text-slate-600">Students</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-sky-500"></div><span className="text-sm text-slate-600">Teachers</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-violet-500"></div><span className="text-sm text-slate-600">Admins</span></div>
          </div>
        </div>

        {/* Students per Batch */}
        <div className="card">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Students per Batch</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" axisLine={false} tickLine={false} />
                <RechartsTooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="students" fill="#38bdf8" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Classes Table */}
        <div className="card lg:col-span-2 p-0 overflow-hidden">
          <div className="bg-sky-500 px-6 py-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Recent Classes</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-sky-50/50 border-b border-slate-100 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="px-6 py-3">Class Name</th>
                  <th className="px-6 py-3">Batch</th>
                  <th className="px-6 py-3">Teacher</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentClasses.map((cls) => (
                  <tr key={cls.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-700 font-medium">{cls.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{cls.batch}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{cls.teacher}</td>
                    <td className="px-6 py-4">
                      <Badge variant={cls.status === "Active" ? "info" : "neutral"}>
                        {cls.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Health */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800">System Health</h3>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          </div>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-600 font-medium">CPU Usage</span>
                <span className="text-slate-800 font-bold">42%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-sky-500 w-[42%] rounded-full"></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-600 font-medium">Memory Usage</span>
                <span className="text-slate-800 font-bold">68%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-sky-500 w-[68%] rounded-full"></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-600 font-medium">Server Uptime</span>
                <span className="text-slate-800 font-bold">99.9%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-sky-500 w-[99.9%] rounded-full"></div>
              </div>
              <p className="text-xs text-right text-slate-400 mt-2">94 days, 12 hours</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
