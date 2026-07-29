import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from "recharts";
import { Users, BookOpen, GraduationCap, Radio } from "lucide-react";
// import api from "../../../services/api"; // For real data fetching later

export default function AdminDashboard() {
  const { user } = useSelector(state => state.auth);
  const [stats, setStats] = useState({
    totalStudents: 1240,
    totalTeachers: 45,
    activeBatches: 8,
    liveSessions: 3
  });

  const [trendData, setTrendData] = useState([
    { name: "Mon", attendance: 85 },
    { name: "Tue", attendance: 88 },
    { name: "Wed", attendance: 82 },
    { name: "Thu", attendance: 90 },
    { name: "Fri", attendance: 78 }
  ]);

  const [defaulterData, setDefaulterData] = useState([
    { name: "BSIT", defaulters: 12 },
    { name: "BSCS", defaulters: 18 },
    { name: "BSSE", defaulters: 8 }
  ]);

  const [pieData, setPieData] = useState([
    { name: "Present", value: 850 },
    { name: "Absent", value: 390 }
  ]);

  const COLORS = ['#10B981', '#EF4444', '#F59E0B', '#4F46E5'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Dashboard Overview</h2>
          <p className="text-text-muted">Welcome back, {user?.name}</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Active Students" value={stats.totalStudents} icon={<Users className="w-6 h-6 text-primary" />} />
        <StatCard title="Total Teachers" value={stats.totalTeachers} icon={<BookOpen className="w-6 h-6 text-secondary" />} />
        <StatCard title="Active Batches" value={stats.activeBatches} icon={<GraduationCap className="w-6 h-6 text-accent" />} />
        <StatCard title="Live Sessions" value={stats.liveSessions} icon={<Radio className="w-6 h-6 text-danger" />} />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Trend Chart */}
        <div className="glass p-6">
          <h3 className="text-lg font-bold text-text-primary mb-4">Attendance Trend (Last 7 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff1a" vertical={false} />
                <XAxis dataKey="name" stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1E1B4B', borderColor: '#4F46E5', borderRadius: '8px' }} 
                  itemStyle={{ color: '#F9FAFB' }} 
                />
                <Line type="monotone" dataKey="attendance" stroke="#4F46E5" strokeWidth={3} dot={{ fill: '#4F46E5', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Defaulter Chart */}
        <div className="glass p-6">
          <h3 className="text-lg font-bold text-text-primary mb-4">Defaulter Rate by Department</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={defaulterData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff1a" vertical={false} />
                <XAxis dataKey="name" stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1E1B4B', borderColor: '#4F46E5', borderRadius: '8px' }}
                  cursor={{ fill: 'transparent' }}
                />
                <Bar dataKey="defaulters" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart */}
        <div className="glass p-6 lg:col-span-1">
          <h3 className="text-lg font-bold text-text-primary mb-4">Overall Today</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: '#1E1B4B', borderColor: '#4F46E5', borderRadius: '8px' }} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="glass p-6 lg:col-span-2">
          <h3 className="text-lg font-bold text-text-primary mb-4">Live Sessions Right Now</h3>
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-center gap-4 p-4 bg-surface-light rounded-lg border border-white/5">
                <div className="w-10 h-10 rounded-full bg-danger/20 flex items-center justify-center flex-shrink-0 animate-pulse">
                  <Radio className="w-5 h-5 text-danger" />
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-medium">CS301 - Data Structures (Sec A)</h4>
                  <p className="text-sm text-text-muted">Prof. Ali Khan • Started 10 mins ago</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold">
                    18 / 45 Present
                  </span>
                </div>
              </div>
            ))}
            {stats.liveSessions === 0 && (
              <div className="text-center p-6 text-text-muted">No live sessions currently running.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="glass p-6 flex items-center justify-between">
      <div>
        <p className="text-text-muted text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-white">{value}</h3>
      </div>
      <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
        {icon}
      </div>
    </div>
  );
}
