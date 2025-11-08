
import React from 'react';

interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  rowKey: keyof T;
}

function Table<T extends { id: string | number }>({ columns, data, onRowClick, rowKey }: TableProps<T>) {
  return (
    <div className="overflow-x-auto bg-white rounded-xl shadow-md">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col, index) => (
              <th
                key={index}
                scope="col"
                className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item) => (
            <tr
              key={item[rowKey] as React.Key}
              onClick={() => onRowClick && onRowClick(item)}
              className={`${onRowClick ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}`}
            >
              {columns.map((col, index) => (
                <td key={index} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {col.render ? col.render(item) : (item[col.key as keyof T] as React.ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;