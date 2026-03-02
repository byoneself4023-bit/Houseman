import { useRef, useState } from 'react';

const ACCEPT = ".pdf,.jpg,.jpeg,.png,.gif,.webp,.bmp,.tiff";
const ACCEPT_TYPES = /\.(pdf|jpe?g|png|gif|webp|bmp|tiff)$/i;
const isImage = (name) => /\.(jpg|jpeg|png|gif|webp|bmp|tiff)$/i.test(name);

export const ContractDropZone = ({ files = [], onAdd, onRemove }) => {
  const fileRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (fileList) => {
    const valid = Array.from(fileList).filter(f => ACCEPT_TYPES.test(f.name));
    if (valid.length > 0 && onAdd) onAdd(valid);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  };

  return (
    <div>
      <input ref={fileRef} type="file" accept={ACCEPT} multiple style={{ display: "none" }}
        onChange={e => { if (e.target.files.length > 0) handleFiles(e.target.files); e.target.value = ""; }} />

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragEnter={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        style={{
          padding: files.length > 0 ? "10px 12px" : "18px 12px",
          borderRadius: 10,
          border: `2px dashed ${dragging ? "#3B82F6" : "#D1D5DB"}`,
          background: dragging ? "#EFF6FF" : "#FAFBFC",
          cursor: "pointer",
          transition: "all 0.15s",
        }}
      >
        {files.length > 0 ? (
          <div>
            {/* File list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
              {files.map((f, i) => (
                <div key={i} onClick={e => e.stopPropagation()}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 8px", background: "#fff", borderRadius: 6, border: "1px solid #E8ECF0" }}>
                  <span style={{ fontSize: 13 }}>{isImage(f) ? "🖼️" : "📄"}</span>
                  <span style={{ fontSize: 11, color: "#1A1D23", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f}</span>
                  {onRemove && (
                    <button onClick={(e) => { e.stopPropagation(); onRemove(i); }}
                      style={{ width: 20, height: 20, borderRadius: 4, border: "none", background: "#FEE2E2", color: "#DC2626", fontSize: 11, cursor: "pointer", fontFamily: "inherit", lineHeight: 1, flexShrink: 0 }}>✕</button>
                  )}
                </div>
              ))}
            </div>
            {/* Add more hint */}
            <div style={{ textAlign: "center" }}>
              <span style={{ fontSize: 10, color: "#3B82F6", fontWeight: 600 }}>+ 클릭 또는 드래그하여 추가</span>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>📎</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#3B82F6", marginBottom: 2 }}>계약서를 드래그하거나 클릭하여 업로드</div>
            <div style={{ fontSize: 9, color: "#8F95A3" }}>여러장 가능 · PDF, JPG, PNG 등</div>
          </div>
        )}
      </div>
    </div>
  );
};
