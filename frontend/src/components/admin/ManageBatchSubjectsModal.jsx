import { useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { X, Search, Check, BookOpen, AlertCircle, Loader2, Sparkles, RotateCcw } from "lucide-react";
import { setBatchSubjects, fetchBatchSubjects } from "../../store/slices/academicSlice.js";
import { addToast } from "../../store/slices/toastSlice.js";

export default function ManageBatchSubjectsModal({ batch, onClose, onSuccess }) {
  const dispatch = useDispatch();
  const { subjects: allSubjects = [] } = useSelector((state) => state.system);
  const { batchSubjects } = useSelector((state) => state.academic);

  // Initialize selected subjects from current batch subjects
  const initialSelected = useMemo(() => {
    if (batchSubjects?.subjects && Array.isArray(batchSubjects.subjects)) {
      return batchSubjects.subjects.map(s => (typeof s === "object" ? s._id : s));
    }
    // Fallback: check batch discipline syllabus
    if (batch?.disciplineId?.syllabus) {
      const semMap = batch.disciplineId.syllabus.find(s => s.semester === batch.currentSemester);
      if (semMap?.subjects) {
        return semMap.subjects.map(s => (typeof s === "object" ? s._id : s));
      }
    }
    return [];
  }, [batchSubjects, batch]);

  const [selectedIds, setSelectedIds] = useState(initialSelected);
  const [searchTerm, setSearchTerm] = useState("");
  const [saving, setSaving] = useState(false);

  // Filter subjects based on search
  const filteredSubjects = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return allSubjects;
    return allSubjects.filter(
      s => s.name?.toLowerCase().includes(term) || s.code?.toLowerCase().includes(term)
    );
  }, [allSubjects, searchTerm]);

  // Selected subjects summary
  const selectedSubjectsList = useMemo(() => {
    return allSubjects.filter(s => selectedIds.includes(s._id));
  }, [allSubjects, selectedIds]);

  const totalCredits = useMemo(() => {
    return selectedSubjectsList.reduce((acc, s) => acc + (s.creditHours || 0), 0);
  }, [selectedSubjectsList]);

  const handleToggle = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredSubjects.map(s => s._id);
    setSelectedIds(prev => Array.from(new Set([...prev, ...filteredIds])));
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  const handleResetToSyllabus = () => {
    if (batch?.disciplineId?.syllabus) {
      const semMap = batch.disciplineId.syllabus.find(s => s.semester === batch.currentSemester);
      if (semMap?.subjects) {
        const syllabusIds = semMap.subjects.map(s => (typeof s === "object" ? s._id : s));
        setSelectedIds(syllabusIds);
        dispatch(addToast({
          title: "Reset to Syllabus",
          message: `Loaded ${syllabusIds.length} subjects from default curriculum syllabus.`,
          type: "info"
        }));
        return;
      }
    }
    dispatch(addToast({
      title: "No Default Syllabus",
      message: "No default syllabus found for this semester in the discipline.",
      type: "warning"
    }));
  };

  const handleSave = async () => {
    if (!batch?._id) return;
    setSaving(true);
    try {
      await dispatch(setBatchSubjects({
        batchId: batch._id,
        subjectIds: selectedIds,
        semester: batch.currentSemester
      })).unwrap();

      dispatch(addToast({
        title: "Subjects Updated",
        message: `Successfully allocated ${selectedIds.length} subjects to ${batch.name} (Semester ${batch.currentSemester})`,
        type: "success"
      }));

      // Refresh batch subjects
      dispatch(fetchBatchSubjects(batch._id));
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      dispatch(addToast({
        title: "Update Failed",
        message: err || "Failed to update batch subjects",
        type: "error"
      }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-sky-100 text-sky-600 rounded-xl">
                <BookOpen className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Manage Batch Subjects</h3>
                <p className="text-xs text-slate-500">
                  {batch?.name} • Semester {batch?.currentSemester}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action & Search Bar */}
        <div className="p-6 border-b border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                className="input pl-9 w-full text-sm"
                placeholder="Search subject by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetToSyllabus}
                className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-sky-600 bg-slate-100 hover:bg-sky-50 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
                title="Reset to discipline syllabus template"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset to Template
              </button>
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="px-3 py-2 text-xs font-medium text-sky-600 hover:bg-sky-50 rounded-lg transition-colors whitespace-nowrap"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div className="flex items-center gap-4 text-slate-600">
              <span>
                Selected: <strong className="text-sky-700">{selectedIds.length}</strong> subjects
              </span>
              <span>•</span>
              <span>
                Total Credits: <strong className="text-sky-700">{totalCredits}</strong> hrs
              </span>
            </div>
            {batchSubjects?.source && (
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                batchSubjects.source === "batch"
                  ? "bg-violet-100 text-violet-700"
                  : "bg-amber-100 text-amber-700"
              }`}>
                {batchSubjects.source === "batch" ? "Custom Batch Allocation" : "Curriculum Template Default"}
              </span>
            )}
          </div>
        </div>

        {/* Subject Checklist */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2.5">
          {filteredSubjects.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-sm font-medium">No subjects found</p>
              <p className="text-slate-400 text-xs mt-1">Try adjusting your search query</p>
            </div>
          ) : (
            filteredSubjects.map((subject) => {
              const isSelected = selectedIds.includes(subject._id);
              return (
                <div
                  key={subject._id}
                  onClick={() => handleToggle(subject._id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? "border-sky-500 bg-sky-50/60 shadow-sm"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors flex-shrink-0 ${
                        isSelected
                          ? "bg-sky-600 border-sky-600 text-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-slate-800 truncate">
                          {subject.name}
                        </span>
                        {subject.code && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[11px]">
                            {subject.code}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {subject.creditHours} Credit Hour{subject.creditHours !== 1 ? "s" : ""}
                        {subject.type ? ` • ${subject.type}` : ""}
                      </p>
                    </div>
                  </div>

                  <span className={`text-xs font-medium px-2 py-1 rounded-lg ${
                    isSelected ? "text-sky-700 bg-sky-100/70" : "text-slate-400"
                  }`}>
                    {isSelected ? "Selected" : "Add"}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="btn-secondary text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-primary text-sm flex items-center gap-2 min-w-[130px] justify-center"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" /> Save Subjects
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
