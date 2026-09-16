import { useState } from "react";
import { useDispatch } from "react-redux";
import { X, Skull, AlertTriangle, Loader2 } from "lucide-react";
import { deleteBatch } from "../../store/slices/academicSlice.js";
import { addToast } from "../../store/slices/toastSlice.js";

const CONFIRMATION_WORD = "DELETE";

export default function DeleteBatchModal({ batch, onClose, onSuccess }) {
  const [confirmName, setConfirmName] = useState("");
  const [confirmWord, setConfirmWord] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const nameMatch = confirmName.trim() === batch.name;
  const wordMatch = confirmWord.trim() === CONFIRMATION_WORD;
  const canDelete = nameMatch && wordMatch;

  const handleDelete = async () => {
    if (!canDelete) return;
    setLoading(true);
    try {
      const result = await dispatch(deleteBatch({ id: batch._id, confirmName: confirmName.trim() })).unwrap();
      dispatch(addToast({
        title: "Batch Deleted",
        message: `"${batch.name}" and all its data have been permanently deleted.`,
        type: "success",
      }));
      onSuccess?.();
      onClose();
    } catch (err) {
      dispatch(addToast({ title: "Deletion Failed", message: err, type: "error" }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-300">

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-red-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <Skull className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Delete Batch Permanently</h2>
              <p className="text-red-500 text-sm font-medium">This action cannot be undone</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Danger warning */}
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-sm text-red-800 space-y-1">
                <p className="font-bold">The following will be permanently deleted:</p>
                <ul className="list-disc list-inside space-y-0.5 text-red-700">
                  <li>All student accounts in this batch</li>
                  <li>All course allocations</li>
                  <li>All attendance sessions and records</li>
                  <li>The batch itself</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Confirm batch name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Step 1 — Type the batch name:{" "}
              <span className="font-mono text-red-700 bg-red-50 px-1.5 py-0.5 rounded">{batch.name}</span>
            </label>
            <input
              type="text"
              placeholder="Type exact batch name..."
              className={`input w-full ${
                confirmName && nameMatch
                  ? "border-emerald-400 focus:ring-emerald-300"
                  : confirmName
                  ? "border-red-300 focus:ring-red-200"
                  : ""
              }`}
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Confirm DELETE word */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Step 2 — Type{" "}
              <span className="font-mono font-black text-red-700 bg-red-50 px-1.5 py-0.5 rounded tracking-wider">DELETE</span>{" "}
              to confirm
            </label>
            <input
              type="text"
              placeholder="Type DELETE..."
              className={`input w-full ${
                confirmWord && wordMatch
                  ? "border-emerald-400 focus:ring-emerald-300"
                  : confirmWord
                  ? "border-red-300 focus:ring-red-200"
                  : ""
              }`}
              value={confirmWord}
              onChange={(e) => setConfirmWord(e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={handleDelete}
            disabled={!canDelete || loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-red-200 disabled:shadow-none"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</>
              : <><Skull className="w-4 h-4" /> Permanently Delete</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
