import { useState } from "react";
import { Check, ClipboardList, AlertTriangle, AlertCircle } from "lucide-react";
import EmptyState from "../../components/shared/EmptyState";
import Badge from "../../components/shared/Badge";

export default function Allocation() {
  const [selectedBatch, setSelectedBatch] = useState("");
  
  const batches = [
    { id: "1", name: "BS Information Technology 2026", semester: 3 },
    { id: "2", name: "BS Computer Science 2027", semester: 1 },
  ];

  const subjects = [
    { id: "s1", code: "CS301", name: "Data Structures", credits: 4, sections: ["A", "B", "C"] },
    { id: "s2", code: "MTH202", name: "Linear Algebra", credits: 3, sections: ["A", "B", "C"] },
  ];

  const teachers = [
    { id: "t1", name: "Dr. Ali Khan" },
    { id: "t2", name: "Prof. Sarah" },
    { id: "t3", name: "Engr. Usman" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Course Allocations</h2>
          <p className="text-slate-500 text-sm mt-1">Assign teachers to specific sections for the active semester</p>
        </div>
        <button className="btn-primary flex items-center gap-2 whitespace-nowrap">
          <Check className="w-4 h-4" /> Save Allocations
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        
        {/* Panel 1: Batch Selector */}
        <div className="xl:col-span-1 card p-6 sticky top-6">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-sky-500" /> Target Batch
          </h3>
          <select 
            className="input w-full cursor-pointer shadow-sm"
            value={selectedBatch}
            onChange={e => setSelectedBatch(e.target.value)}
          >
            <option value="">Select a batch...</option>
            {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          
          {selectedBatch && (
            <div className="mt-6 p-4 bg-sky-50 border border-sky-100 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sky-800 font-semibold text-sm">Semester 3</span>
                <Badge variant="info">Active</Badge>
              </div>
              <p className="text-xs text-sky-700 leading-relaxed">
                Found <strong>5 subjects</strong> in curriculum. <strong>120 total students</strong> across 3 sections.
              </p>
            </div>
          )}
        </div>

        {/* Panel 2 & 3: Subjects & Sections */}
        <div className="xl:col-span-3 card p-0 overflow-hidden min-h-[500px]">
          {!selectedBatch ? (
            <div className="h-[500px] flex items-center justify-center">
              <EmptyState 
                icon={ClipboardList} 
                title="No Batch Selected" 
                subtitle="Please select a batch from the sidebar to load its curriculum and begin allocation." 
              />
            </div>
          ) : (
            <div className="p-6 space-y-8 bg-slate-50/50">
              {subjects.map(subject => (
                <div key={subject.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-100 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg">{subject.name}</h4>
                      <p className="text-sm text-slate-500 font-mono mt-0.5"><span className="text-sky-600 font-semibold">{subject.code}</span> • {subject.credits} Credit Hours</p>
                    </div>
                  </div>
                  
                  <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {subject.sections.map(section => (
                      <div key={`${subject.id}-${section}`} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative group">
                        <div className="flex justify-between items-center mb-4">
                          <span className="font-bold text-slate-800 text-lg">Section {section}</span>
                          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">40 Students</span>
                        </div>
                        <div className="relative">
                          <select className="input w-full cursor-pointer appearance-none bg-slate-50 border-slate-200 focus:bg-white text-sm">
                            <option value="">Unassigned</option>
                            {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
