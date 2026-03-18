import { forwardRef } from 'react';

export const Card = forwardRef(({ children, style, onClick, id, className }, ref) => (
  <div ref={ref} id={id} className={className} onClick={onClick} style={{ background: "#fff", borderRadius: 14, border: "1px solid #E8ECF0", padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.04)", transition: "all 0.2s", cursor: onClick ? "pointer" : "default", ...style }}
    onMouseEnter={e => onClick && (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)")}
    onMouseLeave={e => onClick && (e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)")}>
    {children}
  </div>
));
