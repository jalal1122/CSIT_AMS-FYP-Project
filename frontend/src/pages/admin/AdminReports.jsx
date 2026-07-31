import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Download, FileSpreadsheet, TrendingUp, AlertOctagon, Filter, Calendar } from "lucide-react";
import EmptyState from "../../components/shared/EmptyState";
import { fetchAllocations } from "../../store/slices/academicSlice";
import { exportAdminReport } from "../../store/slices/analyticsSlice";
import toast from "react-hot-toast";

export default function AdminReports() {
  const dispatch = useDispatch();
  const { allocations } = useSelector((state) => state.academic);
  
  const [selectedAllocation, setSelectedAllocation] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    dispatch(fetchAllocations({ isActive: true }));
  }, [dispatch]);

  const currentAllocation = allocations.find(a => a._id === selectedAllocation);

  const handleExport = (reportType, format) => {
    if (!selectedAllocation || !selectedSection) {
      toast.error("Please select a class and section first.");
      return;
    }

    dispatch(exportAdminReport({
      reportType,
      allocationId: selectedAllocation,
      sectionName: selectedSection,
      startDate,
      endDate,
      format
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Analytics & Reports</h2>
          <p className="text-slate-500 text-sm mt-1">Export attendance data and analyze defaulter trends</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button 
            onClick={() => handleExport("defaulters", "xlsx")}
            className="flex-1 md:flex-none btn-secondary flex items-center justify-center gap-2 border-amber-200 text-amber-700 hover:bg-amber-50"
          >
            <AlertOctagon className="w-4 h-4" /> Export Defaulters
          </button>
          <button 
            onClick={() => handleExport("classMatrix", "pdf")}
            className="flex-1 md:flex-none btn-secondary flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" /> PDF Report
          </button>
          <button 
            onClick={() => handleExport("classMatrix", "xlsx")}
            className="flex-1 md:flex-none btn-primary flex items-center justify-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export Excel
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-slate-400" />
          <h3 className="font-semibold text-slate-700">Report Filters</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Class Allocation</label>
            <select 
              className="input cursor-pointer py-2.5 w-full"
              value={selectedAllocation}
              onChange={(e) => {
                setSelectedAllocation(e.target.value);
                setSelectedSection("");
              }}
            >
              <option value="">Select Class...</option>
              {allocations.map(alloc => (
                <option key={alloc._id} value={alloc._id}>
                  {alloc.subjectId?.name} ({alloc.batchId?.name})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Section</label>
            <select 
              className="input cursor-pointer py-2.5 w-full"
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              disabled={!selectedAllocation}
            >
              <option value="">Select Section...</option>
              {currentAllocation?.sections?.map(sec => (
                <option key={sec.name} value={sec.name}>{sec.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Start Date</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input 
                type="date" 
                className="input pl-10 py-2.5 w-full"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">End Date</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input 
                type="date" 
                className="input pl-10 py-2.5 w-full"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-0 flex flex-col min-h-[500px]">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800">Summary Matrix</h3>
          </div>
          <div className="flex-1 flex items-center justify-center p-6 bg-slate-50/30">
            <EmptyState 
              icon={TrendingUp} 
              title={selectedSection ? "Ready to export" : "Select filters to generate report"}
              subtitle={selectedSection ? "Click Export Excel to download the Class Matrix." : "Data will appear here once you select specific criteria."}
            />
          </div>
        </div>
        
        <div className="card p-0 flex flex-col min-h-[500px] border-amber-200">
          <div className="px-6 py-4 border-b border-amber-100 bg-amber-50/50 flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-amber-900">Defaulters List</h3>
          </div>
          
          <div className="flex-1 flex items-center justify-center p-6 bg-amber-50/10">
            <div className="text-center text-slate-500">
              {selectedSection ? (
                <p className="text-sm font-medium">Click Export Defaulters to download the list of students with &lt; 75% attendance.</p>
              ) : (
                <p className="text-sm font-medium">No filters selected.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
