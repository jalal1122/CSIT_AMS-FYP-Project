import { useState, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useDropzone } from "react-dropzone";
import {
  Check, UploadCloud, FileSpreadsheet, ChevronRight,
  Plus, Trash2, Loader2, AlertCircle, Users, BookOpen,
  FolderPlus, LayoutGrid, Upload
} from "lucide-react";
import * as xlsx from "xlsx";
import { fetchDepartments, fetchDisciplines } from "../../store/slices/systemSlice.js";
import { createBatch, uploadSectionStudents } from "../../store/slices/academicSlice.js";
import { addToast } from "../../store/slices/toastSlice.js";
import { useNavigate } from "react-router-dom";

const STEPS = [
  { label: "Department",  icon: BookOpen },
  { label: "Discipline",  icon: BookOpen },
  { label: "Sections",    icon: LayoutGrid },
  { label: "Create",      icon: FolderPlus },
  { label: "Upload",      icon: Upload },
  { label: "Done",        icon: Check },
];

// Validates a section name: single letter OR descriptive (Morning, Evening, CS-01, etc.)
function validateSectionName(name) {
  if (!name || !name.trim()) return "Section name cannot be empty";
  if (name.trim().length > 30) return "Section name too long (max 30 characters)";
  return null;
}

// Download Excel template helper
function downloadTemplate() {
  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.aoa_to_sheet([
    ["Name", "Username", "Roll No"],
    ["Muhammad Ali",  "CSIT-2022-001", "2022-001"],
    ["Fatima Khan",   "CSIT-2022-002", "2022-002"],
    ["Ahmed Raza",    "CSIT-2022-003", "2022-003"],
  ]);
  xlsx.utils.book_append_sheet(wb, ws, "Students");
  xlsx.writeFile(wb, "student_roster_template.xlsx");
}

