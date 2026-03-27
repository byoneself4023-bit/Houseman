import React from 'react';

interface FieldProps {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}

export const Field: React.FC<FieldProps> = ({ label, children, required }) => (
  <div className="mb-3.5">
    <div className="text-[11px] font-bold text-[#5F6577] mb-[5px]">
      {label}
      {required && <span className="text-[#DC2626]"> *</span>}
    </div>
    {children}
  </div>
);

export const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 8,
  border: '1.5px solid #E0E3E9',
  fontSize: 13,
  fontFamily: 'inherit',
  outline: 'none',
};
