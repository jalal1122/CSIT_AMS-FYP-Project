import { ArrowUpRight, ShieldAlert } from "lucide-react";

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
          <h2 className="text-2xl font-bold text-text-primary">Semester Promotions</h2>
          <p className="text-text-muted">Advance batches to their next semester and close the current one</p>
        </div>
      </div>

      <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl flex items-start gap-4">
        <ShieldAlert className="w-6 h-6 text-danger shrink-0 mt-0.5" />
        <div>
          <h4 className="font-medium text-danger">High Impact Action</h4>
          <p className="text-sm text-danger/80 mt-1">
            Promoting a batch permanently closes all current active allocations and live sessions for that batch. 
            Students will be moved to the next semester in the syllabus. This action cannot be easily undone.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {batches.map(batch => (
          <div key={batch.id} className="glass p-6 group relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-accent/10 blur-3xl rounded-full pointer-events-none"></div>
            
            <div className="flex justify-between items-start mb-4">
              <span className="px-3 py-1 bg-surface-light border border-white/10 text-white text-xs font-semibold rounded-full">
                Semester {batch.semester}
              </span>
              <span className="text-xs text-text-muted">{batch.students} Students</span>
            </div>
            
            <h3 className="text-xl font-bold text-white mb-6">{batch.name}</h3>
            
            <div className="flex items-center gap-3">
              <button className="flex-1 bg-gradient-primary text-white py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 hover:opacity-90 shadow-lg shadow-primary/20 transition-all">
                Promote <ArrowUpRight className="w-4 h-4" />
              </button>
              <button className="px-4 py-2.5 text-text-muted hover:text-white bg-surface-light hover:bg-white/10 rounded-lg text-sm font-medium transition-colors opacity-0 group-hover:opacity-100">
                Rollback
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
