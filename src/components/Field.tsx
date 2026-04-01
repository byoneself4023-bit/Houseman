import React from 'react';

interface FieldProps {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}

export const Field: React.FC<FieldProps> = ({ label, children, required }) => (
  <div className="mb-3.5">
    <div className="text-xs font-bold text-hm-text-sub mb-[5px]">
      {label}
      {required && <span className="text-hm-danger"> *</span>}
    </div>
    {children}
  </div>
);

export const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 8,
  border: '1.5px solid var(--color-hm-input-border)',
  fontSize: 14,
  fontFamily: 'inherit',
  outline: 'none',
};

export const inputClassName = 'w-full px-3 py-[9px] rounded-lg border-[1.5px] border-hm-input-border text-sm font-[inherit] outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors';
