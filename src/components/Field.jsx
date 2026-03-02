export const Field = ({ label, children, required }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: "#5F6577", marginBottom: 5 }}>{label}{required && <span style={{ color: "#DC2626" }}> *</span>}</div>
    {children}
  </div>
);

export const inputStyle = { width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #E0E3E9", fontSize: 13, fontFamily: "inherit", outline: "none" };
