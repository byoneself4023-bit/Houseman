import React from 'react';

interface SectionTitleProps {
  children: React.ReactNode;
  sub?: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ children, sub }) => (
  <div className="flex items-center gap-3 mb-6">
    <div className="w-1 h-6 rounded-full bg-hm-primary" />
    <div>
      <h2 className="text-lg font-bold text-hm-gray-950 tracking-tight">{children}</h2>
      {sub && <p className="text-sm text-hm-gray-500 mt-0.5">{sub}</p>}
    </div>
  </div>
);
