import { useState } from "react";
import { Check, ClipboardList, AlertTriangle } from "lucide-react";

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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Course Allocations</h2>
          <p className="text-text-muted">Assign teachers to specific sections for the active semester</p>
        </div>
        <button className="bg-gradient-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-90">
          <Check className="w-4 h-4" /> Save Allocations
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Panel 1: Batch Selector */}
        <div className="lg:col-span-1 glass p-6 h-fit">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" /> Target Batch
          </h3>
          <select 
            className="w-full bg-surface-light border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-primary mb-4"
            value={selectedBatch}
            onChange={e => setSelectedBatch(e.target.value)}
          >
            <option value="">Select a batch...</option>
            {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          
          {selectedBatch && (
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg text-primary">
              <p className="font-medium text-sm">Semester 3</p>
              <p className="text-xs opacity-80 mt-1">Found 5 subjects in curriculum. 120 total students across 3 sections.</p>
            </div>
          )}
        </div>

        {/* Panel 2 & 3: Subjects & Sections */}
        <div className="lg:col-span-3 glass p-6 min-h-[500px]">
          {!selectedBatch ? (
            <div className="h-full flex flex-col items-center justify-center text-text-muted">
              <AlertTriangle className="w-12 h-12 mb-4 opacity-50" />
              <p>Please select a batch from the sidebar to load its curriculum.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {subjects.map(subject => (
                <div key={subject.id} className="border border-white/10 rounded-xl overflow-hidden bg-surface-light/30">
                  <div className="p-4 bg-surface-light border-b border-white/10 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-white text-lg">{subject.name}</h4>
                      <p className="text-xs text-text-muted font-mono mt-1">{subject.code} • {subject.credits} Credit Hours</p>
                    </div>
                  </div>
                  
                  <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {subject.sections.map(section => (
                      <div key={`${subject.id}-${section}`} className="bg-surface p-4 rounded-lg border border-white/5 shadow-sm">
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-bold text-white">Section {section}</span>
                          <span className="text-xs text-text-muted bg-white/5 px-2 py-1 rounded">40 Students</span>
                        </div>
                        <select className="w-full bg-surface-light border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:ring-1 focus:ring-primary">
                          <option value="">Unassigned</option>
                          {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
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
