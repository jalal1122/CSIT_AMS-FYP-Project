import { Download, FileSpreadsheet, TrendingUp, AlertOctagon, Filter } from "lucide-react";
import EmptyState from "../../components/shared/EmptyState";

export default function AdminReports() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Analytics & Reports</h2>
          <p className="text-slate-500 text-sm mt-1">Export attendance data and analyze defaulter trends</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none btn-secondary flex items-center justify-center gap-2">
            <Download className="w-4 h-4" /> PDF Report
          </button>
          <button className="flex-1 md:flex-none btn-primary flex items-center justify-center gap-2">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <select className="input cursor-pointer py-2.5">
            <option>All Disciplines</option>
            <option>BS Information Technology</option>
          </select>
          <select className="input cursor-pointer py-2.5">
            <option>All Batches</option>
            <option>BSIT 2026</option>
          </select>
          <select className="input cursor-pointer py-2.5">
            <option>All Semesters</option>
            <option>Semester 3</option>
          </select>
          <select className="input cursor-pointer py-2.5">
            <option>All Subjects</option>
            <option>CS301 - Data Structures</option>
          </select>
          <select className="input cursor-pointer py-2.5">
            <option>All Sections</option>
            <option>Section A</option>
          </select>
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
              title="Select filters to generate report" 
              subtitle="Data will appear here once you select specific criteria." 
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
              <p className="text-sm font-medium">No filters selected.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
