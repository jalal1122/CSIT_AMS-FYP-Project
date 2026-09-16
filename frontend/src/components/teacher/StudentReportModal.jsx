import { useState, useEffect } from "react";
import { X, Download, FileText, CheckCircle2, XCircle } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

export default function StudentReportModal({ isOpen, onClose, allocationId, sectionName, studentId }) {
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && studentId) {
      fetchReport();
    }
  }, [isOpen, studentId]);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/api/v2/academic/teacher/class/${allocationId}/${sectionName}/student/${studentId}/report`);
      setReportData(res.data.data);
    } catch (error) {
      toast.error("Failed to load student report");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!reportData) return;
    
    let csvData = `Student Report\n`;
    csvData += `Name,${reportData.student.name}\n`;
    csvData += `Roll No,${reportData.student.rollNo}\n`;
    csvData += `Subject,${reportData.subject.name} (${reportData.subject.code})\n`;
    csvData += `Total Sessions,${reportData.summary.total}\n`;
    csvData += `Present,${reportData.summary.present}\n`;
    csvData += `Attendance,${reportData.summary.total > 0 ? Math.round((reportData.summary.present / reportData.summary.total) * 100) : 0}%\n\n`;
    
    csvData += "Date,Type,Status\n";
    const rows = reportData.history.map(s => `${s.date},${s.type},${s.status}`);
    
    csvData += rows.join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + encodeURI(csvData);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `${reportData.student.rollNo}_${reportData.subject.code}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-3.5 sm:p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-slate-800 truncate">Student Report</h2>
              <p className="text-xs sm:text-sm font-medium text-slate-500 truncate">Detailed attendance history</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-6 flex-1 overflow-y-auto min-h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-slate-500 font-medium">Loading report...</div>
          ) : reportData ? (
            <div className="space-y-4 sm:space-y-6">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 sm:p-4 bg-sky-50 rounded-xl border border-sky-100 gap-3 sm:gap-4">
                <div className="min-w-0">
                  <h3 className="font-bold text-base sm:text-lg text-sky-900 truncate">{reportData.student.name}</h3>
                  <p className="text-xs sm:text-sm font-semibold text-sky-700 font-mono">{reportData.student.rollNo}</p>
                </div>
                <div className="flex items-center flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm font-bold bg-white px-3 sm:px-4 py-2 rounded-lg shadow-sm w-full sm:w-auto justify-between sm:justify-start">
                  <div className="text-emerald-600">Present: {reportData.summary.present}</div>
                  <div className="w-px h-4 bg-slate-200"></div>
                  <div className="text-slate-600">Total: {reportData.summary.total}</div>
                  <div className="w-px h-4 bg-slate-200"></div>
                  <div className={`${(reportData.summary.total > 0 && (reportData.summary.present/reportData.summary.total) >= 0.75) ? "text-emerald-600" : "text-rose-600"}`}>
                    {reportData.summary.total > 0 ? Math.round((reportData.summary.present / reportData.summary.total) * 100) : 0}%
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 w-full">
                <table className="w-full text-left min-w-[340px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-semibold">
                      <th className="px-3 sm:px-4 py-2.5 sm:py-3">Date</th>
                      <th className="px-3 sm:px-4 py-2.5 sm:py-3">Type</th>
                      <th className="px-3 sm:px-4 py-2.5 sm:py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportData.history.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="px-4 py-8 text-center text-slate-500 font-medium text-sm">No sessions found.</td>
                      </tr>
                    ) : reportData.history.map((sess) => (
                      <tr key={sess.sessionId} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 sm:px-4 py-2.5 sm:py-3 font-medium text-slate-800 text-xs sm:text-sm">{sess.date}</td>
                        <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-slate-600 text-xs sm:text-sm">{sess.type}</td>
                        <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm">
                          {sess.status === "Present" ? (
                            <span className="flex items-center gap-1 sm:gap-1.5 text-emerald-600 font-bold bg-emerald-50 px-2 sm:px-2.5 py-1 rounded-md w-fit">
                              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Present
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 sm:gap-1.5 text-rose-600 font-bold bg-rose-50 px-2 sm:px-2.5 py-1 rounded-md w-fit">
                              <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Absent
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          ) : (
             <div className="flex items-center justify-center h-full text-rose-500 font-medium">Failed to load data.</div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
          <button 
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-sm"
          >
            Close
          </button>
          <button 
            onClick={handleExportCSV}
            disabled={!reportData || reportData.history.length === 0}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 font-bold text-white bg-sky-500 rounded-lg hover:bg-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>

      </div>
    </div>
  );
}
