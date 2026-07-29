import { ArrowUpRight, ShieldAlert, RotateCcw } from "lucide-react";
import Badge from "../../components/shared/Badge";

export default function Promotion() {
  const batches = [
    { id: "1", name: "BS Information Technology 2026", semester: 3, students: 120 },
    { id: "2", name: "BS Computer Science 2027", semester: 1, students: 180 },
    { id: "3", name: "BS Software Engineering 2024", semester: 7, students: 95 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Semester Promotions</h2>
          <p className="text-slate-500 text-sm mt-1">Advance batches to their next semester and close the current one</p>
        </div>
      </div>

      <div className="p-5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-4">
        <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-rose-800">High Impact Action</h4>
          <p className="text-sm text-rose-700 mt-1.5 leading-relaxed">
            Promoting a batch permanently closes all current active allocations and live sessions for that batch. 
            Students will be moved to the next semester in the syllabus. This action cannot be easily undone.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {batches.map(batch => (
          <div key={batch.id} className="card p-6 group relative overflow-hidden flex flex-col h-full border-slate-200 hover:border-sky-300 hover:shadow-md transition-all">
            {/* Background glow */}
            <div className="absolute -right-12 -top-12 w-40 h-40 bg-sky-100/50 blur-3xl rounded-full pointer-events-none transition-opacity opacity-0 group-hover:opacity-100"></div>
            
            <div className="flex justify-between items-start mb-6">
              <span className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-full shadow-sm">
                Semester {batch.semester}
              </span>
              <Badge variant="neutral">{batch.students} Students</Badge>
            </div>
            
            <h3 className="text-xl font-bold text-slate-800 mb-8 flex-1 pr-4">{batch.name}</h3>
            
            <div className="flex items-center gap-3 mt-auto">
              <button className="flex-1 btn-primary py-2.5 font-semibold flex items-center justify-center gap-2">
                Promote <ArrowUpRight className="w-4 h-4" />
              </button>
              <button className="px-4 py-2.5 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-sm font-semibold transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-2" title="Rollback Promotion">
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
