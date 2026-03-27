import React from 'react';

interface SectionTitleProps {
  children: React.ReactNode;
  sub?: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ children, sub }) => (
  <div className="mb-4">
    <h2 className="text-[17px] font-extrabold text-[#1A1D23] tracking-tight">{children}</h2>
    {sub && <p className="text-xs text-[#8F95A3] mt-0.5">{sub}</p>}
  </div>
);
