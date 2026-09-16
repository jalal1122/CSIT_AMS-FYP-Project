import { useState, useEffect } from "react";
import Select from "react-select";
import { useDispatch, useSelector } from "react-redux";
import { 
  fetchBatches, 
  fetchBatchDetails, 
  fetchAllocations, 
  assignAllocations, 
  toggleRetroactivePermission,
  fetchBatchSubjects
} from "../../store/slices/academicSlice.js";
import { fetchSubjects } from "../../store/slices/systemSlice.js";
import { fetchTeachers } from "../../store/slices/facultySlice.js";
import { addToast } from "../../store/slices/toastSlice.js";
import { Check, ClipboardList, AlertTriangle, AlertCircle, BookOpen, Layers } from "lucide-react";
import EmptyState from "../../components/shared/EmptyState";
import Badge from "../../components/shared/Badge";
import ManageBatchSubjectsModal from "../../components/admin/ManageBatchSubjectsModal.jsx";

export default function Allocation() {
  const [selectedBatch, setSelectedBatch] = useState("");
  const [assignments, setAssignments] = useState({}); // { subjectId: { "A": teacherId } }
  const [retroactive, setRetroactive] = useState({}); // { subjectId: { "A": boolean } }
  const [allocationIds, setAllocationIds] = useState({}); // { subjectId: allocationId }
  const [showManageSubjectsModal, setShowManageSubjectsModal] = useState(false);
  
  const dispatch = useDispatch();
  const { batches, currentBatch, allocations, batchSubjects, isLoading } = useSelector((state) => state.academic);
  const { teachers } = useSelector((state) => state.faculty);

  useEffect(() => {
    dispatch(fetchBatches({ isActive: true }));
    dispatch(fetchTeachers());
  }, [dispatch]);

  useEffect(() => {
    if (selectedBatch) {
      dispatch(fetchBatchDetails(selectedBatch));
      dispatch(fetchAllocations({ batchId: selectedBatch }));
      dispatch(fetchBatchSubjects(selectedBatch));
      dispatch(fetchSubjects());
    }
  }, [selectedBatch, dispatch]);

  useEffect(() => {
    if (allocations && allocations.length > 0) {
      const initialAssignments = {};
      const initialRetroactive = {};
      const allocIds = {};
      allocations.forEach(alloc => {
        const subId = alloc.subjectId?._id || alloc.subjectId;
        initialAssignments[subId] = {};
        initialRetroactive[subId] = {};
        allocIds[subId] = alloc._id;
        alloc.sections.forEach(sec => {
          initialAssignments[subId][sec.name] = sec.teacherId?._id || sec.teacherId;
          initialRetroactive[subId][sec.name] = sec.allowRetroactiveSessions || false;
        });
      });
      setAssignments(initialAssignments);
      setRetroactive(initialRetroactive);
      setAllocationIds(allocIds);
    } else {
      setAssignments({});
      setRetroactive({});
      setAllocationIds({});
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

  const handleRetroToggle = async (subjectId, section, currentValue) => {
    const allocationId = allocationIds[subjectId];
    if (!allocationId) {
      dispatch(addToast({ title: "Save Required", message: "Please save the teacher assignment first", type: "warning" }));
      return;
    }
    
    try {
      // dynamic import of action if needed, or use the one we add to imports
      // wait, we need to import it at the top
      await dispatch(toggleRetroactivePermission({ id: allocationId, sectionName: section, allowRetroactiveSessions: !currentValue })).unwrap();
      setRetroactive(prev => ({
        ...prev,
        [subjectId]: {
          ...(prev[subjectId] || {}),
          [section]: !currentValue
        }
      }));
      dispatch(addToast({ title: "Success", message: "Retroactive permission updated", type: "success" }));
    } catch (err) {
      dispatch(addToast({ title: "Error", message: err || "Failed to update permission", type: "error" }));
    }
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

  // Extract subjects for current semester: check batchSubjects first, then fallback to discipline syllabus
  let currentSubjects = [];
  if (batchSubjects?.subjects && batchSubjects.subjects.length > 0) {
    currentSubjects = batchSubjects.subjects;
  } else if (currentBatch?.disciplineId?.syllabus) {
    const semMap = currentBatch.disciplineId.syllabus.find(s => s.semester === currentBatch.currentSemester);
    if (semMap) {
      currentSubjects = semMap.subjects || [];
    }
  }

  // Generate sections list based directly on batch sections (manual sections)
  const activeSections = (currentBatch?.sections || [])
    .filter(s => s.status !== "archived")
    .map(s => s.name);
  const sectionsList = activeSections.length > 0
    ? activeSections
    : (currentBatch?.studentCount ? Array.from({ length: Math.ceil(currentBatch.studentCount / 40) }, (_, i) => String.fromCharCode(65 + i)) : ["A"]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Course Allocations</h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Assign teachers to specific sections for the active semester</p>
        </div>
        <button onClick={handleSaveAllocations} className="btn-primary flex items-center justify-center gap-2 whitespace-nowrap w-full sm:w-auto text-xs sm:text-sm">
          <Check className="w-4 h-4" /> Save Allocations
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6 items-start">
        
        {/* Panel 1: Batch Selector */}
        <div className="xl:col-span-1 card p-3.5 sm:p-6 xl:sticky xl:top-6">
          <h3 className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 sm:mb-4 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-sky-500" /> Target Batch
          </h3>
          <select 
            className="input w-full cursor-pointer shadow-sm text-xs sm:text-sm"
            value={selectedBatch}
            onChange={e => setSelectedBatch(e.target.value)}
          >
            <option value="">Select a batch...</option>
            {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
          
          {selectedBatch && currentBatch && (
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-sky-50 border border-sky-100 rounded-xl space-y-2.5 sm:space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sky-800 font-semibold text-xs sm:text-sm">Semester {currentBatch.currentSemester}</span>
                <Badge variant={currentBatch.isActive ? "info" : "neutral"}>
                  {currentBatch.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>

              {batchSubjects?.source && (
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] sm:text-[11px] font-medium px-2 py-0.5 rounded-full ${
                    batchSubjects.source === "batch"
                      ? "bg-violet-100 text-violet-700"
                      : "bg-amber-100 text-amber-700"
                  }`}>
                    {batchSubjects.source === "batch" ? "Custom Batch Subjects" : "Discipline Syllabus"}
                  </span>
                </div>
              )}

              <p className="text-xs text-sky-700 leading-relaxed">
                <strong>{currentSubjects.length} subject(s)</strong> available for allocation across <strong>{sectionsList.length} section(s)</strong>.
              </p>

              <button
                type="button"
                onClick={() => setShowManageSubjectsModal(true)}
                className="w-full py-2 px-3 bg-white hover:bg-sky-100/70 text-sky-700 border border-sky-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" /> Manage Subjects ({currentSubjects.length})
              </button>
            </div>
          )}
        </div>

        {/* Panel 2 & 3: Subjects & Sections */}
        <div className="xl:col-span-3 card p-0 overflow-hidden min-h-[350px]">
          {!selectedBatch ? (
            <div className="h-[350px] sm:h-[500px] flex items-center justify-center p-4">
              <EmptyState 
                icon={ClipboardList} 
                title="No Batch Selected" 
                subtitle="Please select a batch from the sidebar to load its curriculum and begin allocation." 
              />
            </div>
          ) : (
            <div className="p-3 sm:p-6 space-y-4 sm:space-y-8 bg-slate-50/50">
              {currentSubjects.map(subject => (
                <div key={subject._id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-3.5 sm:px-6 py-3 sm:py-4 bg-slate-50/80 border-b border-slate-100 flex justify-between items-center">
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-800 text-base sm:text-lg truncate">{subject.name || `Subject ${subject._id}`}</h4>
                      {subject.code && <p className="text-xs sm:text-sm text-slate-500 font-mono mt-0.5"><span className="text-sky-600 font-semibold">{subject.code}</span> • {subject.creditHours} Credit Hours</p>}
                    </div>
                  </div>
                  
                  <div className="p-3.5 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6">
                    {sectionsList.map(section => (
                      <div key={`${subject._id}-${section}`} className="bg-white p-3.5 sm:p-5 rounded-xl border border-slate-200 shadow-sm relative group">
                        <div className="flex justify-between items-center mb-3 sm:mb-4">
                          <span className="font-bold text-slate-800 text-base sm:text-lg">Section {section}</span>
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
                          
                          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                            <div>
                              <span className="text-xs font-semibold text-slate-700 block">Retroactive Sessions</span>
                              <span className="text-[10px] text-slate-500">Allow past attendance</span>
                            </div>
                            <button
                              onClick={() => handleRetroToggle(subject._id, section, retroactive[subject._id]?.[section] || false)}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                retroactive[subject._id]?.[section] ? "bg-emerald-500" : "bg-slate-300"
                              }`}
                            >
                              <span
                                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                  retroactive[subject._id]?.[section] ? "translate-x-4.5" : "translate-x-1"
                                }`}
                              />
                            </button>
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

      {/* Manage Batch Subjects Modal */}
      {showManageSubjectsModal && currentBatch && (
        <ManageBatchSubjectsModal
          batch={currentBatch}
          onClose={() => setShowManageSubjectsModal(false)}
          onSuccess={() => {
            dispatch(fetchBatchSubjects(selectedBatch));
            dispatch(fetchAllocations({ batchId: selectedBatch }));
          }}
        />
      )}
    </div>
  );
}
