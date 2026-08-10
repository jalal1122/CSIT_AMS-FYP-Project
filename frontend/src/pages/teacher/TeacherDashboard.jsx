import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Users, Clock, PlayCircle, History, Filter, Download, FileSpreadsheet, Calendar, Eye } from "lucide-react";
import StartSessionModal from "../../components/teacher/StartSessionModal";
import SessionDetailsModal from "../../components/teacher/SessionDetailsModal";
import Badge from "../../components/shared/Badge";
import EmptyState from "../../components/shared/EmptyState";
import NotificationCenter from "../../components/layout/NotificationCenter";
import { fetchTeacherDashboard, fetchTeacherHistory } from "../../store/slices/teacherSlice";
import { startLiveSession, refreshQrToken } from "../../store/slices/sessionSlice";
import { exportV2Report } from "../../store/slices/analyticsSlice";
import { addToast } from "../../store/slices/toastSlice";
import api from "../../services/api";

export default function TeacherDashboard() {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { activeAllocations, pastClasses, isLoading } = useSelector(state => state.teacher);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("active");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState(null);
  
  // Details Modal State
  const [selectedHistorySession, setSelectedHistorySession] = useState(null);
  const [sessionDetails, setSessionDetails] = useState([]);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);

  const [reportAllocationId, setReportAllocationId] = useState("");
  const [reportStartDate, setReportStartDate] = useState("");
  const [reportEndDate, setReportEndDate] = useState("");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterSection, setFilterSection] = useState("");

  const filteredPastClasses = pastClasses.filter(session => {
    const matchesSearch = session.subject?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          session.section?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = filterSubject ? session.subject === filterSubject : true;
    const matchesSection = filterSection ? session.section === filterSection : true;
    return matchesSearch && matchesSubject && matchesSection;
  });

  useEffect(() => {
    dispatch(fetchTeacherDashboard());
    dispatch(fetchTeacherHistory());
  }, [dispatch]);

  const handleViewDetails = async (session) => {
    setSelectedHistorySession(session);
    setSessionDetails([]);
    setIsDetailsLoading(true);
    try {
      const res = await api.get(`/api/v2/session/${session._id}/details`);
      setSessionDetails(res.data.data.details || res.data.data || []);
    } catch (err) {
      dispatch(addToast({ title: "Error", message: "Failed to load session details", type: "error" }));
    } finally {
      setIsDetailsLoading(false);
    }
  };

  const closeDetailsModal = () => {
    setSelectedHistorySession(null);
    setSessionDetails([]);
  };

  const handleOpenModal = (alloc) => {
    setSelectedAllocation(alloc);
    setIsModalOpen(true);
  };

  const handleStartSession = async (settings) => {
    try {
      const res = await dispatch(startLiveSession({
        allocationId: selectedAllocation._id,
        sectionName: selectedAllocation.sectionName || selectedAllocation.section,
        type: settings.type,
        latitude: settings.latitude,
        longitude: settings.longitude,
        securityConfig: {
          radius: settings.radius,
          manualApproval: settings.manualApproval,
          ipMatchEnabled: settings.ipMatchEnabled,
          deviceLockEnabled: settings.deviceLockEnabled,
          qrRefreshRate: settings.qrRefreshRate
        }
      })).unwrap();
      setIsModalOpen(false);
      // Fetch first QR token immediately after session is created
      await dispatch(refreshQrToken(res._id));
      navigate(`/teacher/session/live/${res._id}`);
    } catch (err) {
      dispatch(addToast({ title: "Error", message: err || "Failed to start session", type: "error" }));
    }
  };

  const handleExport = (format) => {
    if (!reportAllocationId) {
      dispatch(addToast({ title: "Warning", message: "Please select a class to export.", type: "warning" }));
      return;
    }
    const alloc = activeAllocations.find(a => a._id === reportAllocationId);
    if (!alloc) return;

    dispatch(exportV2Report({
      target: "universal",
      filters: { 
         allocationId: alloc._id,
         startDate: reportStartDate,
         endDate: reportEndDate
      },
      format
    }));
  };

  if (isLoading && activeAllocations.length === 0) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50">Loading dashboard...</div>;
  }

  return (
    <div className="flex flex-col">

      <main className="max-w-7xl mx-auto w-full p-4 md:p-8 space-y-8 flex-1">
        
        {/* Tabs */}
        <div className="flex space-x-2 border-b border-slate-200">
          <button
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "active" 
                ? "border-sky-500 text-sky-600" 
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
            onClick={() => setActiveTab("active")}
          >
            <PlayCircle className="w-4 h-4" /> Active Classes
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "past" 
                ? "border-sky-500 text-sky-600" 
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
            onClick={() => setActiveTab("past")}
          >
            <History className="w-4 h-4" /> History & Reports
          </button>
        </div>

        {activeTab === "active" && (
          activeAllocations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeAllocations.map(alloc => (
                <div key={`${alloc._id}-${alloc.section}`} className="card p-6 group relative overflow-hidden flex flex-col h-full border-slate-200 hover:border-sky-300 hover:shadow-md transition-all">
                  <div className="absolute -right-12 -top-12 w-32 h-32 bg-sky-100/50 blur-3xl rounded-full pointer-events-none group-hover:bg-sky-200/50 transition-colors"></div>
                  
                  <div className="flex justify-between items-start mb-6">
                    <span className="font-mono text-xs font-bold text-sky-700 bg-sky-100 border border-sky-200 px-2.5 py-1 rounded">
                      {alloc.subjectCode}
                    </span>
                    <Badge variant="neutral">Sem {alloc.semester}</Badge>
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-800 mb-1">{alloc.subjectName}</h3>
                  <p className="text-sm font-medium text-slate-500 mb-6">{alloc.batch} • Section {alloc.section}</p>
                  
                  <div className="flex items-center gap-4 mb-8">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                      <Users className="w-4 h-4 text-slate-400" /> {alloc.students}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                      <Clock className="w-4 h-4 text-slate-400" /> {alloc.creditHours || 3} Cr
                    </div>
                  </div>

                  <div className="mt-auto">
                    <button 
                      onClick={() => handleOpenModal(alloc)}
                      className="w-full btn-success py-3 flex items-center justify-center gap-2"
                    >
                      Start Live Session <PlayCircle className="w-5 h-5" />
                    </button>
                    <Link to={`/teacher/class/${alloc._id}/${alloc.section}`} className="block text-center mt-4 text-sm font-semibold text-sky-600 hover:text-sky-700 transition-colors">
                      View Roster & Stats
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-0">
              <EmptyState 
                icon={PlayCircle} 
                title="No Active Classes" 
                subtitle="You currently have no classes assigned for the active semester." 
              />
            </div>
          )
        )}

        {activeTab === "past" && (
          <div className="space-y-6">
            {/* Export Section */}
            <div className="card p-5 border-sky-200 bg-sky-50/30">
              <div className="flex items-center gap-2 mb-4">
                <FileSpreadsheet className="w-5 h-5 text-sky-600" />
                <h3 className="font-bold text-sky-900">Export Class Reports</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Select Class</label>
                  <select 
                    className="input cursor-pointer py-2.5 w-full bg-white"
                    value={reportAllocationId}
                    onChange={(e) => setReportAllocationId(e.target.value)}
                  >
                    <option value="">Choose a class to export...</option>
                    {activeAllocations.map(alloc => (
                      <option key={alloc._id} value={alloc._id}>
                        {alloc.subjectName} ({alloc.batch} - Sec {alloc.section})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Start Date</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input 
                      type="date" 
                      className="input pl-10 py-2.5 w-full bg-white"
                      value={reportStartDate}
                      onChange={(e) => setReportStartDate(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">End Date</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input 
                      type="date" 
                      className="input pl-10 py-2.5 w-full bg-white"
                      value={reportEndDate}
                      onChange={(e) => setReportEndDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleExport("xlsx")}
                    className="btn-primary py-2.5 flex-1 flex justify-center items-center gap-2"
                    title="Export Excel"
                  >
                    <FileSpreadsheet className="w-4 h-4" /> Excel
                  </button>
                </div>
              </div>
            </div>

            <div className="card p-0 overflow-hidden">
              <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Filter className="w-4 h-4" /> 
                    <span className="text-sm font-semibold text-slate-700">Filter History:</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <input 
                      type="text" 
                      placeholder="Search sessions..." 
                      className="input py-2 text-sm max-w-[200px]"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <select 
                      className="input py-2 text-sm"
                      value={filterSubject}
                      onChange={(e) => setFilterSubject(e.target.value)}
                    >
                      <option value="">All Subjects</option>
                      {[...new Set(pastClasses.map(s => s.subject))].map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                    <select 
                      className="input py-2 text-sm"
                      value={filterSection}
                      onChange={(e) => setFilterSection(e.target.value)}
                    >
                      <option value="">All Sections</option>
                      {[...new Set(pastClasses.map(s => s.section))].map(sec => (
                        <option key={sec} value={sec}>Section {sec}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-white border-b border-slate-200 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Subject & Section</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Attendance</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredPastClasses.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-0">
                          <EmptyState 
                            icon={History} 
                            title="No Past Classes" 
                            subtitle={searchQuery || filterSubject || filterSection ? "No history matches your filters." : "You have no recorded class history yet."} 
                          />
                        </td>
                      </tr>
                    ) : (
                      filteredPastClasses.map((session) => (
                        <tr key={session._id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-slate-700 text-sm font-medium">{session.date}</td>
                          <td className="px-6 py-4">
                            <div className="text-slate-800 font-semibold text-sm">{session.subject}</div>
                            <div className="text-xs text-slate-500 mt-0.5">Section {session.section}</div>
                          </td>
                        <td className="px-6 py-4 text-sm text-slate-600 font-medium">{session.type}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-slate-800 font-bold">{session.present}</span>
                            <span className="text-slate-400 font-medium">/ {session.total}</span>
                            <span className={`text-xs px-2 py-0.5 rounded ml-2 font-bold ${
                              (session.present/session.total) >= 0.75 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}>
                              {Math.round((session.present/session.total)*100)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-3 items-center">
                            <button 
                              onClick={() => handleViewDetails(session)}
                              className="px-3 py-1.5 text-xs font-semibold text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-md transition-colors flex items-center gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5" /> View Details
                            </button>
                            <Link 
                              to={`/teacher/class/${session.allocationId}/${session.section}/history`}
                              className="text-xs text-slate-400 hover:text-slate-600 font-semibold transition-colors flex items-center gap-1"
                              title="Full Class History"
                            >
                              <History className="w-3.5 h-3.5" /> All
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      <StartSessionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onStart={handleStartSession}
        className={selectedAllocation ? `${selectedAllocation.subjectCode} - ${selectedAllocation.subjectName}` : ""}
      />

      <SessionDetailsModal 
        isOpen={!!selectedHistorySession} 
        onClose={closeDetailsModal} 
        isLoading={isDetailsLoading} 
        sessionDetails={sessionDetails} 
      />
    </div>
  );
}
