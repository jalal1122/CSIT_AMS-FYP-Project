import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchBatches, promoteBatch, rollbackBatch } from "../../store/slices/academicSlice.js";
import { addToast } from "../../store/slices/toastSlice.js";
import { ArrowUpRight, ShieldAlert, RotateCcw } from "lucide-react";
import Badge from "../../components/shared/Badge";
import EmptyState from "../../components/shared/EmptyState";

export default function Promotion() {
  const dispatch = useDispatch();
  const { batches, isLoading } = useSelector((state) => state.academic);

  useEffect(() => {
    dispatch(fetchBatches());
  }, [dispatch]);

  const handlePromote = async (id) => {
    if (!window.confirm("Are you sure you want to promote this batch? This will close all current allocations.")) return;
    try {
      await dispatch(promoteBatch(id)).unwrap();
      dispatch(fetchBatches());
      dispatch(addToast({ title: "Success", message: "Batch promoted successfully", type: "success" }));
    } catch (err) {
      dispatch(addToast({ title: "Error", message: err, type: "error" }));
    }
  };

  const handleRollback = async (id) => {
    if (!window.confirm("Are you sure you want to rollback this batch's promotion? This is a destructive action.")) return;
    try {
      await dispatch(rollbackBatch(id)).unwrap();
      dispatch(fetchBatches());
      dispatch(addToast({ title: "Success", message: "Batch rolled back successfully", type: "success" }));
    } catch (err) {
      dispatch(addToast({ title: "Error", message: err, type: "error" }));
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Semester Promotions</h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Advance batches to their next semester and close the current one</p>
        </div>
      </div>

      <div className="p-3.5 sm:p-5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 sm:gap-4">
        <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 text-rose-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-sm sm:text-base text-rose-800">High Impact Action</h4>
          <p className="text-xs sm:text-sm text-rose-700 mt-1 leading-relaxed">
            Promoting a batch permanently closes all current active allocations and live sessions for that batch. 
            Students will be moved to the next semester in the syllabus. Sections and student enrollments will be preserved, but you will need to assign courses and teachers for the new semester. This action cannot be easily undone.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-500">Loading...</div>
      ) : !batches || batches.length === 0 ? (
        <EmptyState icon={ArrowUpRight} title="No batches found" subtitle="Batches will appear here once created." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {batches.map(batch => (
            <div key={batch._id} className="card p-4 sm:p-6 group relative overflow-hidden flex flex-col h-full border-slate-200 hover:border-sky-300 hover:shadow-md transition-all">
              {/* Background glow */}
              <div className="absolute -right-12 -top-12 w-40 h-40 bg-sky-100/50 blur-3xl rounded-full pointer-events-none transition-opacity opacity-0 group-hover:opacity-100"></div>
              
              <div className="flex justify-between items-start mb-4 sm:mb-6">
                <span className="px-2.5 sm:px-3 py-1 bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-full shadow-sm">
                  Semester {batch.currentSemester}
                </span>
                <Badge variant="neutral">{batch.sections?.length || 0} Sections</Badge>
              </div>
              
              <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-6 sm:mb-8 flex-1 pr-2 break-words">{batch.name}</h3>
              
              <div className="flex items-center gap-2 sm:gap-3 mt-auto">
                <button onClick={() => handlePromote(batch._id)} disabled={batch.isCompleted} className={`flex-1 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 sm:gap-2 ${batch.isCompleted ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'btn-primary'}`}>
                  {batch.isCompleted ? 'Completed' : 'Promote'} <ArrowUpRight className="w-4 h-4" />
                </button>
                <button onClick={() => handleRollback(batch._id)} className="px-3 sm:px-4 py-2 sm:py-2.5 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-xs sm:text-sm font-semibold transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 flex items-center gap-1.5 shrink-0" title="Rollback Promotion">
                  <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
