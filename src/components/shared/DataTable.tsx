import { type ReactNode } from 'react';

/**
 * Type-safe column definition for DataTable
 * @template T - The type of data in the table rows
 */
export interface Column<T> {
  /** Column header text */
  header: string;
  /** Key to access the value from row data */
  accessor: keyof T | string;
  /** Text alignment */
  align?: 'left' | 'right' | 'center';
  /** Custom render function for the cell */
  render?: (value: unknown, row: T) => ReactNode;
}

/**
 * Props for the DataTable component
 * @template T - The type of data in the table rows
 */
export interface DataTableProps<T> {
  /** Column definitions */
  columns: Column<T>[];
  /** Array of data to display */
  data: T[];
  /** Message to display when data is empty */
  emptyMessage?: string;
  /** Icon to display when data is empty */
  emptyIcon?: ReactNode;
  /** Callback when a row is clicked */
  onRowClick?: (row: T) => void;
  /** Function to extract a unique key from each row (defaults to 'id' field) */
  getRowKey?: (row: T, index: number) => string | number;
}

/**
 * Generic DataTable component with type-safe column definitions
 * @template T - The type of data in the table rows
 */
export function DataTable<T extends { id?: string | number }>({ 
  columns, 
  data, 
  emptyMessage = 'No data found',
  emptyIcon,
  onRowClick,
  getRowKey = (row, index) => row.id ?? index,
}: DataTableProps<T>) {
  const getNestedValue = (obj: T, path: string): unknown => {
    return path.split('.').reduce((acc: unknown, part) => {
      if (acc && typeof acc === 'object' && part in acc) {
        return (acc as Record<string, unknown>)[part];
      }
      return undefined;
    }, obj);
  };

  return (
    <div className="bg-white border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((column, index) => (
                <th 
                  key={String(column.accessor) || index}
                  className={`px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.align === 'right' ? 'text-right' : 
                    column.align === 'center' ? 'text-center' : 
                    'text-left'
                  }`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                  {emptyIcon && <div className="flex justify-center mb-2">{emptyIcon}</div>}
                  <p className="text-xs">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr 
                  key={getRowKey(row, rowIndex)} 
                  className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column, colIndex) => {
                    const accessor = String(column.accessor);
                    const value = getNestedValue(row, accessor);
                    return (
                      <td 
                        key={accessor || colIndex}
                        className={`px-4 py-2.5 text-xs ${
                          column.align === 'right' ? 'text-right' : 
                          column.align === 'center' ? 'text-center' : 
                          'text-left'
                        }`}
                      >
                        {column.render 
                          ? column.render(value, row)
                          : String(value ?? '')
                        }
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
