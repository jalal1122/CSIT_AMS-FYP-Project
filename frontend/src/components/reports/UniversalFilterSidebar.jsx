import React, { useState, useEffect } from "react";
import Select from "react-select";
import { Filter, Calendar, Users, BookOpen, Layers } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllocations, fetchBatches } from "../../store/slices/academicSlice";
import { fetchDepartments, fetchDisciplines } from "../../store/slices/systemSlice";
import { fetchTeachers } from "../../store/slices/facultySlice";
import api from "../../services/api";

const TIMEFRAMES = [
  { value: "Full Semester", label: "Full Semester" },
  { value: "Last Month", label: "Last Month" },
  { value: "Last Week", label: "Last Week" },
  { value: "Custom Date Range", label: "Custom Date Range" }
];

export default function UniversalFilterSidebar({ onFilterChange, userRole }) {
  const dispatch = useDispatch();
  const { allocations, batches } = useSelector(state => state.academic);
  const { teachers } = useSelector(state => state.faculty);

  const [timeframe, setTimeframe] = useState(TIMEFRAMES[0]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedBatches, setSelectedBatches] = useState([]);
  const [selectedSections, setSelectedSections] = useState([]);
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [selectedDisciplines, setSelectedDisciplines] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [allStudents, setAllStudents] = useState([]);

  const { departments, disciplines } = useSelector(state => state.system);

  useEffect(() => {
    // Fetch all allocations (not just active) for historical report filtering
    dispatch(fetchAllocations({}));
    dispatch(fetchBatches({}));
    if (userRole === "admin" || userRole === "hod") {
      dispatch(fetchDepartments());
      dispatch(fetchDisciplines());
      dispatch(fetchTeachers());
    }
  }, [dispatch, userRole]);

  // Fetch students separately for admin
  useEffect(() => {
    if (userRole === "admin" || userRole === "teacher") {
      api.get("/api/v2/admin/users?role=student&limit=1000")
        .then(res => setAllStudents(res.data.data.users || res.data.data || []))
        .catch(() => setAllStudents([]));
    }
  }, [userRole]);

  // Derive Options dynamically from allocations
  const subjectOptions = Array.from(new Set(allocations.map(a => a.subjectId?._id)))
    .filter(Boolean)
    .map(id => {
      const subject = allocations.find(a => a.subjectId?._id === id)?.subjectId;
      return { value: id, label: subject?.name || "Unknown Subject" };
    });

  // Batch options from dedicated batches state (much more reliable than derived from allocations)
  const batchOptions = batches.map(b => ({ value: b._id, label: b.name }));

  // Extract Sections across all allocations
  const sectionSet = new Set();
  allocations.forEach(a => {
    a.sections?.forEach(s => {
      if (s.name) sectionSet.add(s.name);
    });
  });
  const sectionOptions = Array.from(sectionSet).sort().map(name => ({ value: name, label: `Section ${name}` }));

  // Teacher options from dedicated teachers state
  const teacherOptions = (teachers || []).map(t => ({ value: t._id, label: t.name }));

  // Student options from dedicated students fetch
  const studentOptions = allStudents.map(s => ({
    value: s._id,
    label: `${s.name} (${s.info?.rollNo || s.username || "No Roll"})`
  }));

  const departmentOptions = departments.map(d => ({ value: d._id, label: d.name }));
  const disciplineOptions = disciplines.map(d => ({ value: d._id, label: d.name }));
  const semesterOptions = Array.from({ length: 8 }, (_, i) => ({ value: i + 1, label: `Semester ${i + 1}` }));

  const handleApply = () => {
    onFilterChange({
      timeframe: timeframe.value,
      filters: {
        subjects: selectedSubjects.map(s => s.value),
        batches: selectedBatches.map(b => b.value),
        sections: selectedSections.map(s => s.value),
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
    <div className="card bg-white border-slate-200 shadow-sm p-3.5 sm:p-5 h-full">
      <div className="flex items-center gap-2 mb-4 sm:mb-6 border-b pb-3 sm:pb-4">
        <Filter className="w-5 h-5 text-indigo-500 shrink-0" />
        <h2 className="font-bold text-slate-800 text-base sm:text-lg">Universal Filters</h2>
      </div>
      
      <div className="space-y-4 sm:space-y-6">
        {/* Timeframe */}
        <div>
          <label className="text-xs font-bold uppercase text-slate-500 mb-1.5 sm:mb-2 flex items-center gap-2">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Start</label>
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

        {/* Sections - For Teachers and Admins */}
        {(userRole === "teacher" || userRole === "admin") && (
          <div>
            <label className="text-xs font-bold uppercase text-slate-500 mb-2 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5" /> Sections
            </label>
            <Select 
              isMulti
              options={sectionOptions}
              value={selectedSections}
              onChange={setSelectedSections}
              placeholder="All Sections..."
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

        {/* Teachers - For Admins (was incorrectly "student || admin" before) */}
        {(userRole === "teacher" || userRole === "admin") && (
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
