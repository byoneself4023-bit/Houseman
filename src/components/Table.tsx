import React from 'react';
import { cn } from '@/lib/utils';

export interface TableColumn<T> {
  key?: keyof T & string;
  label: string;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  render?: (row: T) => React.ReactNode;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  groupBy?: (row: T) => string;
}

const alignClass = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
} as const;

export const Table = <T extends Record<string, any>>({
  columns,
  data,
  onRowClick,
  groupBy,
}: TableProps<T>): React.ReactElement => (
  <div className="overflow-x-auto rounded-[10px] border border-hm-border">
    <table className="w-full border-collapse text-xs table-fixed">
      <thead>
        <tr className="bg-hm-bg-muted">
          {columns.map((col, i) => (
            <th
              key={i}
              className={cn(
                'px-0.5 py-[5px] font-bold text-[11px] text-hm-text-sub border-b border-hm-border whitespace-nowrap',
                alignClass[col.align || 'left'],
              )}
              style={{ width: col.width || 'auto' }}
            >
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, ri) => {
          const showGroup = groupBy && (ri === 0 || groupBy(row) !== groupBy(data[ri - 1]));
          return [
            showGroup && (
              <tr key={`g-${ri}`}>
                <td
                  colSpan={columns.length}
                  className="px-3 py-2 bg-[#F0F2F5] font-extrabold text-xs text-hm-text border-b-2 border-[#D1D5DB]"
                >
                  {groupBy!(row)}
                </td>
              </tr>
            ),
            <tr
              key={ri}
              onClick={() => onRowClick?.(row)}
              className={cn(
                'border-b border-[#F0F2F5] transition-colors duration-100',
                onRowClick && 'cursor-pointer',
                'hover:bg-hm-bg-hover',
              )}
            >
              {columns.map((col, ci) => (
                <td
                  key={ci}
                  className={cn(
                    'px-0.5 py-1 text-[#2D3142] whitespace-nowrap',
                    alignClass[col.align || 'left'],
                  )}
                  style={{ width: col.width || 'auto' }}
                >
                  {col.render ? col.render(row) : col.key ? row[col.key] : null}
                </td>
              ))}
            </tr>,
          ];
        })}
      </tbody>
    </table>
  </div>
);
