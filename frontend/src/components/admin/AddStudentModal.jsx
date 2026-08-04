import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createStudent, updateStudent } from "../../store/slices/studentSlice";
import { fetchBatches } from "../../store/slices/academicSlice";
import { addToast } from "../../store/slices/toastSlice";
import { X, Save } from "lucide-react";

export default function AddStudentModal({ student, onClose }) {
  const dispatch = useDispatch();
  const { batches } = useSelector((state) => state.academic);
  const { isLoading } = useSelector((state) => state.student);
  
  const isEdit = !!student;

  const [formData, setFormData] = useState({
    name: student?.name || "",
    username: student?.username || "",
    email: student?.email || "",
    password: "",
    info: {
      rollNo: student?.info?.rollNo || "",
      batchId: student?.info?.batchId?._id || student?.info?.batchId || "",
      section: student?.info?.section || "",
      departmentId: student?.info?.departmentId?._id || student?.info?.departmentId || "",
      disciplineId: student?.info?.disciplineId?._id || student?.info?.disciplineId || "",
      semester: student?.info?.semester || 1,
    }
  });

  useEffect(() => {
    dispatch(fetchBatches());
  }, [dispatch]);

  const handleBatchChange = (e) => {
    const batchId = e.target.value;
    const selectedBatch = batches?.find(b => b._id === batchId);
    setFormData(prev => ({
      ...prev,
      info: {
        ...prev.info,
        batchId,
        departmentId: selectedBatch?.departmentId || prev.info.departmentId,
        disciplineId: selectedBatch?.disciplineId || prev.info.disciplineId,
        semester: selectedBatch?.currentSemester || 1,
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.username || !formData.email || !formData.info.rollNo || !formData.info.batchId || !formData.info.section) {
      dispatch(addToast({ message: "Please fill all required fields", type: "error" }));
      return;
    }
    if (!isEdit && !formData.password) {
      dispatch(addToast({ message: "Password is required for new students", type: "error" }));
      return;
    }

    try {
      const payload = { ...formData };
      if (isEdit) delete payload.password; // Don't update password here

      if (isEdit) {
        await dispatch(updateStudent({ id: student._id, data: payload })).unwrap();
        dispatch(addToast({ message: "Student updated successfully", type: "success" }));
      } else {
        await dispatch(createStudent(payload)).unwrap();
        dispatch(addToast({ message: "Student created successfully", type: "success" }));
      }
      onClose(true);
    } catch (error) {
      dispatch(addToast({ message: error || "Failed to save student", type: "error" }));
    }
  };

  const availableSections = batches?.find(b => b._id === formData.info.batchId)?.sections || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-800">{isEdit ? "Edit Student" : "Add Student"}</h3>
            <p className="text-sm text-slate-500">{isEdit ? "Update student details" : "Register a new student manually"}</p>
          </div>
          <button onClick={() => onClose(false)} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
              <input 
                type="text" 
                className="input w-full py-2" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Roll No</label>
              <input 
                type="text" 
                className="input w-full py-2 uppercase" 
                value={formData.info.rollNo} 
                onChange={(e) => setFormData({...formData, info: {...formData.info, rollNo: e.target.value}})}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Username</label>
              <input 
                type="text" 
                className="input w-full py-2" 
                value={formData.username} 
                onChange={(e) => setFormData({...formData, username: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
              <input 
                type="email" 
                className="input w-full py-2" 
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            {!isEdit && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
                <input 
                  type="password" 
                  className="input w-full py-2" 
                  value={formData.password} 
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
            )}
            
            <div className="md:col-span-2 mt-4 pt-4 border-t border-slate-100">
              <h4 className="font-semibold text-slate-700 mb-4">Academic Info</h4>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Batch</label>
              <select 
                className="input w-full py-2" 
                value={formData.info.batchId} 
                onChange={handleBatchChange}
              >
                <option value="">Select Batch</option>
                {batches?.map(b => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Section</label>
              <select 
                className="input w-full py-2" 
                value={formData.info.section} 
                onChange={(e) => setFormData({...formData, info: {...formData.info, section: e.target.value}})}
                disabled={!formData.info.batchId}
              >
                <option value="">Select Section</option>
                {availableSections.map(sec => (
                  <option key={sec.name} value={sec.name}>Section {sec.name}</option>
                ))}
              </select>
            </div>
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
              disabled={isLoading}
              className="btn-primary flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> {isEdit ? "Save Changes" : "Create Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
