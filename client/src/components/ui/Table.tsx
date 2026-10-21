import React from 'react';

export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full overflow-x-auto border border-[#E2E8F0] dark:border-[#23314B] rounded-xl bg-white dark:bg-[#131B2B] shadow-3xs">
      <table className={`w-full text-left text-xs text-[#202124] dark:text-[#F8FAFC] border-collapse ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
};

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <thead
      className={`bg-[#F8F9FA] dark:bg-[#0B0F17] border-b border-[#E2E8F0] dark:border-[#23314B] text-[11px] font-bold text-[#5F6368] dark:text-[#94A3B8] uppercase tracking-wider select-none ${className}`}
      {...props}
    >
      {children}
    </thead>
  );
};

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return <tbody className={`divide-y divide-[#E2E8F0] dark:divide-[#23314B] ${className}`} {...props}>{children}</tbody>;
};

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <tr
      className={`hover:bg-[#F1F3F4]/70 dark:hover:bg-[#1C263B]/70 transition-colors ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
};

export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <th
      className={`px-4 py-3.5 font-bold tracking-wider text-[#5F6368] dark:text-[#94A3B8] ${className}`}
      {...props}
    >
      {children}
    </th>
  );
};

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <td
      className={`px-4 py-3.5 align-middle text-[#202124] dark:text-[#F8FAFC] ${className}`}
      {...props}
    >
      {children}
    </td>
  );
};
