export const Table = ({ columns, data, onRowClick, groupBy }) => (
  <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid #E8ECF0" }}>
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, tableLayout: "fixed" }}>
      <thead>
        <tr style={{ background: "#F7F8FA" }}>
          {columns.map((col, i) => (
            <th key={i} style={{ padding: "5px 2px", textAlign: col.align || "left", fontWeight: 700, color: "#5F6577", fontSize: 11, borderBottom: "1px solid #E8ECF0", whiteSpace: "nowrap", width: col.width || "auto" }}>
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, ri) => {
          const showGroup = groupBy && (ri === 0 || groupBy(row) !== groupBy(data[ri - 1]));
          return [
            showGroup && (
              <tr key={`g-${ri}`}>
                <td colSpan={columns.length} style={{ padding: "8px 12px", background: "#F0F2F5", fontWeight: 800, fontSize: 12, color: "#1A1D23", borderBottom: "2px solid #D1D5DB" }}>
                  {groupBy(row)}
                </td>
              </tr>
            ),
            <tr key={ri} onClick={() => onRowClick?.(row)}
              style={{ borderBottom: "1px solid #F0F2F5", cursor: onRowClick ? "pointer" : "default", transition: "background 0.1s" }}
              onMouseEnter={e => e.currentTarget.style.background = "#F9FAFB"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              {columns.map((col, ci) => (
                <td key={ci} style={{ padding: "4px 2px", textAlign: col.align || "left", color: "#2D3142", whiteSpace: "nowrap", width: col.width || "auto" }}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ];
        })}
      </tbody>
    </table>
  </div>
);
