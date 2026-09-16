import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from "recharts";
import StatCard from "../../components/shared/StatCard";
import Badge from "../../components/shared/Badge";
import { fetchDashboardStats } from "../../store/slices/analyticsSlice";

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { dashboardStats, isLoading } = useSelector(state => state.analytics);

  useEffect(() => {
    dispatch(fetchDashboardStats());
    const interval = setInterval(() => {
      dispatch(fetchDashboardStats());
    }, 30000);
    return () => clearInterval(interval);
  }, [dispatch]);

  const totalStudents = dashboardStats?.totalStudents || 0;
  const totalTeachers = dashboardStats?.totalTeachers || 0;
  const totalAcademicUsers = totalStudents + totalTeachers;

  const stats = [
    { label: "Total Users",      value: totalAcademicUsers, gradient: "from-slate-700 to-slate-900" },
    { label: "Total Allocations",value: dashboardStats?.totalAllocations || 0, gradient: "from-sky-400 to-sky-600" },
    { label: "Students",         value: totalStudents, gradient: "from-emerald-400 to-emerald-600" },
    { label: "Teachers",         value: totalTeachers, gradient: "from-violet-400 to-violet-600" },
    { label: "Active Batches",   value: dashboardStats?.activeBatches || 0,     gradient: "from-fuchsia-400 to-fuchsia-600" },
    { label: "Active Sessions",  value: dashboardStats?.activeSessions || 0,    gradient: "from-amber-400 to-amber-600" },
  ];

  const hasUsers = totalAcademicUsers > 0;
  const pieData = hasUsers
    ? [
        { name: "Students", value: totalStudents },
        { name: "Teachers", value: totalTeachers },
      ]
    : [{ name: "No Users", value: 1 }];

  const PIE_COLORS = hasUsers ? ['#10B981', '#0EA5E9'] : ['#E2E8F0'];

  const barData = (dashboardStats?.batchStudentCounts || []).map(b => ({
    name: b.name,
    students: b.studentCount
  }));

  const recentClasses = (dashboardStats?.recentSessions || []).map(s => ({
    id: s._id,
    name: s.allocationId?.subjectId?.name || "Subject",
    batch: s.allocationId?.batchId?.name || "Batch",
    teacher: s.teacherId?.name || "Teacher",
    status: s.active ? "Active" : "Completed"
  }));

  const formatUptime = (seconds) => {
    if (!seconds) return "0s";
    const d = Math.floor(seconds / (3600*24));
    const h = Math.floor(seconds % (3600*24) / 3600);
    return `${d}d ${h}h`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Admin Dashboard</h2>
          <p className="text-slate-500 text-sm mt-1">System overview and real-time management</p>
        </div>
        <div className="text-xs text-slate-400 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> Live Updates
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">Loading real-time stats...</div>
      ) : (
        <>
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
                  <span className="text-xl font-bold text-slate-800">{totalAcademicUsers}</span>
                </div>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="text-sm text-slate-600">Students ({totalStudents})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-sky-500"></div>
                  <span className="text-sm text-slate-600">Teachers ({totalTeachers})</span>
                </div>
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
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Recent System Activity</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-sky-50/50 border-b border-slate-100 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                      <th className="px-6 py-3">Item</th>
                      <th className="px-6 py-3">Detail</th>
                      <th className="px-6 py-3">Source</th>
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
                    <span className="text-slate-800 font-bold">{dashboardStats?.systemHealth?.cpuUsage || 0}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-500 rounded-full" style={{ width: `${dashboardStats?.systemHealth?.cpuUsage || 0}%` }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600 font-medium">Memory Usage</span>
                    <span className="text-slate-800 font-bold">{dashboardStats?.systemHealth?.memoryUsage || 0}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-500 rounded-full" style={{ width: `${dashboardStats?.systemHealth?.memoryUsage || 0}%` }}></div>
                  </div>
                </div>
                
                <div>
                  {(() => {
                    const uptime = dashboardStats?.systemHealth?.uptimeSeconds || 0;
                    const maxUptime = 2592000; // 30 days in seconds
                    const percentage = Math.min((uptime / maxUptime) * 100, 100).toFixed(2);
                    return (
                      <>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-slate-600 font-medium">Server Uptime (30d)</span>
                          <span className="text-slate-800 font-bold">{percentage}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-sky-500 rounded-full" style={{ width: `${percentage}%` }}></div>
                        </div>
                      </>
                    );
                  })()}
                  <p className="text-xs text-right text-slate-400 mt-2">{formatUptime(dashboardStats?.systemHealth?.uptimeSeconds)}</p>
                </div>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
