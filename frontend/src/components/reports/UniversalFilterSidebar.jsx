import React, { useState, useEffect } from "react";
import Select from "react-select";
import { Filter, Calendar, Users, BookOpen, Layers } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllocations } from "../../store/slices/academicSlice";
import { fetchDepartments, fetchDisciplines } from "../../store/slices/systemSlice";

const TIMEFRAMES = [
  { value: "Full Semester", label: "Full Semester" },
  { value: "Last Month", label: "Last Month" },
  { value: "Last Week", label: "Last Week" },
  { value: "Custom Date Range", label: "Custom Date Range" }
];

export default function UniversalFilterSidebar({ onFilterChange, userRole }) {
  const dispatch = useDispatch();
  const { allocations } = useSelector(state => state.academic);

  const [timeframe, setTimeframe] = useState(TIMEFRAMES[0]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedBatches, setSelectedBatches] = useState([]);
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
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

  // Derive Options dynamically from allocations
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

  // Extract Teachers across all sections
  const teacherSet = new Map();
  allocations.forEach(a => {
    a.sections?.forEach(s => {
      if (s.teacherId && !teacherSet.has(s.teacherId._id)) {
        teacherSet.set(s.teacherId._id, s.teacherId.name);
      }
    });
  });
  const teacherOptions = Array.from(teacherSet.entries()).map(([id, name]) => ({ value: id, label: name }));

  // Extract Students across all sections
  const studentSet = new Map();
  allocations.forEach(a => {
    a.sections?.forEach(s => {
      s.students?.forEach(student => {
        if (!studentSet.has(student._id)) {
          studentSet.set(student._id, `${student.name} (${student.info?.rollNo || "No Roll"})`);
        }
      });
    });
  });
  const studentOptions = Array.from(studentSet.entries()).map(([id, name]) => ({ value: id, label: name }));

  const departmentOptions = departments.map(d => ({ value: d._id, label: d.name }));
  const disciplineOptions = disciplines.map(d => ({ value: d._id, label: d.name }));
  const semesterOptions = Array.from({ length: 8 }, (_, i) => ({ value: i + 1, label: `Semester ${i + 1}` }));

  const handleApply = () => {
    onFilterChange({
      timeframe: timeframe.value,
      filters: {
        subjects: selectedSubjects.map(s => s.value),
        batches: selectedBatches.map(b => b.value),
        teachers: selectedTeachers.map(t => t.value),
        students: selectedStudents.map(s => s.value),
        departments: selectedDepartments.map(d => d.value),
        disciplines: selectedDisciplines.map(d => d.value),
        semester: selectedSemester?.value || null,
        startDate: timeframe.value === "Custom Date Range" ? startDate : null,
        endDate: timeframe.value === "Custom Date Range" ? endDate : null
      }
    });
  };

  return (
    <div className="card bg-white border-slate-200 shadow-sm p-5 h-full">
      <div className="flex items-center gap-2 mb-6 border-b pb-4">
        <Filter className="w-5 h-5 text-indigo-500" />
        <h2 className="font-bold text-slate-800 text-lg">Universal Filters</h2>
      </div>
      
      <div className="space-y-6">
        {/* Timeframe */}
        <div>
          <label className="text-xs font-bold uppercase text-slate-500 mb-2 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" /> Timeframe
          </label>
          <Select 
            options={TIMEFRAMES} 
            value={timeframe}
            onChange={setTimeframe}
            className="text-sm"
          />
        </div>

        {/* Custom Date Range */}
        {timeframe.value === "Custom Date Range" && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Start</label>
              <input 
                type="date" 
                className="input px-2 py-1.5 w-full text-xs"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">End</label>
              <input 
                type="date" 
                className="input px-2 py-1.5 w-full text-xs"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Subjects - For everyone */}
        <div>
          <label className="text-xs font-bold uppercase text-slate-500 mb-2 flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5" /> Subjects
          </label>
          <Select 
            isMulti
            options={subjectOptions}
            value={selectedSubjects}
            onChange={setSelectedSubjects}
            placeholder="All Subjects..."
            className="text-sm"
          />
        </div>

        {/* Departments - For Admin and HOD */}
        {(userRole === "admin" || userRole === "hod") && (
          <div>
            <label className="text-xs font-bold uppercase text-slate-500 mb-2 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5" /> Departments
            </label>
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
            <label className="text-xs font-bold uppercase text-slate-500 mb-2 flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5" /> Disciplines
            </label>
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
          <label className="text-xs font-bold uppercase text-slate-500 mb-2 flex items-center gap-2">
            <Layers className="w-3.5 h-3.5" /> Semester
          </label>
          <Select 
            isClearable
            options={semesterOptions}
            value={selectedSemester}
            onChange={setSelectedSemester}
            placeholder="All Semesters..."
            className="text-sm"
          />
        </div>

        {/* Batches - For Teachers and Admins */}
        {(userRole === "teacher" || userRole === "admin") && (
          <div>
            <label className="text-xs font-bold uppercase text-slate-500 mb-2 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5" /> Batches
            </label>
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

        {/* Students - For Teachers and Admins */}
        {(userRole === "teacher" || userRole === "admin") && (
          <div>
            <label className="text-xs font-bold uppercase text-slate-500 mb-2 flex items-center gap-2">
              <Users className="w-3.5 h-3.5" /> Students
            </label>
            <Select 
              isMulti
              options={studentOptions}
              value={selectedStudents}
              onChange={setSelectedStudents}
              placeholder="All Students..."
              className="text-sm"
            />
          </div>
        )}

        {/* Teachers - For Students and Admins */}
        {(userRole === "student" || userRole === "admin") && (
          <div>
            <label className="text-xs font-bold uppercase text-slate-500 mb-2 flex items-center gap-2">
              <Users className="w-3.5 h-3.5" /> Teachers
            </label>
            <Select 
              isMulti
              options={teacherOptions}
              value={selectedTeachers}
              onChange={setSelectedTeachers}
              placeholder="All Teachers..."
              className="text-sm"
            />
          </div>
        )}
      </div>

      <div className="mt-8">
        <button 
          onClick={handleApply}
          className="btn-primary w-full py-2.5 shadow-sm font-semibold"
        >
          Generate Report
        </button>
      </div>
    </div>
  );
}
