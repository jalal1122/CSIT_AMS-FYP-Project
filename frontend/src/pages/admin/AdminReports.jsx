import { Download, FileSpreadsheet, TrendingUp, AlertOctagon } from "lucide-react";

export default function AdminReports() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Analytics & Reports</h2>
          <p className="text-text-muted">Export attendance data and analyze defaulter trends</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-surface-light border border-white/10 text-white rounded-lg flex items-center gap-2 hover:bg-white/5 transition-colors">
            <Download className="w-4 h-4" /> PDF Report
          </button>
          <button className="bg-gradient-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-90">
            <FileSpreadsheet className="w-4 h-4" /> Export Excel
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass p-4 grid grid-cols-2 md:grid-cols-5 gap-4">
        <select className="bg-surface-light border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:ring-1 focus:ring-primary">
          <option>All Disciplines</option>
          <option>BS Information Technology</option>
        </select>
        <select className="bg-surface-light border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:ring-1 focus:ring-primary">
          <option>All Batches</option>
          <option>BSIT 2026</option>
        </select>
        <select className="bg-surface-light border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:ring-1 focus:ring-primary">
          <option>All Semesters</option>
          <option>Semester 3</option>
        </select>
        <select className="bg-surface-light border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:ring-1 focus:ring-primary">
          <option>All Subjects</option>
          <option>CS301 - Data Structures</option>
        </select>
        <select className="bg-surface-light border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:ring-1 focus:ring-primary">
          <option>All Sections</option>
          <option>Section A</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass p-6 min-h-[400px] flex flex-col items-center justify-center text-text-muted border-dashed border-2 border-white/5">
          <TrendingUp className="w-12 h-12 mb-4 opacity-50" />
          <p className="text-lg">Select filters to generate report</p>
          <p className="text-sm opacity-70 mt-1">Summary Matrix will appear here</p>
        </div>
        
        <div className="glass p-6">
          <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
            <AlertOctagon className="w-5 h-5 text-danger" />
            <h3 className="text-lg font-bold text-white">Defaulters List</h3>
          </div>
          
          <div className="text-center py-10 text-text-muted">
            <p className="text-sm">No filters selected.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
