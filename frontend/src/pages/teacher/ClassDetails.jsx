import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Edit2, Calendar, FileText } from "lucide-react";

export default function ClassDetails() {
  const { allocationId } = useParams();

  const students = [
    { id: "1", name: "Muhammad Ali", rollNo: "2022-001", present: 22, total: 24 },
    { id: "2", name: "Fatima Khan", rollNo: "2022-002", present: 24, total: 24 },
    { id: "3", name: "Omar Sheikh", rollNo: "2022-003", present: 16, total: 24 }, // Defaulter (<75%)
  ];

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-surface-light border-b border-white/10 p-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Link to="/teacher/dashboard" className="text-text-muted hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Data Structures (CS301)</h1>
            <p className="text-xs text-text-muted">BSIT 2026 • Section A • Sem 3</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass p-6 md:col-span-2">
            <h3 className="text-lg font-bold text-white mb-4">Student Roster</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/10 text-text-muted text-xs uppercase">
                    <th className="pb-3 font-semibold">Student</th>
                    <th className="pb-3 font-semibold text-center">Classes</th>
                    <th className="pb-3 font-semibold">Progress</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {students.map((student) => {
                    const percentage = Math.round((student.present / student.total) * 100);
                    const isDefaulter = percentage < 75;
                    
                    return (
                      <tr key={student.id} className="hover:bg-white/5">
                        <td className="py-4">
                          <div className="font-medium text-white text-sm">{student.name}</div>
                          <div className="text-xs text-text-muted font-mono">{student.rollNo}</div>
                        </td>
                        <td className="py-4 text-center">
                          <span className="text-white font-medium">{student.present}</span>
                          <span className="text-text-muted text-xs">/{student.total}</span>
                        </td>
                        <td className="py-4 w-48">
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-surface-light h-1.5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${isDefaulter ? "bg-danger" : "bg-secondary"}`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className={`text-xs font-bold ${isDefaulter ? "text-danger" : "text-secondary"}`}>
                              {percentage}%
                            </span>
                          </div>
                        </td>
                        <td className="py-4 text-right">
                          <button className="p-1.5 text-text-muted hover:text-white bg-surface-light hover:bg-white/10 rounded">
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

          <div className="glass p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" /> Session History
            </h3>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((_, idx) => (
                <div key={idx} className="p-3 bg-surface-light border border-white/5 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-white">Oct {12 - idx}, 2023</p>
                    <p className="text-xs text-text-muted">Lecture</p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <span className="text-sm text-secondary font-medium bg-secondary/10 px-2 py-0.5 rounded">42/45</span>
                    <button className="text-text-muted hover:text-primary transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              <button className="w-full py-2 border border-white/10 rounded-lg text-sm text-text-muted hover:text-white transition-colors">
                View All Sessions
              </button>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
