import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchDisciplines, fetchSubjects, updateSyllabus } from "../../store/slices/systemSlice.js";
import { addToast } from "../../store/slices/toastSlice.js";
import { BookOpen, Save, X, Search, Plus } from "lucide-react";
import EmptyState from "../../components/shared/EmptyState";

export default function Curriculum() {
  const [selectedDiscipline, setSelectedDiscipline] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [subjectPool, setSubjectPool] = useState([]);
  
  const dispatch = useDispatch();
  const { disciplines, subjects } = useSelector((state) => state.system);
  
  const [semesters, setSemesters] = useState({});

  useEffect(() => {
    dispatch(fetchDisciplines());
    dispatch(fetchSubjects());
  }, [dispatch]);

  // When discipline or subjects change, rebuild state
  useEffect(() => {
    if (selectedDiscipline && disciplines.length > 0 && subjects.length > 0) {
      const disc = disciplines.find(d => d._id === selectedDiscipline);
      if (disc) {
        // Initialize semesters
        const sems = {};
        for (let i = 1; i <= disc.totalSemesters; i++) {
          sems[i] = [];
        }

        const usedSubjectIds = new Set();
        
        // Populate existing syllabus
        if (disc.syllabus && disc.syllabus.length > 0) {
          disc.syllabus.forEach(sem => {
            if (sems[sem.semester] !== undefined) {
              const semSubjects = sem.subjects.map(sId => {
                const subjId = sId._id || sId;
                usedSubjectIds.add(subjId);
                return subjects.find(s => s._id === subjId) || { _id: subjId, name: "Unknown", creditHours: 0, code: "" };
              });
              sems[sem.semester] = semSubjects;
            }
          });
        }
        setSemesters(sems);

        // Populate pool
        setSubjectPool(subjects.filter(s => !usedSubjectIds.has(s._id) && !s.isArchived));
      }
    } else {
      setSemesters({});
      setSubjectPool([]);
    }
  }, [selectedDiscipline, disciplines, subjects]);

  const handleAddSubjectToSemester = (subject, targetSemester) => {
    setSemesters(prev => ({
      ...prev,
      [targetSemester]: [...prev[targetSemester], subject]
    }));
    setSubjectPool(prev => prev.filter(s => s._id !== subject._id));
  };

  const handleRemoveSubjectFromSemester = (subject, fromSemester) => {
    setSemesters(prev => ({
      ...prev,
      [fromSemester]: prev[fromSemester].filter(s => s._id !== subject._id)
    }));
    setSubjectPool(prev => [...prev, subject]);
  };

  const handleSaveCurriculum = async () => {
    // Only send semesters that have at least one subject
    const syllabus = Object.entries(semesters)
      .filter(([_, subjs]) => subjs.length > 0)
      .map(([semester, subjs]) => ({
        semester: Number(semester),
        subjects: subjs.map(s => s._id)
      }));

    try {
      await dispatch(updateSyllabus({ id: selectedDiscipline, syllabusData: { syllabus } })).unwrap();
      dispatch(addToast({ title: "Success", message: "Curriculum saved successfully", type: "success" }));
      dispatch(fetchDisciplines());
    } catch (err) {
      dispatch(addToast({ title: "Error", message: err, type: "error" }));
    }
  };

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
          <button onClick={handleSaveCurriculum} className="btn-primary flex items-center gap-2 whitespace-nowrap" disabled={!selectedDiscipline}>
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
                <input type="text" placeholder="Search subjects..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
              </div>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto space-y-3 bg-slate-50/30">
              {subjectPool.filter(s => s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || s.code?.toLowerCase().includes(searchTerm.toLowerCase())).map(sub => (
                <div key={sub._id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:border-sky-300 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="inline-block px-2 py-0.5 bg-sky-100 text-sky-700 rounded text-xs font-bold font-mono">{sub.code}</span>
                    <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{sub.creditHours} Cr</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-700 leading-tight mb-3">{sub.name}</p>
                  
                  {/* Click to add UI */}
                  <div className="flex gap-1 overflow-x-auto pb-1 custom-scrollbar">
                    {Object.keys(semesters).map(sem => (
                      <button 
                        key={sem} 
                        onClick={() => handleAddSubjectToSemester(sub, sem)}
                        className="px-2 py-1 bg-slate-50 hover:bg-sky-50 text-slate-500 hover:text-sky-600 border border-slate-200 rounded text-[10px] font-bold shrink-0 transition-colors"
                        title={`Add to Semester ${sem}`}
                      >
                        + S{sem}
                      </button>
                    ))}
                  </div>
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
                           <button onClick={() => handleRemoveSubjectFromSemester(sub, semNum)} className="absolute -top-2 -right-2 bg-white border border-slate-200 rounded-full p-1 text-slate-400 hover:text-rose-500 hover:border-rose-200 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
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