// Section Upload Card — one per section
function SectionUploadCard({ section, onFileSelect, result, isUploading }) {
  const onDrop = useCallback((accepted) => {
    if (accepted?.length > 0) onFileSelect(section.name, accepted[0]);
  }, [section.name, onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "text/csv": [".csv"],
    },
    maxFiles: 1,
    disabled: !!result || isUploading,
  });

  const uploaded = !!result;
  const hasFile  = !!section.file;

  return (
    <div className={`bg-white border rounded-2xl overflow-hidden shadow-sm transition-all ${
      uploaded ? "border-emerald-200" : hasFile ? "border-sky-200" : "border-slate-200"
    }`}>
      {/* Section header */}
      <div className={`px-5 py-3 flex items-center justify-between ${
        uploaded ? "bg-emerald-50" : hasFile ? "bg-sky-50" : "bg-slate-50"
      }`}>
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
            uploaded ? "bg-emerald-500 text-white" : "bg-sky-100 text-sky-700"
          }`}>
            {uploaded ? <Check className="w-4 h-4" /> : section.name[0].toUpperCase()}
          </div>
          <span className="font-bold text-slate-800">Section {section.name}</span>
        </div>
        {uploaded && (
          <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
            {result.inserted} students • {result.duplicates?.length > 0 ? `${result.duplicates.length} skipped` : "all clear"}
          </span>
        )}
      </div>

      {/* Upload zone */}
      <div className="p-4">
        {uploaded ? (
          <div className="text-center py-3 text-slate-500 text-sm">
            <Check className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
            Upload complete
          </div>
        ) : (
          <>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                isDragActive
                  ? "border-sky-400 bg-sky-50"
                  : hasFile
                  ? "border-sky-300 bg-sky-50/40"
                  : "border-slate-200 hover:border-sky-300 bg-slate-50"
              }`}
            >
              <input {...getInputProps()} />
              {isUploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
                  <span className="text-sm text-sky-600 font-medium">Uploading...</span>
                </div>
              ) : hasFile ? (
                <div className="flex items-center justify-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-sky-600" />
                  <span className="text-sm font-semibold text-sky-700">{section.file.name}</span>
                </div>
              ) : (
                <>
                  <UploadCloud className={`w-8 h-8 mx-auto mb-2 ${isDragActive ? "text-sky-500" : "text-slate-400"}`} />
                  <p className="text-sm text-slate-500">Drop Excel / CSV here or <span className="text-sky-600 font-semibold">browse</span></p>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function BatchCreate() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    departmentId: "",
    disciplineId: "",
  });
  // sectionDefs: [{ name: string, file: File|null }]
  const [sectionDefs, setSectionDefs] = useState([{ name: "A", file: null }]);
  const [sectionNameInput, setSectionNameInput] = useState("");
  const [nameError, setNameError] = useState("");
  const [createdBatch, setCreatedBatch] = useState(null);
  const [uploadResults, setUploadResults] = useState({}); // { sectionName: result }
  const [uploadingSection, setUploadingSection] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { departments, disciplines } = useSelector((s) => s.system);

  useEffect(() => {
    dispatch(fetchDepartments());
    dispatch(fetchDisciplines());
  }, [dispatch]);

  const filteredDisciplines = disciplines.filter(
    (d) => d.departmentId?._id === formData.departmentId || d.departmentId === formData.departmentId
  );

  // ── Section management ─────────────────────────────────────────────────────

  const addSection = () => {
    const name = sectionNameInput.trim();
    const err = validateSectionName(name);
    if (err) { setNameError(err); return; }

    const duplicate = sectionDefs.some(
      (s) => s.name.toUpperCase() === name.toUpperCase()
    );
    if (duplicate) { setNameError("Section name already exists"); return; }

    setSectionDefs((prev) => [...prev, { name, file: null }]);
    setSectionNameInput("");
    setNameError("");
  };

  const removeSection = (name) => {
    setSectionDefs((prev) => prev.filter((s) => s.name !== name));
  };

  const handleFileSelect = (sectionName, file) => {
    setSectionDefs((prev) =>
      prev.map((s) => (s.name === sectionName ? { ...s, file } : s))
    );
  };

  // ── Step navigation ────────────────────────────────────────────────────────

  const canAdvance = () => {
    if (step === 1) return !!formData.departmentId;
    if (step === 2) return !!formData.disciplineId;
    if (step === 3) return sectionDefs.length > 0;
    return true;
  };

  const handleCreateBatch = async () => {
    setIsCreating(true);
    try {
      const result = await dispatch(createBatch({
        name: formData.name || undefined,
        departmentId: formData.departmentId,
        disciplineId: formData.disciplineId,
        sections: sectionDefs.map((s) => s.name),
      })).unwrap();
      setCreatedBatch(result.batch);
      dispatch(addToast({ title: "Batch Created", message: result.message, type: "success" }));
      setStep(5); // go to upload step
    } catch (err) {
      dispatch(addToast({ title: "Error", message: err, type: "error" }));
    } finally {
      setIsCreating(false);
    }
  };

  const handleUploadSection = async (sectionName) => {
    const secDef = sectionDefs.find((s) => s.name === sectionName);
    if (!secDef?.file) {
      dispatch(addToast({ title: "No File", message: `Please select a file for section ${sectionName}`, type: "warning" }));
      return;
    }
    setUploadingSection(sectionName);
    try {
      const result = await dispatch(uploadSectionStudents({
        batchId: createdBatch._id,
        sectionName,
        file: secDef.file,
      })).unwrap();
      setUploadResults((prev) => ({ ...prev, [sectionName]: result }));
      dispatch(addToast({
        title: "Upload Success",
        message: `${result.inserted} students added to Section ${sectionName}`,
        type: result.duplicates?.length > 0 ? "warning" : "success",
      }));
    } catch (err) {
      dispatch(addToast({ title: "Upload Failed", message: err, type: "error" }));
    } finally {
      setUploadingSection(null);
    }
  };

  const handleUploadAll = async () => {
    for (const sec of sectionDefs) {
      if (sec.file && !uploadResults[sec.name]) {
        await handleUploadSection(sec.name);
      }
    }
    setStep(6);
  };

  const totalUploaded = Object.values(uploadResults).reduce(
    (acc, r) => acc + (r?.inserted || 0), 0
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Create New Batch</h2>
        <p className="text-slate-500 mt-2">Define sections manually, then upload student rosters per section.</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between mb-8 px-2 relative max-w-2xl mx-auto">
        <div className="absolute left-4 right-4 top-5 h-0.5 bg-slate-100 -z-10" />
        <div
          className="absolute left-4 top-5 h-0.5 bg-sky-500 -z-10 transition-all duration-500"
          style={{ width: `calc(${((step - 1) / (STEPS.length - 1)) * 100}% - 2rem)` }}
        />
        {STEPS.map((s, i) => {
          const num = i + 1;
          const done = step > num;
          const active = step === num;
          return (
            <div key={num} className="flex flex-col items-center gap-1.5">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                done ? "bg-sky-500 text-white shadow-md shadow-sky-200"
                  : active ? "bg-white text-sky-600 border-2 border-sky-500 shadow-sm"
                  : "bg-white text-slate-400 border-2 border-slate-200"
              }`}>
                {done ? <Check className="w-4 h-4" /> : num}
              </div>
              <span className={`text-[10px] font-semibold hidden sm:block ${active ? "text-sky-600" : done ? "text-slate-600" : "text-slate-400"}`}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="card p-8 md:p-12 min-h-[420px] flex flex-col shadow-lg border-slate-200/60 max-w-2xl mx-auto w-full">
        <div className="flex-1 flex flex-col justify-center">

          {/* Step 1 — Department */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-xl font-bold text-slate-800 mb-6 text-center">Select Department</h3>
              <select
                className="input text-base py-3 shadow-sm cursor-pointer"
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value, disciplineId: "" })}
              >
                <option value="">Choose a department...</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Step 2 — Discipline + Name */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-xl font-bold text-slate-800 mb-6 text-center">Select Discipline</h3>
              <select
                className="input text-base py-3 shadow-sm cursor-pointer"
                value={formData.disciplineId}
                onChange={(e) => setFormData({ ...formData, disciplineId: e.target.value })}
              >
                <option value="">Choose a discipline...</option>
                {filteredDisciplines.map((d) => (
                  <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Optional batch name (e.g. Fall 2026)"
                className="input text-base py-3 shadow-sm"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          )}

          {/* Step 3 — Define Sections */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-2">
                <h3 className="text-xl font-bold text-slate-800">Define Sections</h3>
                <p className="text-slate-500 text-sm mt-1">
                  Add sections manually. Use single letters (A, B, C) or descriptive names (Morning, Evening, CS-01).
                </p>
              </div>

              {/* Add section input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Section name (e.g. A or Morning)"
                  className="input flex-1"
                  value={sectionNameInput}
                  onChange={(e) => { setSectionNameInput(e.target.value); setNameError(""); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSection(); }}}
                  maxLength={30}
                />
                <button
                  onClick={addSection}
                  className="btn-primary flex items-center gap-1.5 px-4 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
              {nameError && <p className="text-rose-500 text-sm -mt-2">{nameError}</p>}

              {/* Section list */}
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {sectionDefs.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
                    No sections defined yet. Add at least one section.
                  </div>
                )}
                {sectionDefs.map((sec, i) => (
                  <div key={sec.name} className="flex items-center justify-between bg-sky-50 border border-sky-200 rounded-xl px-4 py-3 group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-sky-500 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                        {sec.name[0].toUpperCase()}
                      </div>
                      <span className="font-semibold text-slate-800">Section {sec.name}</span>
                    </div>
                    <button
                      onClick={() => removeSection(sec.name)}
                      className="text-slate-400 hover:text-rose-500 transition-colors p-1 rounded-lg hover:bg-rose-50"
                      title="Remove section"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {sectionDefs.length > 0 && (
                <div className="p-3 bg-sky-50 border border-sky-100 rounded-xl flex items-center gap-2 text-sm text-sky-800">
                  <AlertCircle className="w-4 h-4 text-sky-500 shrink-0" />
                  <span>{sectionDefs.length} section(s) defined. You can upload student rosters for each after creating the batch.</span>
                </div>
              )}
            </div>
          )}

          {/* Step 4 — Review & Create */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-2">
                <h3 className="text-xl font-bold text-slate-800">Review & Create Batch</h3>
                <p className="text-slate-500 text-sm mt-1">Confirm the details below before creating the batch shell.</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Discipline</span>
                  <span className="font-semibold text-slate-800">
                    {disciplines.find((d) => d._id === formData.disciplineId)?.name || "—"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Batch Name</span>
                  <span className="font-semibold text-slate-800">
                    {disciplines.find((d) => d._id === formData.disciplineId)?.code} - {formData.name || new Date().getFullYear()}
                  </span>
                </div>
                <div className="border-t border-slate-100 pt-4">
                  <p className="text-slate-500 font-medium text-sm mb-3">Sections to create ({sectionDefs.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {sectionDefs.map((sec) => (
                      <span key={sec.name} className="px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-sm font-semibold">
                        {sec.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {isCreating && (
                <div className="flex items-center justify-center gap-3 py-4">
                  <Loader2 className="w-6 h-6 text-sky-500 animate-spin" />
                  <span className="text-slate-600 font-medium">Creating batch...</span>
                </div>
              )}
            </div>
          )}

          {/* Step 5 — Per-Section Upload */}
          {step === 5 && createdBatch && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-2">
                <h3 className="text-xl font-bold text-slate-800">Upload Student Rosters</h3>
                <p className="text-slate-500 text-sm mt-1">
                  Upload an Excel or CSV file for each section. Columns required: <strong>Name, Username, Roll No</strong>
                </p>
                <button
                  onClick={downloadTemplate}
                  className="mt-2 text-sm text-sky-600 hover:text-sky-700 hover:underline font-medium flex items-center gap-1 mx-auto"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Download Template
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-1">
                {sectionDefs.map((sec) => (
                  <SectionUploadCard
                    key={sec.name}
                    section={sec}
                    onFileSelect={handleFileSelect}
                    result={uploadResults[sec.name]}
                    isUploading={uploadingSection === sec.name}
                  />
                ))}
              </div>

              {/* Per-section upload buttons */}
              <div className="space-y-2">
                {sectionDefs.map((sec) => (
                  !uploadResults[sec.name] && (
                    <button
                      key={sec.name}
                      onClick={() => handleUploadSection(sec.name)}
                      disabled={!sec.file || uploadingSection === sec.name}
                      className="btn-secondary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {uploadingSection === sec.name
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading Section {sec.name}...</>
                        : <><Upload className="w-4 h-4" /> Upload Section {sec.name}</>
                      }
                    </button>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Step 6 — Done */}
          {step === 6 && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-700 py-8 text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-200">
                  <Check className="w-6 h-6 text-white" strokeWidth={3} />
                </div>
              </div>
              <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">Batch Ready!</h3>
              <p className="text-slate-500 max-w-sm mx-auto">
                <strong>{createdBatch?.name}</strong> created with {sectionDefs.length} section(s) and <strong>{totalUploaded}</strong> students enrolled.
              </p>

              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 max-w-sm mx-auto text-left">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Next Steps</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-sm font-medium text-slate-700">Batch & sections created</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-sm font-medium text-slate-700">Student rosters uploaded</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full border-2 border-sky-400 shrink-0" />
                    <span className="text-sm font-bold text-slate-800">Set subjects → go to Curriculum</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />
                    <span className="text-sm text-slate-500">Assign teachers → go to Allocations</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        {step < 5 && (
          <div className="flex justify-between items-center mt-10 pt-6 border-t border-slate-100">
            <button
              onClick={() => setStep((p) => Math.max(p - 1, 1))}
              disabled={step === 1}
              className="btn-secondary disabled:opacity-0 disabled:pointer-events-none"
            >
              Back
            </button>
            {step < 4 ? (
              <button
                onClick={() => setStep((p) => p + 1)}
                disabled={!canAdvance()}
                className="btn-primary flex items-center gap-2 disabled:opacity-60"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleCreateBatch}
                disabled={isCreating || sectionDefs.length === 0}
                className="btn-primary flex items-center gap-2 disabled:opacity-60"
              >
                {isCreating
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
                  : <><FolderPlus className="w-4 h-4" /> Create Batch</>
                }
              </button>
            )}
          </div>
        )}

        {step === 5 && (
          <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-100">
            <span className="text-sm text-slate-500">
              {Object.keys(uploadResults).length}/{sectionDefs.length} sections uploaded
            </span>
            <div className="flex gap-3">
              <button
                onClick={handleUploadAll}
                className="btn-primary flex items-center gap-2"
                disabled={uploadingSection !== null}
              >
                {uploadingSection ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                {uploadingSection ? "Uploading..." : "Upload All & Finish"}
              </button>
              <button onClick={() => setStep(6)} className="btn-secondary">
                Skip &amp; Finish
              </button>
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="flex justify-center gap-3 mt-8 pt-6 border-t border-slate-100">
            <button onClick={() => navigate("/admin/allocation")} className="btn-primary flex items-center gap-2 px-8">
              Go to Allocations <ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={() => navigate("/admin/batches")} className="btn-secondary">
              View Batches
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
