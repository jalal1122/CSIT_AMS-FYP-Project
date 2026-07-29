import { useState } from "react";
import { DndContext, DragOverlay, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { BookOpen, Save, RefreshCw } from "lucide-react";

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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Curriculum Builder</h2>
          <p className="text-text-muted">Design syllabus structures using drag-and-drop</p>
        </div>
        <div className="flex items-center gap-4">
          <select 
            className="bg-surface-light border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
            value={selectedDiscipline}
            onChange={(e) => setSelectedDiscipline(e.target.value)}
          >
            <option value="">Select Discipline...</option>
            {disciplines.map(d => (
              <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
            ))}
          </select>
          <button className="bg-gradient-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50" disabled={!selectedDiscipline}>
            <Save className="w-4 h-4" /> Save Curriculum
          </button>
        </div>
      </div>

      {!selectedDiscipline ? (
        <div className="glass p-12 text-center flex flex-col items-center justify-center border-dashed border-2 border-white/10">
          <div className="w-16 h-16 bg-surface-light rounded-full flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-medium text-white mb-2">No Discipline Selected</h3>
          <p className="text-text-muted max-w-md">Please select a discipline from the dropdown above to view or modify its curriculum structure.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 h-[calc(100vh-240px)] min-h-[600px]">
          {/* Subject Pool */}
          <div className="xl:col-span-1 glass flex flex-col overflow-hidden">
            <div className="p-4 border-b border-white/10 bg-surface-light/50">
              <h3 className="font-semibold text-white">Subject Pool</h3>
              <p className="text-xs text-text-muted mt-1">Drag subjects to semesters</p>
            </div>
            <div className="p-4 flex-1 overflow-y-auto space-y-3">
              {subjectPool.map(sub => (
                <div key={sub._id} className="bg-surface-light p-3 rounded-lg border border-white/5 cursor-grab hover:border-primary/50 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-mono text-xs font-bold text-primary">{sub.code}</span>
                    <span className="text-xs text-text-muted">{sub.creditHours} Cr</span>
                  </div>
                  <p className="text-sm font-medium text-white leading-tight">{sub.name}</p>
                </div>
              ))}
              {subjectPool.length === 0 && (
                <div className="text-center p-4 text-text-muted text-sm">Pool is empty</div>
              )}
            </div>
          </div>

          {/* Curriculum Canvas */}
          <div className="xl:col-span-3 glass p-6 overflow-x-auto">
            <div className="flex gap-6 min-w-max pb-4 h-full">
              {Object.keys(semesters).map(semNum => (
                <div key={semNum} className="w-72 flex flex-col bg-surface/50 border border-white/5 rounded-xl overflow-hidden h-full">
                  <div className="p-3 bg-surface-light border-b border-white/10 flex justify-between items-center">
                    <h4 className="font-medium text-white text-sm">Semester {semNum}</h4>
                    <span className="bg-white/5 text-text-muted text-xs px-2 py-1 rounded">
                      {semesters[semNum].reduce((acc, curr) => acc + curr.creditHours, 0)} Cr
                    </span>
                  </div>
                  <div className="p-3 flex-1 overflow-y-auto space-y-3">
                    {semesters[semNum].length === 0 ? (
                      <div className="h-full flex items-center justify-center border-2 border-dashed border-white/5 rounded-lg text-text-muted text-xs">
                        Drop here
                      </div>
                    ) : (
                      semesters[semNum].map(sub => (
                         <div key={sub._id} className="bg-surface-light p-3 rounded-lg border border-white/5 shadow-sm">
                           <div className="flex justify-between items-start mb-1">
                             <span className="font-mono text-xs font-bold text-secondary">{sub.code}</span>
                             <span className="text-xs text-text-muted">{sub.creditHours} Cr</span>
                           </div>
                           <p className="text-sm font-medium text-white leading-tight">{sub.name}</p>
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
