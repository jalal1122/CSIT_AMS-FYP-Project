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
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Student Report</h2>
              <p className="text-sm font-medium text-slate-500">Detailed attendance history</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto min-h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-slate-500 font-medium">Loading report...</div>
          ) : reportData ? (
            <div className="space-y-6">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-sky-50 rounded-xl border border-sky-100 gap-4">
                <div>
                  <h3 className="font-bold text-lg text-sky-900">{reportData.student.name}</h3>
                  <p className="text-sm font-semibold text-sky-700 font-mono">{reportData.student.rollNo}</p>
                </div>
                <div className="flex items-center gap-4 text-sm font-bold bg-white px-4 py-2 rounded-lg shadow-sm">
                  <div className="text-emerald-600">Present: {reportData.summary.present}</div>
                  <div className="w-px h-4 bg-slate-200"></div>
                  <div className="text-slate-600">Total: {reportData.summary.total}</div>
                  <div className="w-px h-4 bg-slate-200"></div>
                  <div className={`${(reportData.summary.present/reportData.summary.total) >= 0.75 ? "text-emerald-600" : "text-rose-600"}`}>
                    {reportData.summary.total > 0 ? Math.round((reportData.summary.present / reportData.summary.total) * 100) : 0}%
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-semibold">
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportData.history.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="px-4 py-8 text-center text-slate-500 font-medium text-sm">No sessions found.</td>
                      </tr>
                    ) : reportData.history.map((sess) => (
                      <tr key={sess.sessionId} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-800 text-sm">{sess.date}</td>
                        <td className="px-4 py-3 text-slate-600 text-sm">{sess.type}</td>
                        <td className="px-4 py-3 text-sm">
                          {sess.status === "Present" ? (
                            <span className="flex items-center gap-1.5 text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-md w-fit">
                              <CheckCircle2 className="w-4 h-4" /> Present
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-rose-600 font-bold bg-rose-50 px-2.5 py-1 rounded-md w-fit">
                              <XCircle className="w-4 h-4" /> Absent
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
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
          <button 
            onClick={handleExportCSV}
            disabled={!reportData || reportData.history.length === 0}
            className="flex items-center gap-2 px-4 py-2 font-bold text-white bg-sky-500 rounded-lg hover:bg-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>

      </div>
    </div>
  );
}
