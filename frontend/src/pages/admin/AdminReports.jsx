import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Download, FileSpreadsheet, TrendingUp, AlertOctagon, Filter, Calendar } from "lucide-react";
import EmptyState from "../../components/shared/EmptyState";
import { fetchAllocations, fetchBatches } from "../../store/slices/academicSlice";
import { fetchDepartments, fetchDisciplines } from "../../store/slices/systemSlice";
import { exportAdminReport, fetchComprehensiveReport } from "../../store/slices/analyticsSlice";
import toast from "react-hot-toast";
import ReportGraphicalView from "../../components/admin/ReportGraphicalView";

export default function AdminReports() {
  const dispatch = useDispatch();
  const { allocations, batches } = useSelector((state) => state.academic);
  const { departments, disciplines } = useSelector((state) => state.system);
  const { comprehensiveReport, isLoading } = useSelector((state) => state.analytics);
  
  const [reportLevel, setReportLevel] = useState("class"); // "department", "discipline", "batch", "class"
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedDiscipline, setSelectedDiscipline] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedAllocation, setSelectedAllocation] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    dispatch(fetchDepartments());
    dispatch(fetchDisciplines());
    dispatch(fetchBatches());
    dispatch(fetchAllocations({ isActive: true }));
  }, [dispatch]);

  useEffect(() => {
    // Only fetch if we have selected the required fields for the chosen level
    let canFetch = false;
    const filters = {
      groupBy: reportLevel,
      startDate,
      endDate
    };

    if (reportLevel === "department" && selectedDepartment) {
      canFetch = true;
      filters.departmentId = selectedDepartment;
    } else if (reportLevel === "discipline" && selectedDiscipline) {
      canFetch = true;
      filters.disciplineId = selectedDiscipline;
    } else if (reportLevel === "batch" && selectedBatch) {
      canFetch = true;
      filters.batchId = selectedBatch;
    } else if (reportLevel === "class" && selectedAllocation) {
      canFetch = true;
      filters.allocationId = selectedAllocation;
      if (selectedSection) filters.section = selectedSection;
    }

    if (canFetch) {
      dispatch(fetchComprehensiveReport(filters));
    }
  }, [reportLevel, selectedDepartment, selectedDiscipline, selectedBatch, selectedAllocation, selectedSection, startDate, endDate, dispatch]);

  const currentAllocation = allocations.find(a => a._id === selectedAllocation);
  const currentDepartmentDisciplines = disciplines.filter(d => d.departmentId?._id === selectedDepartment);
  const currentDisciplineBatches = batches.filter(b => b.disciplineId?._id === selectedDiscipline);

  const handleExport = (reportType, format) => {
    if (!selectedAllocation) {
      toast.error("Export is currently supported at the Class level only.");
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
          <p className="text-slate-500 text-sm mt-1">Analyze multi-level attendance trends and defaulters</p>
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
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Report Level</label>
            <select 
              className="input cursor-pointer py-2.5 w-full"
              value={reportLevel}
              onChange={(e) => {
                setReportLevel(e.target.value);
                setSelectedDepartment("");
                setSelectedDiscipline("");
                setSelectedBatch("");
                setSelectedAllocation("");
                setSelectedSection("");
              }}
            >
              <option value="department">Department</option>
              <option value="discipline">Discipline</option>
              <option value="batch">Batch</option>
              <option value="class">Class</option>
            </select>
          </div>

          {(reportLevel === "department" || reportLevel === "discipline" || reportLevel === "batch") && (
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Department</label>
              <select 
                className="input cursor-pointer py-2.5 w-full"
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
              >
                <option value="">Select Department...</option>
                {departments?.map(d => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>
          )}

          {(reportLevel === "discipline" || reportLevel === "batch") && (
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Discipline</label>
              <select 
                className="input cursor-pointer py-2.5 w-full"
                value={selectedDiscipline}
                onChange={(e) => setSelectedDiscipline(e.target.value)}
                disabled={!selectedDepartment}
              >
                <option value="">Select Discipline...</option>
                {currentDepartmentDisciplines?.map(d => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>
          )}

          {reportLevel === "batch" && (
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Batch</label>
              <select 
                className="input cursor-pointer py-2.5 w-full"
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                disabled={!selectedDiscipline}
              >
                <option value="">Select Batch...</option>
                {currentDisciplineBatches?.map(b => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}

          {reportLevel === "class" && (
            <>
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
                  <option value="">All Sections</option>
                  {currentAllocation?.sections?.map(sec => (
                    <option key={sec.name} value={sec.name}>{sec.name}</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Start Date</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input 
                type="date" 
                className="input pl-10 py-2.5 w-full text-sm"
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
                className="input pl-10 py-2.5 w-full text-sm"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-0 flex flex-col min-h-[500px]">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">
              {reportLevel === 'class' ? 'Summary Matrix' : `${reportLevel.charAt(0).toUpperCase() + reportLevel.slice(1)} Comparison`}
            </h3>
            {isLoading && (
              <span className="flex items-center gap-2 text-sm text-sky-600 font-medium">
                <div className="w-4 h-4 border-2 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
                Loading data...
              </span>
            )}
          </div>
          <div className="flex-1 bg-slate-50/30">
            {comprehensiveReport ? (
              <ReportGraphicalView data={comprehensiveReport} />
            ) : (
              <EmptyState 
                icon={TrendingUp} 
                title={"Select filters to generate report"}
                subtitle={"Data will appear here once you select specific criteria."}
              />
            )}
          </div>
        </div>
        
        <div className="card p-0 flex flex-col min-h-[500px] border-amber-200">
          <div className="px-6 py-4 border-b border-amber-100 bg-amber-50/50 flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-amber-900">Defaulters List</h3>
          </div>
          
          <div className="flex-1 flex flex-col overflow-hidden bg-amber-50/10">
            {isLoading && !comprehensiveReport ? (
              <div className="flex-1 flex items-center justify-center text-slate-500">Loading...</div>
            ) : comprehensiveReport && comprehensiveReport.defaulters?.length > 0 ? (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {comprehensiveReport.defaulters.map((d, i) => (
                  <div key={i} className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{d.studentName || d.studentId}</p>
                      <p className="text-xs text-slate-500">
                        {d.studentId ? `${d.studentId} • ` : ''} 
                        {reportLevel === 'class' ? `Section ${d.section || 'All'}` : d.section}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-rose-600 font-bold text-sm">{d.attendancePercentage}%</span>
                      <p className="text-[10px] text-slate-400">{d.present}/{d.total} present</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-6 text-center text-slate-500">
                <p className="text-sm font-medium">No defaulters found for this selection.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
