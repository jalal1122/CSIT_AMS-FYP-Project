import { useState } from "react";
import { useDispatch } from "react-redux";
import { X, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { completeBatch } from "../../store/slices/academicSlice.js";
import { addToast } from "../../store/slices/toastSlice.js";

export default function CompleteBatchModal({ batch, onClose, onSuccess }) {
  const [confirmInput, setConfirmInput] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const isMatch = confirmInput.trim() === batch.name;

  const handleComplete = async () => {
    if (!isMatch) return;
    setLoading(true);
    try {
      await dispatch(completeBatch(batch._id)).unwrap();
      dispatch(addToast({
        title: "Batch Completed",
        message: `"${batch.name}" has been marked as completed. Data preserved in reports.`,
        type: "success",
      }));
      onSuccess?.();
      onClose();
    } catch (err) {
      dispatch(addToast({ title: "Error", message: err, type: "error" }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-300">

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Complete Batch</h2>
              <p className="text-slate-500 text-sm">This will close all active allocations</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-sm text-amber-800">
                <p className="font-bold">What happens when you complete a batch:</p>
                <ul className="space-y-1 list-disc list-inside text-amber-700">
                  <li>Batch is marked inactive (hidden from allocation)</li>
                  <li>All active course allocations are deactivated</li>
                  <li>All data (students, sessions, attendance) is <strong>preserved</strong></li>
                  <li>Batch remains visible in analytics and reports</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Type the batch name to confirm: <span className="font-mono text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded">{batch.name}</span>
            </label>
            <input
              type="text"
              placeholder="Type exact batch name..."
              className={`input w-full transition-colors ${
                confirmInput && isMatch
                  ? "border-emerald-400 focus:ring-emerald-300"
                  : confirmInput
                  ? "border-rose-300 focus:ring-rose-200"
                  : ""
              }`}
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={handleComplete}
            disabled={!isMatch || loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Completing...</>
              : <><CheckCircle className="w-4 h-4" /> Confirm Completion</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
