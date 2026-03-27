import React, { useRef, useState } from 'react';

const ACCEPT = '.pdf,.jpg,.jpeg,.png,.gif,.webp,.bmp,.tiff';
const ACCEPT_TYPES = /\.(pdf|jpe?g|png|gif|webp|bmp|tiff)$/i;
const isImage = (name: string): boolean => /\.(jpg|jpeg|png|gif|webp|bmp|tiff)$/i.test(name);

interface ContractFile {
  name: string;
  dataUrl: string;
}

interface ContractDropZoneProps {
  files?: (ContractFile | string)[];
  onAdd?: (files: ContractFile[]) => void;
  onRemove?: (index: number) => void;
}

export const ContractDropZone: React.FC<ContractDropZoneProps> = ({
  files = [],
  onAdd,
  onRemove,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState<boolean>(false);
  const [previewFile, setPreviewFile] = useState<{ name: string; dataUrl: string } | null>(null);

  const handleFiles = (fileList: FileList): void => {
    const valid = Array.from(fileList).filter((f) => ACCEPT_TYPES.test(f.name));
    if (valid.length === 0) return;
    const results: ContractFile[] = [];
    let processed = 0;
    valid.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        results.push({ name: f.name, dataUrl: ev.target?.result as string });
        processed++;
        if (processed === valid.length && onAdd) onAdd(results);
      };
      reader.readAsDataURL(f);
    });
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  };

  const handleFileClick = (f: ContractFile | string, e: React.MouseEvent<HTMLDivElement>): void => {
    e.stopPropagation();
    const dataUrl = typeof f === 'object' ? f.dataUrl : null;
    const fname = typeof f === 'object' ? f.name : f;
    if (!dataUrl) return;
    setPreviewFile({ name: fname, dataUrl });
  };

  const getName = (f: ContractFile | string): string => (typeof f === 'object' ? f.name : f);
  const hasData = (f: ContractFile | string): boolean => typeof f === 'object' && !!f.dataUrl;

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept={ACCEPT}
        multiple
        style={{ display: 'none' }}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          if (e.target.files && e.target.files.length > 0) handleFiles(e.target.files);
          e.target.value = '';
        }}
      />

      {/* Drop zone */}
      <div
        onDragOver={(e: React.DragEvent<HTMLDivElement>) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragEnter={(e: React.DragEvent<HTMLDivElement>) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        style={{
          padding: files.length > 0 ? '10px 12px' : '18px 12px',
          borderRadius: 10,
          border: `2px dashed ${dragging ? '#3B82F6' : '#D1D5DB'}`,
          background: dragging ? '#EFF6FF' : '#FAFBFC',
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
      >
        {files.length > 0 ? (
          <div>
            {/* File list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
              {files.map((f, i) => (
                <div
                  key={i}
                  onClick={(e: React.MouseEvent<HTMLDivElement>) => handleFileClick(f, e)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '5px 8px',
                    background: '#fff',
                    borderRadius: 6,
                    border: '1px solid #E8ECF0',
                    cursor: hasData(f) ? 'pointer' : 'default',
                  }}
                >
                  <span style={{ fontSize: 13 }}>{isImage(getName(f)) ? '🖼️' : '📄'}</span>
                  <span
                    style={{
                      fontSize: 11,
                      color: hasData(f) ? '#3B82F6' : '#1A1D23',
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontWeight: hasData(f) ? 600 : 400,
                      textDecoration: hasData(f) ? 'underline' : 'none',
                    }}
                  >
                    {getName(f)}
                  </span>
                  {hasData(f) && (
                    <span style={{ fontSize: 9, color: '#8F95A3', flexShrink: 0 }}>
                      클릭하여 보기
                    </span>
                  )}
                  {onRemove && (
                    <button
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                        e.stopPropagation();
                        onRemove(i);
                      }}
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 4,
                        border: 'none',
                        background: '#FEE2E2',
                        color: '#DC2626',
                        fontSize: 11,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        lineHeight: 1,
                        flexShrink: 0,
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            {/* Add more hint */}
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: 10, color: '#3B82F6', fontWeight: 600 }}>
                + 클릭 또는 드래그하여 추가
              </span>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>📎</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#3B82F6', marginBottom: 2 }}>
              계약서를 드래그하거나 클릭하여 업로드
            </div>
            <div style={{ fontSize: 9, color: '#8F95A3' }}>여러장 가능 · PDF, JPG, PNG 등</div>
          </div>
        )}
      </div>

      {/* 파일 미리보기 모달 */}
      {previewFile && (
        <div
          onClick={() => setPreviewFile(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <div
            onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {/* 상단 바: 파일명 + 다운로드 + 닫기 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 12,
                padding: '8px 16px',
                background: 'rgba(255,255,255,0.95)',
                borderRadius: 10,
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#1A1D23',
                  maxWidth: 300,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {previewFile.name}
              </span>
              <button
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = previewFile.dataUrl;
                  a.download = previewFile.name;
                  a.click();
                }}
                style={{
                  padding: '5px 14px',
                  borderRadius: 6,
                  border: '1.5px solid #3B82F6',
                  background: '#EFF6FF',
                  color: '#2563EB',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                }}
              >
                ⬇️ 다운로드
              </button>
              <button
                onClick={() => setPreviewFile(null)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  border: 'none',
                  background: '#FEE2E2',
                  color: '#DC2626',
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>
            {/* 본문 */}
            {isImage(previewFile.name) ? (
              <img
                src={previewFile.dataUrl}
                alt="미리보기"
                style={{
                  maxWidth: '90vw',
                  maxHeight: '80vh',
                  borderRadius: 12,
                  boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                }}
              />
            ) : (
              <iframe
                src={previewFile.dataUrl}
                title="미리보기"
                style={{
                  width: '80vw',
                  height: '80vh',
                  borderRadius: 12,
                  border: 'none',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                  background: '#fff',
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
