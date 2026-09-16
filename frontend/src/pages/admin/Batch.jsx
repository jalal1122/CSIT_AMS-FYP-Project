import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchBatches, updateBatch, fetchBatchDetails } from "../../store/slices/academicSlice.js";
import { addToast } from "../../store/slices/toastSlice.js";
import {
  GraduationCap, Plus, Edit, X, Save, Users, BookOpen,
  ChevronRight, Layers, ToggleLeft, ToggleRight, Search,
  LayoutGrid, CheckCircle, Trash2
} from "lucide-react";
import Badge from "../../components/shared/Badge";
import EmptyState from "../../components/shared/EmptyState";
import BatchSectionsModal from "../../components/admin/BatchSectionsModal.jsx";
import CompleteBatchModal from "../../components/admin/CompleteBatchModal.jsx";
import DeleteBatchModal from "../../components/admin/DeleteBatchModal.jsx";

function EditBatchModal({ batch, onClose, onSuccess }) {
  const dispatch = useDispatch();
  const [name, setName] = useState(batch.name || "");
  const [capacity, setCapacity] = useState(batch.maxStudentsPerSection || 50);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsLoading(true);
    try {
      await dispatch(updateBatch({ id: batch._id, data: { name: name.trim(), maxStudentsPerSection: capacity } })).unwrap();
      dispatch(addToast({ title: "Success", message: "Batch updated successfully", type: "success" }));
      onSuccess();
      onClose();
    } catch (err) {
      dispatch(addToast({ title: "Error", message: err, type: "error" }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl relative z-10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600">
              <Edit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Edit Batch</h2>
              <p className="text-xs text-slate-500 mt-0.5">Update batch name and section capacity</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Batch Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="input py-2.5 w-full"
              placeholder="e.g. CSIT - Fall 2024"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Max Students Per Section
            </label>
            <input
              type="number"
              min="10"
              max="200"
              required
              value={capacity}
              onChange={e => setCapacity(parseInt(e.target.value, 10) || "")}
              className="input py-2.5 w-full text-center font-semibold"
            />
            <p className="text-xs text-slate-400 mt-1.5">
              Changing capacity affects section size logic for future allocations. Existing sections are unaffected.
            </p>
          </div>

          {/* Read-only info */}
          <div className="bg-slate-50 rounded-xl p-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Department</p>
              <p className="font-semibold text-slate-700 mt-0.5">{batch.departmentId?.name || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Discipline</p>
              <p className="font-semibold text-slate-700 mt-0.5">{batch.disciplineId?.name || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Current Semester</p>
              <p className="font-semibold text-slate-700 mt-0.5">Semester {batch.currentSemester}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Starting Year</p>
              <p className="font-semibold text-slate-700 mt-0.5">{batch.startingYear}</p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Batch() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { batches, isLoading, currentBatch } = useSelector(state => state.academic);
  const [editingBatch, setEditingBatch] = useState(null);
  const [sectionsModal, setSectionsModal] = useState(null);   // batch object
  const [completeModal, setCompleteModal] = useState(null);   // batch object
  const [deleteModal, setDeleteModal] = useState(null);       // batch object
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActive, setFilterActive] = useState("all"); // "all" | "active" | "inactive"

  useEffect(() => {
    dispatch(fetchBatches({}));
  }, [dispatch]);

  const openSectionsModal = async (batch) => {
    await dispatch(fetchBatchDetails(batch._id));
    setSectionsModal(batch);
  };

  const filteredBatches = (batches || []).filter(b => {
    const matchSearch =
      b.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.departmentId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.disciplineId?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchActive =
      filterActive === "all" ||
      (filterActive === "active" && b.isActive) ||
      (filterActive === "inactive" && !b.isActive);

    return matchSearch && matchActive;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Batch Management</h2>
          <p className="text-slate-500 text-sm mt-1">
            View, edit existing batches or create a new one
          </p>
        </div>
        <button
          onClick={() => navigate("/admin/batch/create")}
          className="btn-primary flex items-center gap-2 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Create New Batch
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search batches by name, department or discipline..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          {["all", "active", "inactive"].map(f => (
            <button
              key={f}
              onClick={() => setFilterActive(f)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${
                filterActive === f
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Batch Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Batches", value: batches.length, icon: GraduationCap, color: "sky" },
          { label: "Active Batches", value: batches.filter(b => b.isActive).length, icon: ToggleRight, color: "emerald" },
          { label: "Inactive Batches", value: batches.filter(b => !b.isActive).length, icon: ToggleLeft, color: "slate" },
          { label: "Disciplines", value: new Set(batches.map(b => b.disciplineId?._id)).size, icon: BookOpen, color: "indigo" },
        ].map(stat => (
          <div key={stat.label} className="card p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl bg-${stat.color}-100 flex items-center justify-center text-${stat.color}-600 shrink-0`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
              <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Batch Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500">Loading batches...</div>
          ) : filteredBatches.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="No batches found"
              subtitle={searchQuery ? "Try adjusting your search" : "Create your first batch to get started."}
              actionLabel="Create New Batch"
              onAction={() => navigate("/admin/batch/create")}
            />
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-sky-50/50 border-b border-slate-200 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Batch Name</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Discipline</th>
                  <th className="px-6 py-4 text-center">Semester</th>
                  <th className="px-6 py-4 text-center">Capacity / Section</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBatches.map(batch => (
                  <tr key={batch._id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center text-sky-700 shrink-0">
                          <GraduationCap className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{batch.name}</p>
                          <p className="text-xs text-slate-400">Started {batch.startingYear}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {batch.departmentId?.name || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        {batch.disciplineId?.name || "—"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 font-bold text-sm">
                        {batch.currentSemester > 0 ? batch.currentSemester : "✓"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 text-sm text-slate-600">
                        <LayoutGrid className="w-3.5 h-3.5 text-slate-400" />
                        {batch.sections?.length || 0} sections
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant={batch.isActive ? "success" : "neutral"}>
                        {batch.currentSemester === 0 ? "Completed" : batch.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingBatch(batch)}
                          className="p-1.5 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-md transition-colors"
                          title="Edit Batch"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openSectionsModal(batch)}
                          className="p-1.5 text-slate-400 hover:text-violet-500 hover:bg-violet-50 rounded-md transition-colors"
                          title="Manage Sections"
                        >
                          <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate("/admin/allocation")}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-sky-100 text-slate-600 hover:text-sky-700 rounded-lg text-xs font-medium transition-colors"
                          title="Manage Allocations"
                        >
                          Allocations <ChevronRight className="w-3 h-3" />
                        </button>
                        {batch.isActive && batch.currentSemester > 0 && (
                          <button
                            onClick={() => setCompleteModal(batch)}
                            className="p-1.5 text-amber-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                            title="Mark as Completed"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {(!batch.isActive || (batch.sections?.length > 0 && batch.sections.every(s => s.studentCount === 0))) && (
                          <button
                            onClick={() => setDeleteModal(batch)}
                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                            title="Delete Batch"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingBatch && (
        <EditBatchModal
          batch={editingBatch}
          onClose={() => setEditingBatch(null)}
          onSuccess={() => dispatch(fetchBatches({}))}
        />
      )}

      {/* Sections Modal */}
      {sectionsModal && currentBatch && (
        <BatchSectionsModal
          batch={currentBatch}
          onClose={() => setSectionsModal(null)}
        />
      )}

      {/* Complete Batch Modal */}
      {completeModal && (
        <CompleteBatchModal
          batch={completeModal}
          onClose={() => setCompleteModal(null)}
          onSuccess={() => dispatch(fetchBatches({}))}
        />
      )}

      {/* Delete Batch Modal */}
      {deleteModal && (
        <DeleteBatchModal
          batch={deleteModal}
          onClose={() => setDeleteModal(null)}
          onSuccess={() => dispatch(fetchBatches({}))}
        />
      )}
    </div>
  );
}

