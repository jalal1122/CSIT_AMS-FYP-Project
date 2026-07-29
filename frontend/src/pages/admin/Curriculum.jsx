import { useState } from "react";
import { DndContext, DragOverlay, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { BookOpen, Save, RefreshCw, X, Search } from "lucide-react";
import EmptyState from "../../components/shared/EmptyState";

export default function Curriculum() {
  const [selectedDiscipline, setSelectedDiscipline] = useState("");
  // Mock data for UI
  const disciplines = [{ _id: "1", name: "BS Information Technology", code: "BSIT" }];
  const [subjectPool, setSubjectPool] = useState([
    { _id: "s1", name: "Intro to Computing", code: "CS101", creditHours: 3 },
    { _id: "s2", name: "Programming Fundamentals", code: "CS102", creditHours: 4 },
    { _id: "s3", name: "Calculus", code: "MTH101", creditHours: 3 },
  ]);
  
  const [semesters, setSemesters] = useState({
    "1": [],
    "2": [],
    "3": [],
    "4": [],
    "5": [],
    "6": [],
    "7": [],
    "8": []
  });

  const [activeId, setActiveId] = useState(null);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Curriculum Builder</h2>
          <p className="text-slate-500 text-sm mt-1">Design syllabus structures using drag-and-drop</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <select 
            className="input md:w-64"
            value={selectedDiscipline}
            onChange={(e) => setSelectedDiscipline(e.target.value)}
          >
            <option value="">Select Discipline...</option>
            {disciplines.map(d => (
              <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
            ))}
          </select>
          <button className="btn-primary flex items-center gap-2 whitespace-nowrap" disabled={!selectedDiscipline}>
            <Save className="w-4 h-4" /> Save Curriculum
          </button>
        </div>
      </div>

      {!selectedDiscipline ? (
        <div className="flex-1 card border-dashed border-2 border-slate-200 flex flex-col items-center justify-center p-12 min-h-[400px]">
          <EmptyState 
            icon={BookOpen} 
            title="No Discipline Selected" 
            subtitle="Please select a discipline from the dropdown above to view or modify its curriculum structure."
          />
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 xl:grid-cols-4 gap-6 min-h-[600px]">
          {/* Subject Pool */}
          <div className="xl:col-span-1 card p-0 flex flex-col overflow-hidden h-full max-h-[800px]">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-semibold text-slate-800">Subject Bank</h3>
              <p className="text-xs text-slate-500 mt-1">Drag subjects to semesters</p>
              
              <div className="mt-3 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="text" placeholder="Search subjects..." className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
              </div>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto space-y-3 bg-slate-50/30">
              {subjectPool.map(sub => (
                <div key={sub._id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm cursor-grab hover:border-sky-300 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="inline-block px-2 py-0.5 bg-sky-100 text-sky-700 rounded text-xs font-bold font-mono">{sub.code}</span>
                    <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{sub.creditHours} Cr</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-700 leading-tight">{sub.name}</p>
                </div>
              ))}
              {subjectPool.length === 0 && (
                <div className="text-center p-4 text-slate-400 text-sm italic">Pool is empty</div>
              )}
            </div>
          </div>

          {/* Curriculum Canvas */}
          <div className="xl:col-span-3 card p-6 overflow-x-auto bg-slate-50/50">
            <div className="flex gap-6 min-w-max pb-4 h-full">
              {Object.keys(semesters).map(semNum => (
                <div key={semNum} className="w-72 flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden h-full shadow-sm">
                  <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex justify-between items-center">
                    <h4 className="font-bold text-slate-700 text-sm">Semester {semNum}</h4>
                    <span className="bg-white border border-slate-200 text-slate-500 font-semibold text-xs px-2.5 py-1 rounded-full shadow-sm">
                      {semesters[semNum].reduce((acc, curr) => acc + curr.creditHours, 0)} Cr
                    </span>
                  </div>
                  <div className="p-3 flex-1 overflow-y-auto space-y-3 bg-slate-50/30 min-h-[200px]">
                    {semesters[semNum].length === 0 ? (
                      <div className="h-full min-h-[150px] flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-sm font-medium bg-white/50">
                        Drop subjects here
                      </div>
                    ) : (
                      semesters[semNum].map(sub => (
                         <div key={sub._id} className="bg-sky-50 p-3 rounded-xl border border-sky-200 shadow-sm relative group">
                           <button className="absolute -top-2 -right-2 bg-white border border-slate-200 rounded-full p-1 text-slate-400 hover:text-rose-500 hover:border-rose-200 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                             <X className="w-3 h-3" />
                           </button>
                           <div className="flex justify-between items-start mb-1.5">
                             <span className="inline-block px-2 py-0.5 bg-white text-sky-700 border border-sky-100 rounded text-xs font-bold font-mono">{sub.code}</span>
                             <span className="text-xs font-medium text-slate-500 bg-white/60 px-2 py-0.5 rounded">{sub.creditHours} Cr</span>
                           </div>
                           <p className="text-sm font-semibold text-sky-900 leading-tight pr-4">{sub.name}</p>
                         </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
