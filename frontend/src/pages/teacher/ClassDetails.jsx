import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft, Edit2, Calendar, FileText, AlertTriangle } from "lucide-react";
import Badge from "../../components/shared/Badge";
import api from "../../services/api";
import toast from "react-hot-toast";
import { fetchClassDetails, clearClassDetails } from "../../store/slices/teacherSlice";
import StudentReportModal from "../../components/teacher/StudentReportModal";
import RetroactiveSessionModal from "../../components/teacher/RetroactiveSessionModal";
import { formatPKTDate } from "../../utils/dateUtils";

export default function ClassDetails() {
  const { allocationId, sectionName } = useParams();
  const dispatch = useDispatch();
  const { classDetails, isLoading, error } = useSelector(state => state.teacher);

  const [localSessions, setLocalSessions] = useState([]);
  const [skip, setSkip] = useState(10);
  const [hasMore, setHasMore] = useState(true);
  const [reportStudentId, setReportStudentId] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isRetroModalOpen, setIsRetroModalOpen] = useState(false);
  
  useEffect(() => {
    dispatch(fetchClassDetails({ allocationId, sectionName }));
    return () => {
      dispatch(clearClassDetails());
    };
  }, [dispatch, allocationId, sectionName]);
  
  useEffect(() => {
    const sessions = classDetails?.sessions || [];
    if (sessions.length > 0 && localSessions.length === 0) {
      setLocalSessions(sessions);
      setSkip(10);
      setHasMore(sessions.length === 10);
    }
  }, [classDetails, localSessions.length]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50">Loading class details...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="text-red-500 mb-4"><AlertTriangle className="w-12 h-12" /></div>
        <h2 className="text-xl font-bold text-slate-800">Failed to load class details</h2>
        <p className="text-slate-500 mt-2">{error}</p>
        <Link to="/teacher/dashboard" className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  if (!classDetails) {
    return null; // Or some fallback
  }

  const { subject, batch, section, semester, students, sessions = [] } = classDetails;

  const loadMoreSessions = async () => {
    try {
      const res = await api.get(`/api/v2/academic/teacher/class/${allocationId}/${sectionName}/sessions?skip=${skip}&limit=10`);
      const newSessions = res.data.data.sessions;
      setLocalSessions(prev => [...prev, ...newSessions]);
      setSkip(prev => prev + newSessions.length);
      setHasMore(res.data.data.hasMore);
    } catch (error) {
      toast.error("Failed to load more sessions");
    }
  };

  const handleExportCSV = () => {
    let csvData = `Class,${subject?.name} (${subject?.code})\n`;
    csvData += `Batch,${batch?.name}\n`;
    csvData += `Section,${section}\n`;
    csvData += `Semester,${semester}\n`;
    csvData += `Export Date,${formatPKTDate(new Date())}\n\n`;
    
    // Extract unique dates from the sessions
    const uniqueDates = [];
    if (sessions && sessions.length > 0) {
      sessions.forEach(sess => {
        if (sess.date) {
          uniqueDates.push(sess.date);
        }
      });
    }

    // Header row
    const baseHeaders = ["Roll No", "Name", "Present", "Total", "Percentage"];
    csvData += [...baseHeaders, ...uniqueDates].join(",") + "\n";
    
    const rows = students.map(s => {
      const percentage = s.total > 0 ? Math.round((s.present / s.total) * 100) : 0;
      let rowArray = [s.rollNo, s.name, s.present, s.total, `${percentage}%`];
      
      // If we have sessionRecords, match them by index (since uniqueDates maps to the same sessions array order)
      if (s.sessionRecords && s.sessionRecords.length > 0) {
        // sessions are sorted by descending time, but uniqueDates are in that exact order
        s.sessionRecords.forEach(record => {
          let marker = "A";
          if (["Present", "Present (Manual)", "Late"].includes(record.status)) marker = "P";
          else if (record.status === "Leave") marker = "L";
          rowArray.push(marker);
        });
      }
      
      return rowArray.join(",");
    });
    
    csvData += rows.join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + encodeURI(csvData);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `${subject?.code}_${batch?.name}_Sec${section}_Roster.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <main className="max-w-7xl mx-auto w-full p-3 sm:p-4 md:p-8 space-y-4 sm:space-y-6 flex-1">
        <div className="mb-2 sm:mb-4 flex items-center gap-3 sm:gap-4 min-w-0">
          <Link to="/teacher/dashboard" className="p-1.5 sm:p-2 -ml-1 sm:-ml-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-200 shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight truncate">{subject?.name}</h1>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5 truncate">{batch?.name} - Section {section}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 items-start">
          <div className="card p-0 overflow-hidden xl:col-span-2">
            <div className="px-3.5 sm:px-6 py-3 sm:py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center flex-wrap gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-800">Student Roster</h3>
              <button 
                onClick={handleExportCSV}
                className="text-xs font-semibold text-sky-600 bg-sky-50 border border-sky-200 px-2.5 sm:px-3 py-1.5 rounded-lg hover:bg-sky-100 transition-colors shadow-sm"
              >
                Export CSV
              </button>
            </div>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left min-w-[480px]">
                <thead>
                  <tr className="bg-white border-b border-slate-100 text-slate-500 text-xs uppercase font-semibold">
                    <th className="px-3.5 sm:px-6 py-3 sm:py-4">Student</th>
                    <th className="px-3.5 sm:px-6 py-3 sm:py-4 text-center">Classes</th>
                    <th className="px-3.5 sm:px-6 py-3 sm:py-4">Progress</th>
                    <th className="px-3.5 sm:px-6 py-3 sm:py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((student, index) => {
                    const percentage = student.total > 0 ? Math.round((student.present / student.total) * 100) : 0;
                    const isDefaulter = student.total > 0 && percentage < 75;
                    
                    return (
                      <tr key={student._id || student.id || index} className="hover:bg-slate-50 transition-colors bg-white">
                        <td className="px-3.5 sm:px-6 py-3 sm:py-4">
                          <div className="font-bold text-slate-800 text-sm">{student.name}</div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5"><span className="font-semibold text-slate-600">{student.rollNo}</span></div>
                        </td>
                        <td className="px-3.5 sm:px-6 py-3 sm:py-4 text-center">
                          <span className="text-slate-800 font-bold">{student.present}</span>
                          <span className="text-slate-400 text-xs font-medium">/{student.total}</span>
                        </td>
                        <td className="px-3.5 sm:px-6 py-3 sm:py-4 w-32 sm:w-48">
                          <div className="flex items-center gap-3">
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden shadow-inner">
                               <div 
                                className={`h-full rounded-full ${isDefaulter ? "bg-rose-500" : "bg-emerald-500"}`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className={`text-xs font-bold w-10 text-right ${isDefaulter ? "text-rose-600" : "text-emerald-600"}`}>
                              {percentage}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => {
                                setReportStudentId(student.id);
                                setIsReportModalOpen(true);
                              }}
                              className="p-2 text-slate-400 hover:text-sky-500 bg-slate-50 hover:bg-sky-50 border border-slate-100 hover:border-sky-200 rounded-lg transition-colors shadow-sm" 
                              title="View Report"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card p-0 xl:col-span-1 border-sky-100 shadow-md">
            <div className="px-6 py-4 border-b border-sky-100 bg-sky-50/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-sky-500" /> 
                <h3 className="text-lg font-bold text-sky-900">Session History</h3>
              </div>
              <button 
                onClick={() => setIsRetroModalOpen(true)}
                className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors shadow-sm"
              >
                + Add Session
              </button>
            </div>
            <div className="p-6 space-y-4 bg-white">
              {localSessions.length === 0 ? (
                <div className="text-center p-4 text-slate-400 text-sm font-medium border border-dashed border-slate-200 rounded-xl bg-slate-50">
                  No sessions recorded yet.
                </div>
              ) : localSessions.map((sess) => (
                <Link 
                  key={sess._id} 
                  to={`/teacher/class/${allocationId}/${sectionName}?session=${sess._id}`}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center shadow-sm hover:border-sky-300 hover:bg-sky-50 transition-colors block"
                >
                  <div>
                    <p className="text-sm font-bold text-slate-700">{sess.date}</p>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">{sess.type}</p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <span className="text-sm text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">{sess.present}/{sess.total}</span>
                  </div>
                </Link>
              ))}
              <Link 
                to={`/teacher/class/${allocationId}/${sectionName}/history`}
                className="block w-full text-center py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-sm font-semibold text-slate-500 hover:text-sky-600 hover:border-sky-300 hover:bg-sky-50 transition-all"
              >
                View Full History
              </Link>
            </div>
          </div>
        </div>

      </main>

      <StudentReportModal 
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        allocationId={allocationId}
        sectionName={sectionName}
        studentId={reportStudentId}
      />

      <RetroactiveSessionModal 
        isOpen={isRetroModalOpen}
        onClose={() => setIsRetroModalOpen(false)}
        allocationId={allocationId}
        sectionName={sectionName}
        students={students}
        onSuccess={() => {
          dispatch(fetchClassDetails({ allocationId, sectionName }));
          // Note: The UI will automatically update via Redux state
        }}
      />
    </div>
  );
}
