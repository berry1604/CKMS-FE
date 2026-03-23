import type { ReactNode } from "react";

export interface Column<T> {
  header: ReactNode | string;
  accessorKey?: keyof T;
  cell?: (item: T) => ReactNode;
  className?: string;
  headerClassName?: string;
  cellClassName?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string | number;
  isLoading?: boolean;
  emptyMessage?: ReactNode;
  onRowClick?: (item: T) => void;
  className?: string;
  layout?: "auto" | "fixed";
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  isLoading = false,
  emptyMessage = "No data available",
  onRowClick,
  className,
  layout = "auto",
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div
        className={`w-full h-48 flex items-center justify-center text-gray-400 ${className}`}
      >
        Loading...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div
        className={`w-full h-48 flex items-center justify-center text-gray-400 border border-zinc-800 rounded-lg bg-zinc-900/50 ${className}`}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-x-auto shadow-sm rounded-lg border border-zinc-800 ${className}`}
    >
      <table
        className={`w-full text-sm text-left text-gray-400 ${layout === "fixed" ? "table-fixed" : "table-auto"}`}
      >
        <thead className="text-xs text-gray-300 uppercase bg-zinc-900/50 border-b border-zinc-800">
          <tr>
            {columns.map((col, index) => (
              <th
                key={index}
                scope="col"
                className={`${col.headerClassName || "px-6 py-3"} ${col.className || ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr
              key={keyExtractor(item)}
              className={`bg-zinc-900 border-b border-zinc-800 hover:bg-zinc-800/50 ${onRowClick ? "cursor-pointer" : ""}`}
              onClick={() => onRowClick && onRowClick(item)}
            >
              {columns.map((col, index) => (
                <td
                  key={index}
                  className={`${col.cellClassName || "px-6 py-4"} ${col.className || ""}`}
                >
                  {col.cell
                    ? col.cell(item)
                    : col.accessorKey
                      ? String(item[col.accessorKey])
                      : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
