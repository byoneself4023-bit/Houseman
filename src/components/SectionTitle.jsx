export const SectionTitle = ({ children, sub }) => (
  <div style={{ marginBottom: 16 }}>
    <h2 style={{ fontSize: 17, fontWeight: 800, color: "#1A1D23", letterSpacing: "-0.02em" }}>{children}</h2>
    {sub && <p style={{ fontSize: 12, color: "#8F95A3", marginTop: 3 }}>{sub}</p>}
  </div>
);
