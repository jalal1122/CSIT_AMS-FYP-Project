import { useState, useEffect } from "react";
import Select from "react-select";
import { useDispatch, useSelector } from "react-redux";
import { fetchBatches, fetchBatchDetails, fetchAllocations, assignAllocations } from "../../store/slices/academicSlice.js";
import { fetchTeachers } from "../../store/slices/facultySlice.js";
import { addToast } from "../../store/slices/toastSlice.js";
import { Check, ClipboardList, AlertTriangle, AlertCircle } from "lucide-react";
import EmptyState from "../../components/shared/EmptyState";
import Badge from "../../components/shared/Badge";

export default function Allocation() {
  const [selectedBatch, setSelectedBatch] = useState("");
  const [assignments, setAssignments] = useState({}); // { subjectId: { "A": teacherId } }
  
  const dispatch = useDispatch();
  const { batches, currentBatch, allocations, isLoading } = useSelector((state) => state.academic);
  const { teachers } = useSelector((state) => state.faculty);

  useEffect(() => {
    dispatch(fetchBatches({ isActive: true }));
    dispatch(fetchTeachers());
  }, [dispatch]);

  useEffect(() => {
    if (selectedBatch) {
      dispatch(fetchBatchDetails(selectedBatch));
      dispatch(fetchAllocations({ batchId: selectedBatch }));
    }
  }, [selectedBatch, dispatch]);

  useEffect(() => {
    if (allocations && allocations.length > 0) {
      const initialAssignments = {};
      allocations.forEach(alloc => {
        initialAssignments[alloc.subjectId?._id] = {};
        alloc.sections.forEach(sec => {
          initialAssignments[alloc.subjectId?._id][sec.name] = sec.teacherId?._id || sec.teacherId;
        });
      });
      setAssignments(initialAssignments);
    } else {
      setAssignments({});
    }
  }, [allocations]);

  const handleTeacherChange = (subjectId, section, teacherId) => {
    setAssignments(prev => ({
      ...prev,
      [subjectId]: {
        ...(prev[subjectId] || {}),
        [section]: teacherId
      }
    }));
  };

  const handleSaveAllocations = async () => {
    if (!selectedBatch) return;

    // Convert assignments map to array format expected by API
    const teacherAssignments = [];
    Object.entries(assignments).forEach(([subjectId, sectionMap]) => {
      const sections = Object.entries(sectionMap)
        .filter(([_, teacherId]) => !!teacherId)
        .map(([name, teacherId]) => ({ name, teacherId }));
      
      if (sections.length > 0) {
        teacherAssignments.push({ subjectId, sections });
      }
    });

    if (teacherAssignments.length === 0) {
      dispatch(addToast({ title: "Info", message: "No teachers assigned", type: "info" }));
      return;
    }

    try {
      await dispatch(assignAllocations({ batchId: selectedBatch, teacherAssignments })).unwrap();
      dispatch(addToast({ title: "Success", message: "Allocations saved successfully", type: "success" }));
      dispatch(fetchAllocations({ batchId: selectedBatch }));
    } catch (err) {
      dispatch(addToast({ title: "Error", message: err, type: "error" }));
    }
  };

  // Extract subjects for current semester from batch syllabus
  let currentSubjects = [];
  if (currentBatch && currentBatch.disciplineId && currentBatch.disciplineId.syllabus) {
    const semMap = currentBatch.disciplineId.syllabus.find(s => s.semester === currentBatch.currentSemester);
    if (semMap) {
      currentSubjects = semMap.subjects || []; // these are usually populated if getBatch populates them, if not we need them populated. Let's assume they are populated or we just display ID.
    }
  }

  // Generate sections list based on maxStudentsPerSection and studentCount
  const capacity = currentBatch?.maxStudentsPerSection || 40;
  const numSections = currentBatch ? Math.ceil(currentBatch.studentCount / capacity) : 0;
  const sectionsList = Array.from({ length: Math.max(1, numSections) }, (_, i) => String.fromCharCode(65 + i));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Course Allocations</h2>
          <p className="text-slate-500 text-sm mt-1">Assign teachers to specific sections for the active semester</p>
        </div>
        <button onClick={handleSaveAllocations} className="btn-primary flex items-center gap-2 whitespace-nowrap">
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
            {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
          
          {selectedBatch && currentBatch && (
            <div className="mt-6 p-4 bg-sky-50 border border-sky-100 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sky-800 font-semibold text-sm">Semester {currentBatch.currentSemester}</span>
                <Badge variant="info">Active</Badge>
              </div>
              <p className="text-xs text-sky-700 leading-relaxed">
                Found <strong>{currentSubjects.length} subjects</strong> in curriculum. <strong>{currentBatch.studentCount} total students</strong> across {sectionsList.length} sections.
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
              {currentSubjects.map(subject => (
                <div key={subject._id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-100 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg">{subject.name || `Subject ${subject._id}`}</h4>
                      {subject.code && <p className="text-sm text-slate-500 font-mono mt-0.5"><span className="text-sky-600 font-semibold">{subject.code}</span> • {subject.creditHours} Credit Hours</p>}
                    </div>
                  </div>
                  
                  <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {sectionsList.map(section => (
                      <div key={`${subject._id}-${section}`} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative group">
                        <div className="flex justify-between items-center mb-4">
                          <span className="font-bold text-slate-800 text-lg">Section {section}</span>
                        </div>
                        <div className="relative">
                          <Select
                            options={teachers.filter(t => t.accountStatus === 'Active').map(t => ({ value: t._id, label: t.name }))}
                            value={
                              teachers
                                .filter(t => t.accountStatus === 'Active')
                                .map(t => ({ value: t._id, label: t.name }))
                                .find(opt => opt.value === assignments[subject._id]?.[section]) || null
                            }
                            onChange={(selected) => handleTeacherChange(subject._id, section, selected ? selected.value : "")}
                            placeholder="Search & Select"
                            isClearable
                            className="react-select-container"
                            classNamePrefix="react-select"
                            styles={{
                              control: (base) => ({
                                ...base,
                                borderColor: '#e2e8f0',
                                boxShadow: 'none',
                                '&:hover': {
                                  borderColor: '#cbd5e1'
                                }
                              })
                            }}
                          />
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
