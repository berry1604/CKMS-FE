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
  emptyMessage = "Không có dữ liệu",
  onRowClick,
  className,
  layout = "auto",
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div
        className={`w-full h-48 flex items-center justify-center text-[var(--text-secondary)] ${className}`}
      >
        Đang tải...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div
        className={`w-full h-48 flex items-center justify-center text-[var(--text-secondary)] border border-[var(--border-primary)] rounded-lg bg-[var(--bg-card)]/50 ${className}`}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-x-auto shadow-sm rounded-lg border border-[var(--border-primary)] ${className}`}
    >
      <table
        className={`w-full text-sm text-left text-[var(--text-secondary)] ${layout === "fixed" ? "table-fixed" : "table-auto"}`}
      >
        <thead className="text-xs text-[var(--text-primary)] uppercase bg-[var(--bg-card)] border-b border-[var(--border-primary)]">
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
              className={`bg-[var(--bg-card)] border-b border-[var(--border-primary)] hover:bg-[var(--text-primary)]/5 ${onRowClick ? "cursor-pointer" : ""}`}
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
