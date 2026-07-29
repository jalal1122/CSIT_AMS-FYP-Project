import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Check, UploadCloud, FileSpreadsheet, ChevronRight, AlertCircle } from "lucide-react";
import * as xlsx from "xlsx";

export default function BatchCreate() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    department: "",
    discipline: "",
    capacity: 50,
    file: null,
  });

  // Mock data
  const departments = [{ id: "1", name: "Computer Science" }];
  const disciplines = [{ id: "1", name: "BS Information Technology" }];

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

  const nextStep = () => setStep(prev => Math.min(prev + 1, 6));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-text-primary">Create New Batch</h2>
        <p className="text-text-muted mt-2">Initialize a new batch, upload student roster, and auto-generate sections.</p>
      </div>

      {/* Stepper Header */}
      <div className="flex items-center justify-between mb-8 px-4 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-white/10 -z-10"></div>
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-primary -z-10 transition-all duration-300" style={{ width: `${((step - 1) / 5) * 100}%` }}></div>
        
        {[1, 2, 3, 4, 5, 6].map((num) => (
          <div key={num} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
            step >= num ? "bg-primary text-white" : "bg-surface-light text-text-muted border border-white/20"
          }`}>
            {step > num ? <Check className="w-5 h-5" /> : num}
          </div>
        ))}
      </div>

      <div className="glass p-8 min-h-[400px] flex flex-col">
        <div className="flex-1">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="text-xl font-medium text-white mb-4">Select Department</h3>
              <select 
                className="w-full bg-surface-light border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-primary"
                value={formData.department}
                onChange={e => setFormData({...formData, department: e.target.value})}
              >
                <option value="">Choose a department...</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="text-xl font-medium text-white mb-4">Select Discipline</h3>
              <select 
                className="w-full bg-surface-light border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-primary"
                value={formData.discipline}
                onChange={e => setFormData({...formData, discipline: e.target.value})}
              >
                <option value="">Choose a discipline...</option>
                {disciplines.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="text-xl font-medium text-white mb-4">Section Capacity</h3>
              <p className="text-text-muted mb-4">How many students maximum per section? Sections (A, B, C...) will be auto-generated based on total roster size.</p>
              <input 
                type="number"
                min="10"
                max="200"
                className="w-full bg-surface-light border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-primary"
                value={formData.capacity}
                onChange={e => setFormData({...formData, capacity: parseInt(e.target.value) || 50})}
              />
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg mt-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-primary-light">Example: If you upload 120 students with a capacity of 50, the system will create Section A (50), Section B (50), and Section C (20).</p>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-medium text-white">Upload Student Roster</h3>
                <button onClick={downloadTemplate} className="text-sm text-secondary hover:text-white flex items-center gap-1 transition-colors">
                  <FileSpreadsheet className="w-4 h-4" /> Download Template
                </button>
              </div>
              
              <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
                  isDragActive ? "border-primary bg-primary/5" : "border-white/20 hover:border-white/40 bg-surface-light"
                }`}
              >
                <input {...getInputProps()} />
                <UploadCloud className={`w-12 h-12 mx-auto mb-4 ${isDragActive ? "text-primary" : "text-text-muted"}`} />
                <p className="text-lg font-medium text-white mb-1">Drag & drop your Excel file here</p>
                <p className="text-sm text-text-muted">or click to browse from computer (.xlsx or .csv)</p>
              </div>

              {formData.file && (
                <div className="p-4 bg-white/5 border border-white/10 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-6 h-6 text-secondary" />
                    <div>
                      <p className="font-medium text-white">{formData.file.name}</p>
                      <p className="text-xs text-text-muted">{(formData.file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <Check className="w-5 h-5 text-secondary" />
                </div>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-8 animate-in fade-in flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 border-4 border-white/10 border-t-primary rounded-full animate-spin"></div>
              <div className="text-center">
                <h3 className="text-xl font-medium text-white mb-2">Processing Roster...</h3>
                <p className="text-text-muted">Parsing 120 rows and generating 3 sections.</p>
              </div>
              {/* In a real scenario, this step auto-advances when API is done */}
              <button onClick={nextStep} className="text-xs text-text-muted hover:text-white mt-8">(Simulate Completion)</button>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-6 animate-in fade-in text-center py-8">
              <div className="w-20 h-20 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-secondary" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">Batch Created Successfully!</h3>
              <p className="text-text-muted max-w-md mx-auto mb-8">
                BS Information Technology 2026 has been initialized with 120 students across 3 sections (A, B, C).
              </p>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        {step < 5 && (
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/10">
            <button 
              onClick={prevStep} 
              disabled={step === 1}
              className="px-6 py-2.5 rounded-lg font-medium text-text-muted hover:text-white hover:bg-white/5 transition-colors disabled:opacity-0"
            >
              Back
            </button>
            <button 
              onClick={nextStep}
              disabled={(step === 1 && !formData.department) || (step === 2 && !formData.discipline) || (step === 4 && !formData.file)}
              className="bg-gradient-primary text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
        
        {step === 6 && (
          <div className="flex justify-center mt-8 pt-6 border-t border-white/10">
            <button className="bg-gradient-primary text-white px-8 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity">
              Go to Allocations
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
