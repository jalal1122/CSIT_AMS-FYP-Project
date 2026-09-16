import { useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { useDropzone } from "react-dropzone";
import {
  X, Plus, Trash2, Archive, ArchiveRestore, Upload,
  Loader2, Check, FileSpreadsheet, Users, AlertCircle
} from "lucide-react";
import {
  addSection, deleteSection, archiveSection, uploadSectionStudents
} from "../../store/slices/academicSlice.js";
import { addToast } from "../../store/slices/toastSlice.js";
import { fetchBatchDetails } from "../../store/slices/academicSlice.js";

// ─── Per-Section Upload Zone ────────────────────────────────────────────────
function SectionUploadZone({ sectionName, batchId, onSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const dispatch = useDispatch();

  const onDrop = useCallback((accepted) => {
    if (accepted?.length > 0) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "text/csv": [".csv"],
    },
    maxFiles: 1,
    disabled: uploading,
  });

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const result = await dispatch(uploadSectionStudents({ batchId, sectionName, file })).unwrap();
      dispatch(addToast({
        title: "Upload Success",
        message: `${result.inserted} students added to section ${sectionName}`,
        type: result.duplicates?.length > 0 ? "warning" : "success",
      }));
      onSuccess(result);
      setFile(null);
    } catch (err) {
      dispatch(addToast({ title: "Upload Failed", message: err, type: "error" }));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-3 space-y-2">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
          isDragActive ? "border-sky-400 bg-sky-50" : file ? "border-sky-300 bg-sky-50/50" : "border-slate-200 hover:border-sky-300"
        }`}
      >
        <input {...getInputProps()} />
        {file ? (
          <div className="flex items-center justify-center gap-2 text-sm font-semibold text-sky-700">
            <FileSpreadsheet className="w-4 h-4" />
            {file.name}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Drop Excel/CSV or <span className="text-sky-600 font-semibold">browse</span></p>
        )}
      </div>
      {file && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="btn-primary w-full flex items-center justify-center gap-2 py-2 text-sm"
        >
          {uploading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
            : <><Upload className="w-4 h-4" /> Upload to Section {sectionName}</>
          }
        </button>
      )}
    </div>
  );
}

// ─── Main Modal ─────────────────────────────────────────────────────────────
export default function BatchSectionsModal({ batch, onClose }) {
  const [newSectionName, setNewSectionName] = useState("");
  const [nameError, setNameError] = useState("");
  const [expandedUpload, setExpandedUpload] = useState(null);
  const [actionLoading, setActionLoading] = useState(null); // sectionName being acted on
  const dispatch = useDispatch();

  const handleAddSection = async () => {
    const name = newSectionName.trim();
    if (!name) { setNameError("Section name is required"); return; }
    if (name.length > 30) { setNameError("Max 30 characters"); return; }

    const exists = batch.sections.some(
      (s) => s.name.toUpperCase() === name.toUpperCase()
    );
    if (exists) { setNameError("Section already exists"); return; }

    setActionLoading(`add-${name}`);
    try {
      await dispatch(addSection({ batchId: batch._id, name })).unwrap();
      dispatch(addToast({ title: "Section Added", message: `Section "${name}" added`, type: "success" }));
      setNewSectionName("");
      setNameError("");
      dispatch(fetchBatchDetails(batch._id));
    } catch (err) {
      dispatch(addToast({ title: "Error", message: err, type: "error" }));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (sectionName) => {
    setActionLoading(`del-${sectionName}`);
    try {
      await dispatch(deleteSection({ batchId: batch._id, sectionName })).unwrap();
      dispatch(addToast({ title: "Deleted", message: `Section "${sectionName}" removed`, type: "success" }));
      dispatch(fetchBatchDetails(batch._id));
    } catch (err) {
      dispatch(addToast({ title: "Cannot Delete", message: err, type: "error" }));
    } finally {
      setActionLoading(null);
    }
  };

  const handleArchiveToggle = async (sec) => {
    const doArchive = sec.status === "active";
    setActionLoading(`arch-${sec.name}`);
    try {
      await dispatch(archiveSection({ batchId: batch._id, sectionName: sec.name, archive: doArchive })).unwrap();
      dispatch(addToast({
        title: doArchive ? "Archived" : "Restored",
        message: `Section "${sec.name}" ${doArchive ? "archived" : "restored"}`,
        type: "success",
      }));
      dispatch(fetchBatchDetails(batch._id));
    } catch (err) {
      dispatch(addToast({ title: "Error", message: err, type: "error" }));
    } finally {
      setActionLoading(null);
    }
  };

  const sections = batch?.sections || [];
  const activeCount = sections.filter((s) => s.status === "active").length;
  const totalStudents = sections.reduce((acc, s) => acc + (s.studentCount || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300">

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Manage Sections</h2>
            <p className="text-slate-500 text-sm mt-0.5">
              {batch.name} &mdash; {activeCount} active section(s) &bull; {totalStudents} total students
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* Add Section */}
          {batch.isActive && (
            <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4">
              <p className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-sky-500" /> Add New Section
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. D or Evening"
                  className="input flex-1 text-sm py-2"
                  value={newSectionName}
                  onChange={(e) => { setNewSectionName(e.target.value); setNameError(""); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddSection(); }}}
                  maxLength={30}
                />
                <button
                  onClick={handleAddSection}
                  disabled={actionLoading?.startsWith("add")}
                  className="btn-primary px-4 flex items-center gap-1.5 text-sm"
                >
                  {actionLoading?.startsWith("add")
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Plus className="w-4 h-4" />
                  }
                  Add
                </button>
              </div>
              {nameError && <p className="text-rose-500 text-xs mt-1">{nameError}</p>}
            </div>
          )}

          {/* Sections list */}
          {sections.length === 0 ? (
            <div className="text-center py-10 text-slate-400">No sections in this batch.</div>
          ) : (
            sections.map((sec) => {
              const isArchived = sec.status === "archived";
              const isEmpty = (sec.studentCount || 0) === 0;
              const isActing = actionLoading?.endsWith(sec.name);

              return (
                <div
                  key={sec.name}
                  className={`border rounded-2xl overflow-hidden transition-all ${
                    isArchived ? "border-slate-200 bg-slate-50/50 opacity-70" : "border-slate-200 bg-white"
                  }`}
                >
                  {/* Section row */}
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                        isArchived ? "bg-slate-200 text-slate-500" : "bg-sky-100 text-sky-700"
                      }`}>
                        {sec.name[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">Section {sec.name}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {sec.studentCount || 0} students
                          {isArchived && <span className="ml-1 text-slate-400 font-medium">• Archived</span>}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Upload toggle */}
                      {batch.isActive && !isArchived && (
                        <button
                          onClick={() => setExpandedUpload(expandedUpload === sec.name ? null : sec.name)}
                          className="p-2 hover:bg-sky-50 text-sky-600 hover:text-sky-700 rounded-lg transition-colors"
                          title="Upload students"
                        >
                          <Upload className="w-4 h-4" />
                        </button>
                      )}

                      {/* Archive toggle */}
                      {batch.isActive && (
                        <button
                          onClick={() => handleArchiveToggle(sec)}
                          disabled={isActing}
                          className={`p-2 rounded-lg transition-colors ${
                            isArchived
                              ? "hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700"
                              : "hover:bg-amber-50 text-amber-500 hover:text-amber-600"
                          }`}
                          title={isArchived ? "Restore section" : "Archive section"}
                        >
                          {isActing && actionLoading?.startsWith("arch")
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : isArchived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />
                          }
                        </button>
                      )}

                      {/* Delete (only if empty) */}
                      <button
                        onClick={() => handleDelete(sec.name)}
                        disabled={!isEmpty || isActing}
                        className={`p-2 rounded-lg transition-colors ${
                          isEmpty
                            ? "hover:bg-rose-50 text-rose-500 hover:text-rose-600"
                            : "text-slate-200 cursor-not-allowed"
                        }`}
                        title={isEmpty ? "Delete section" : `Cannot delete — ${sec.studentCount} student(s) enrolled`}
                      >
                        {isActing && actionLoading?.startsWith("del")
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Trash2 className="w-4 h-4" />
                        }
                      </button>
                    </div>
                  </div>

                  {/* Upload zone (expanded) */}
                  {expandedUpload === sec.name && (
                    <div className="px-4 pb-4 border-t border-slate-100">
                      <SectionUploadZone
                        sectionName={sec.name}
                        batchId={batch._id}
                        onSuccess={() => {
                          setExpandedUpload(null);
                          dispatch(fetchBatchDetails(batch._id));
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Empty-section note */}
          {sections.some((s) => (s.studentCount || 0) === 0 && s.status === "active") && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>Empty sections are auto-archived when the batch is marked as completed. You can also archive or delete them manually now.</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 flex justify-end">
          <button onClick={onClose} className="btn-secondary">Done</button>
        </div>
      </div>
    </div>
  );
}
