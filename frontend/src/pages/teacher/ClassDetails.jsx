import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Edit2, Calendar, FileText } from "lucide-react";
import Badge from "../../components/shared/Badge";

export default function ClassDetails() {
  const { allocationId } = useParams();

  const students = [
    { id: "1", name: "Muhammad Ali", rollNo: "2022-001", present: 22, total: 24 },
    { id: "2", name: "Fatima Khan", rollNo: "2022-002", present: 24, total: 24 },
    { id: "3", name: "Omar Sheikh", rollNo: "2022-003", present: 16, total: 24 }, // Defaulter (<75%)
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Link to="/teacher/dashboard" className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Data Structures (CS301)</h1>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">BSIT 2026 • Section A • Sem 3</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          <div className="card p-0 overflow-hidden xl:col-span-2">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800">Student Roster</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white border-b border-slate-100 text-slate-500 text-xs uppercase font-semibold">
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4 text-center">Classes</th>
                    <th className="px-6 py-4">Progress</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((student) => {
                    const percentage = Math.round((student.present / student.total) * 100);
                    const isDefaulter = percentage < 75;
                    
                    return (
                      <tr key={student.id} className="hover:bg-slate-50 transition-colors bg-white">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800 text-sm">{student.name}</div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5"><span className="font-semibold text-slate-600">{student.rollNo}</span></div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-slate-800 font-bold">{student.present}</span>
                          <span className="text-slate-400 text-xs font-medium">/{student.total}</span>
                        </td>
                        <td className="px-6 py-4 w-48">
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
                          <button className="p-2 text-slate-400 hover:text-sky-500 bg-slate-50 hover:bg-sky-50 border border-slate-100 hover:border-sky-200 rounded-lg transition-colors shadow-sm" title="View Report">
                            <FileText className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card p-0 xl:col-span-1 border-sky-100 shadow-md">
            <div className="px-6 py-4 border-b border-sky-100 bg-sky-50/50 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-sky-500" /> 
              <h3 className="text-lg font-bold text-sky-900">Session History</h3>
            </div>
            <div className="p-6 space-y-4 bg-white">
              {[1, 2, 3, 4, 5].map((_, idx) => (
                <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center shadow-sm">
                  <div>
                    <p className="text-sm font-bold text-slate-700">Oct {12 - idx}, 2023</p>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">Lecture</p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <span className="text-sm text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">42/45</span>
                    <button className="text-slate-400 hover:text-sky-500 transition-colors p-1" title="Edit Session">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              <button className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-sm font-semibold text-slate-500 hover:text-sky-600 hover:border-sky-300 hover:bg-sky-50 transition-all">
                View All Sessions
              </button>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
