import React from 'react';

export type BadgeVariant =
  | 'teal'
  | 'sage'
  | 'blue'
  | 'lavender'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'charcoal';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'teal',
  size = 'md',
  dot = false,
  icon,
  className = '',
  ...props
}) => {
  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-0.5 gap-1.5',
  }[size];

  const variantStyles: Record<BadgeVariant, { bg: string; dot: string }> = {
    teal: {
      bg: 'bg-[#F0F7F6] text-[#1B453F] border border-[#DCECE9]',
      dot: 'bg-[#235952]',
    },
    sage: {
      bg: 'bg-[#F3F6F3] text-[#2E513F] border border-[#E4EBE4]',
      dot: 'bg-[#3F6850]',
    },
    blue: {
      bg: 'bg-[#F1F6FA] text-[#204B73] border border-[#E1EBF4]',
      dot: 'bg-[#2B6194]',
    },
    lavender: {
      bg: 'bg-[#F7F6FC] text-[#55508C] border border-[#ECEAF7]',
      dot: 'bg-[#6B65A8]',
    },
    emerald: {
      bg: 'bg-[#F0FDF4] text-[#15803D] border border-[#DCFCE7]',
      dot: 'bg-[#16A34A]',
    },
    amber: {
      bg: 'bg-[#FFFBEB] text-[#B45309] border border-[#FEF3C7]',
      dot: 'bg-[#D97706]',
    },
    rose: {
      bg: 'bg-[#FFF1F2] text-[#BE123C] border border-[#FFE4E6]',
      dot: 'bg-[#E11D48]',
    },
    charcoal: {
      bg: 'bg-[#F4F5F4] text-[#424B48] border border-[#E5E7E5]',
      dot: 'bg-[#5C6662]',
    },
  };

  const selected = variantStyles[variant] || variantStyles.teal;

  return (
    <span
      className={`inline-flex items-center font-bold rounded-full tracking-tight shrink-0 select-none ${selected.bg} ${sizeStyles} ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${selected.dot}`} />}
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
