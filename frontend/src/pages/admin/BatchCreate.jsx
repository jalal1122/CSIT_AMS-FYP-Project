import { useState, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useDropzone } from "react-dropzone";
import { Check, UploadCloud, FileSpreadsheet, ChevronRight, AlertCircle, Loader2 } from "lucide-react";
import * as xlsx from "xlsx";
import { fetchDepartments, fetchDisciplines } from "../../store/slices/systemSlice.js";
import { createBatch } from "../../store/slices/academicSlice.js";
import { addToast } from "../../store/slices/toastSlice.js";
import { useNavigate } from "react-router-dom";

export default function BatchCreate() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    departmentId: "",
    disciplineId: "",
    capacity: 50,
    file: null,
  });
  const [creationResult, setCreationResult] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { departments, disciplines } = useSelector((state) => state.system);

  useEffect(() => {
    dispatch(fetchDepartments());
    dispatch(fetchDisciplines());
  }, [dispatch]);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles?.length > 0) {
      setFormData(prev => ({ ...prev, file: acceptedFiles[0] }));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv']
    },
    maxFiles: 1
  });

  const downloadTemplate = () => {
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.aoa_to_sheet([
      ["Name", "Username", "Roll No"],
      ["Muhammad Ali", "CSIT-2022-001", "2022-001"],
      ["Fatima Khan", "CSIT-2022-002", "2022-002"],
    ]);
    xlsx.utils.book_append_sheet(wb, ws, "Students");
    xlsx.writeFile(wb, "student_template.xlsx");
  };

  const handleCreateBatch = async () => {
    setStep(5); // Loading step
    try {
      const data = new FormData();
      data.append("name", formData.name || `${disciplines.find(d => d._id === formData.disciplineId)?.code || 'Batch'} ${new Date().getFullYear()}`);
      data.append("departmentId", formData.departmentId);
      data.append("disciplineId", formData.disciplineId);
      data.append("maxStudentsPerSection", formData.capacity || 50);
      data.append("file", formData.file);

      const result = await dispatch(createBatch(data)).unwrap();
      setCreationResult(result);
      dispatch(addToast({ title: "Success", message: "Batch created successfully", type: "success" }));
      setStep(6);
    } catch (err) {
      dispatch(addToast({ title: "Error", message: err, type: "error" }));
      setStep(4); // Go back to file upload
    }
  };

  const nextStep = () => {
    if (step === 4) {
      handleCreateBatch();
    } else {
      setStep(prev => Math.min(prev + 1, 6));
    }
  };
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Create New Batch</h2>
        <p className="text-slate-500 mt-2 text-lg">Initialize a new batch, upload student roster, and auto-generate sections.</p>
      </div>

      {/* Stepper Header */}
      <div className="flex items-center justify-between mb-8 px-4 relative max-w-2xl mx-auto">
        <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-1 bg-slate-100 -z-10 rounded-full"></div>
        <div className="absolute left-4 top-1/2 -translate-y-1/2 h-1 bg-sky-500 -z-10 transition-all duration-500 ease-out rounded-full" style={{ width: `calc(${((step - 1) / 5) * 100}% - 2rem)` }}></div>
        
        {[1, 2, 3, 4, 5, 6].map((num) => {
          const isCompleted = step > num;
          const isActive = step === num;
          
          return (
            <div key={num} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
              isCompleted 
                ? "bg-sky-500 text-white shadow-md shadow-sky-200" 
                : isActive 
                  ? "bg-white text-sky-600 border-2 border-sky-500 shadow-sm" 
                  : "bg-white text-slate-400 border-2 border-slate-200"
            }`}>
              {isCompleted ? <Check className="w-5 h-5" /> : num}
            </div>
          )
        })}
      </div>

      <div className="card p-8 md:p-12 min-h-[400px] flex flex-col shadow-lg border-slate-200/60 max-w-2xl mx-auto w-full">
        <div className="flex-1 flex flex-col justify-center">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-xl font-bold text-slate-800 mb-6 text-center">Select Department</h3>
              <select 
                className="input text-lg py-3 shadow-sm cursor-pointer"
                value={formData.departmentId}
                onChange={e => setFormData({...formData, departmentId: e.target.value, disciplineId: ""})}
              >
                <option value="">Choose a department...</option>
                {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-xl font-bold text-slate-800 mb-6 text-center">Select Discipline</h3>
              <select 
                className="input text-lg py-3 shadow-sm cursor-pointer"
                value={formData.disciplineId}
                onChange={e => setFormData({...formData, disciplineId: e.target.value})}
              >
                <option value="">Choose a discipline...</option>
                {disciplines.filter(d => d.departmentId?._id === formData.departmentId || d.departmentId === formData.departmentId).map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
              <input 
                type="text" 
                placeholder="Optional Batch Name (e.g. Fall 2026)" 
                className="input text-lg py-3 mt-4 shadow-sm"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-xl font-bold text-slate-800 mb-2 text-center">Section Capacity</h3>
              <p className="text-slate-500 mb-6 text-center text-sm">How many students maximum per section? Sections (A, B, C...) will be auto-generated based on total roster size.</p>
              
              <input 
                type="number"
                min="10"
                max="200"
                className="input text-lg py-3 text-center font-semibold shadow-sm"
                value={formData.capacity}
                onChange={e => {
                  const val = e.target.value;
                  setFormData({...formData, capacity: val === "" ? "" : parseInt(val, 10)});
                }}
              />
              
              <div className="p-4 bg-sky-50 border border-sky-100 rounded-xl mt-6 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
                <p className="text-sm text-sky-800"><strong>Example:</strong> If you upload 120 students with a capacity of 50, the system will create Section A (50), Section B (50), and Section C (20).</p>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-bold text-slate-800">Upload Student Roster</h3>
                <button onClick={downloadTemplate} className="text-sm text-sky-600 hover:text-sky-700 hover:underline flex items-center gap-1 transition-colors font-medium">
                  <FileSpreadsheet className="w-4 h-4" /> Download Template
                </button>
              </div>
              
              <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ${
                  isDragActive 
                    ? "border-sky-500 bg-sky-50 scale-[1.02]" 
                    : "border-slate-300 hover:border-sky-400 bg-slate-50 hover:bg-slate-50/50"
                }`}
              >
                <input {...getInputProps()} />
                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 transition-colors ${isDragActive ? "bg-sky-100 text-sky-600" : "bg-white text-slate-400 shadow-sm"}`}>
                  <UploadCloud className="w-8 h-8" />
                </div>
                <p className="text-lg font-bold text-slate-700 mb-1">Drag & drop your Excel file here</p>
                <p className="text-sm text-slate-500">or click to browse from computer (.xlsx or .csv)</p>
              </div>

              {formData.file && (
                <div className="p-4 bg-white border border-emerald-200 rounded-xl flex items-center justify-between shadow-sm animate-in zoom-in-95">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-700">{formData.file.name}</p>
                      <p className="text-xs text-slate-500 font-medium">{(formData.file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Check className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 flex flex-col items-center justify-center py-12">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-slate-100 rounded-full"></div>
                <div className="w-20 h-20 border-4 border-sky-500 rounded-full border-t-transparent animate-spin absolute inset-0"></div>
                <Loader2 className="w-8 h-8 text-sky-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Processing Roster...</h3>
                <p className="text-slate-500">Parsing rows and generating sections.</p>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-700 text-center py-12">
              <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-200">
                  <Check className="w-8 h-8 text-white" strokeWidth={3} />
                </div>
              </div>
              <h3 className="text-3xl font-extrabold text-slate-800 mb-3 tracking-tight">Batch Created Successfully!</h3>
              <p className="text-slate-500 max-w-md mx-auto mb-8 text-lg">
                {creationResult?.batch?.name || "The batch"} has been initialized with {creationResult?.studentsCreated || 0} students across {creationResult?.sections?.length || 0} sections.
              </p>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        {step < 5 && (
          <div className="flex justify-between items-center mt-12 pt-6 border-t border-slate-100">
            <button 
              onClick={prevStep} 
              disabled={step === 1}
              className="btn-secondary disabled:opacity-0 disabled:pointer-events-none"
            >
              Back
            </button>
            <button 
              onClick={nextStep}
              disabled={(step === 1 && !formData.departmentId) || (step === 2 && !formData.disciplineId) || (step === 4 && !formData.file)}
              className="btn-primary flex items-center gap-2"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
        
        {step === 6 && (
          <div className="flex justify-center mt-8 pt-6 border-t border-slate-100">
            <button onClick={() => navigate('/admin/allocation')} className="btn-primary px-8 py-3 text-lg">
              Go to Allocations
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
