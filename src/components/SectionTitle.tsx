import React from 'react';

interface SectionTitleProps {
  children: React.ReactNode;
  sub?: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ children, sub }) => (
  <div className="mb-4">
    <h2 className="text-[17px] font-extrabold text-hm-text tracking-tight">{children}</h2>
    {sub && <p className="text-xs text-hm-text-muted mt-0.5">{sub}</p>}
  </div>
);
