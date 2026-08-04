import React, { useState, useEffect } from "react";
import Select from "react-select";
import { Filter, Calendar } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllocations } from "../../store/slices/academicSlice";
import { fetchDepartments, fetchDisciplines } from "../../store/slices/systemSlice";

const TIMEFRAMES = [
  { value: "Full Semester", label: "Full Semester" },
  { value: "Last Month", label: "Last Month" },
  { value: "Last Week", label: "Last Week" },
  { value: "Custom Date Range", label: "Custom Date Range" }
];

export default function ReportFilterBar({ onFilterChange, userRole }) {
  const dispatch = useDispatch();
  const { allocations } = useSelector(state => state.academic);

  const [timeframe, setTimeframe] = useState(TIMEFRAMES[0]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedBatches, setSelectedBatches] = useState([]);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [selectedDisciplines, setSelectedDisciplines] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState(null);

  const { departments, disciplines } = useSelector(state => state.system);

  useEffect(() => {
    dispatch(fetchAllocations({ isActive: true }));
    if (userRole === "admin" || userRole === "hod") {
      dispatch(fetchDepartments());
      dispatch(fetchDisciplines());
    }
  }, [dispatch, userRole]);

  // Extract unique subjects and batches from allocations for dropdowns
  const subjectOptions = Array.from(new Set(allocations.map(a => a.subjectId?._id)))
    .filter(Boolean)
    .map(id => {
      const subject = allocations.find(a => a.subjectId?._id === id)?.subjectId;
      return { value: id, label: subject?.name || "Unknown Subject" };
    });

  const batchOptions = Array.from(new Set(allocations.map(a => a.batchId?._id)))
    .filter(Boolean)
    .map(id => {
      const batch = allocations.find(a => a.batchId?._id === id)?.batchId;
      return { value: id, label: batch?.name || "Unknown Batch" };
    });

  const departmentOptions = departments.map(d => ({ value: d._id, label: d.name }));
  const disciplineOptions = disciplines.map(d => ({ value: d._id, label: d.name }));
  const semesterOptions = Array.from({ length: 8 }, (_, i) => ({ value: i + 1, label: `Semester ${i + 1}` }));

  const handleApply = () => {
    onFilterChange({
      timeframe: timeframe.value,
      filters: {
        subjects: selectedSubjects.map(s => s.value),
        batches: selectedBatches.map(b => b.value),
        departments: selectedDepartments.map(d => d.value),
        disciplines: selectedDisciplines.map(d => d.value),
        semester: selectedSemester?.value || null,
        startDate: timeframe.value === "Custom Date Range" ? startDate : null,
        endDate: timeframe.value === "Custom Date Range" ? endDate : null
      }
    });
  };

  return (
    <div className="card p-5 border-slate-200 shadow-sm mb-6 bg-white">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 text-indigo-500" />
        <h3 className="font-bold text-slate-800">Dynamic Filters</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Timeframe */}
        <div>
          <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Timeframe</label>
          <Select 
            options={TIMEFRAMES} 
            value={timeframe}
            onChange={setTimeframe}
            className="text-sm"
          />
        </div>

        {/* Custom Date Range */}
        {timeframe.value === "Custom Date Range" && (
          <div className="col-span-1 md:col-span-2 lg:col-span-1 grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Start Date</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                <input 
                  type="date" 
                  className="input pl-8 py-2 w-full text-sm"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">End Date</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                <input 
                  type="date" 
                  className="input pl-8 py-2 w-full text-sm"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Subjects - For Teachers and Admins */}
        {(userRole === "teacher" || userRole === "admin" || userRole === "student") && (
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Filter by Subject</label>
            <Select 
              isMulti
              options={subjectOptions}
              value={selectedSubjects}
              onChange={setSelectedSubjects}
              placeholder="All Subjects..."
              className="text-sm"
            />
          </div>
        )}

        {/* Batches - For Teachers and Admins */}
        {(userRole === "teacher" || userRole === "admin") && (
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Filter by Batch</label>
            <Select 
              isMulti
              options={batchOptions}
              value={selectedBatches}
              onChange={setSelectedBatches}
              placeholder="All Batches..."
              className="text-sm"
            />
          </div>
        )}
        
        {/* Departments - For Admin and HOD */}
        {(userRole === "admin" || userRole === "hod") && (
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Filter by Department</label>
            <Select 
              isMulti
              options={departmentOptions}
              value={selectedDepartments}
              onChange={setSelectedDepartments}
              placeholder="All Departments..."
              className="text-sm"
            />
          </div>
        )}

        {/* Disciplines - For Admin and HOD */}
        {(userRole === "admin" || userRole === "hod") && (
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Filter by Discipline</label>
            <Select 
              isMulti
              options={disciplineOptions}
              value={selectedDisciplines}
              onChange={setSelectedDisciplines}
              placeholder="All Disciplines..."
              className="text-sm"
            />
          </div>
        )}

        {/* Semester */}
        <div>
          <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Semester</label>
          <Select 
            isClearable
            options={semesterOptions}
            value={selectedSemester}
            onChange={setSelectedSemester}
            placeholder="All Semesters..."
            className="text-sm"
          />
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <button 
          onClick={handleApply}
          className="btn-primary py-2 px-6 shadow-sm"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}
