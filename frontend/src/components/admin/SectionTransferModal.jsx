import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchBatchSections, transferStudent } from "../../store/slices/studentSlice";
import { addToast } from "../../store/slices/toastSlice";
import { X, Save, RefreshCw } from "lucide-react";

export default function SectionTransferModal({ student, onClose }) {
  const dispatch = useDispatch();
  const { batchSections, isLoading } = useSelector((state) => state.student);
  const [selectedSection, setSelectedSection] = useState("");

  useEffect(() => {
    if (student?.info?.batchId?._id || student?.info?.batchId) {
      const batchId = student.info.batchId._id || student.info.batchId;
      dispatch(fetchBatchSections(batchId));
    }
  }, [dispatch, student]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSection) {
      dispatch(addToast({ message: "Please select a section", type: "error" }));
      return;
    }
    
    try {
      await dispatch(transferStudent({ id: student._id, newSection: selectedSection })).unwrap();
      dispatch(addToast({ message: "Student transferred successfully", type: "success" }));
      onClose(true); // pass true to indicate success
    } catch (error) {
      dispatch(addToast({ message: error || "Failed to transfer student", type: "error" }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-800">Change Section</h3>
            <p className="text-sm text-slate-500">Transfer student to a new section</p>
          </div>
          <button onClick={() => onClose(false)} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <p className="text-sm font-medium text-slate-600">Student</p>
            <p className="text-slate-900 font-bold">{student.name}</p>
            <p className="text-xs text-slate-500">{student.info?.rollNo} • Current: Section {student.info?.section}</p>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-700">Available Sections</label>
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500 py-4">
                <RefreshCw className="w-4 h-4 animate-spin" /> Loading sections...
              </div>
            ) : batchSections?.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {batchSections.map((sec) => (
                  <label 
                    key={sec.name}
                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedSection === sec.name 
                        ? 'border-sky-500 bg-sky-50 text-sky-700' 
                        : 'border-slate-200 hover:border-sky-300'
                    } ${student.info?.section === sec.name ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <input 
                      type="radio" 
                      name="section" 
                      value={sec.name} 
                      disabled={student.info?.section === sec.name}
                      checked={selectedSection === sec.name}
                      onChange={(e) => setSelectedSection(e.target.value)}
                      className="mr-3"
                    />
                    <span className="font-medium">Section {sec.name}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-rose-500 py-2">No sections found for this batch.</p>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <button 
              type="button" 
              onClick={() => onClose(false)} 
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isLoading || !selectedSection}
              className="btn-primary flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Transfer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
