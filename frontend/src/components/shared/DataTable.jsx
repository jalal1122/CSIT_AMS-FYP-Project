import React from 'react';
import EmptyState from './EmptyState';

const DataTable = ({ columns, data, emptyStateProps }) => {
  if (!data || data.length === 0) {
    return <EmptyState {...emptyStateProps} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gradient-to-r from-sky-500 to-sky-600 text-white text-xs uppercase tracking-wider font-semibold">
            {columns.map((col, idx) => (
              <th key={idx} className="px-6 py-4 rounded-tl-lg rounded-tr-lg first:rounded-tr-none last:rounded-tl-none">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-slate-100 hover:bg-sky-50 transition-colors">
              {columns.map((col, colIndex) => (
                <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                  {col.cell ? col.cell(row) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
