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
        className="hidden"
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
        className={`rounded-[10px] border-2 border-dashed cursor-pointer transition-all duration-150 ${
          dragging ? 'border-hm-blue bg-hm-blue-bg' : 'border-gray-300 bg-[#FAFBFC] hover:border-hm-blue/40'
        } ${files.length > 0 ? 'px-3 py-2.5' : 'px-3 py-[18px]'}`}
      >
        {files.length > 0 ? (
          <div>
            {/* File list */}
            <div className="flex flex-col gap-1 mb-2">
              {files.map((f, i) => (
                <div
                  key={i}
                  onClick={(e: React.MouseEvent<HTMLDivElement>) => handleFileClick(f, e)}
                  className={`flex items-center gap-1.5 px-2 py-[5px] bg-white rounded-md border border-hm-border ${
                    hasData(f) ? 'cursor-pointer hover:bg-hm-bg-hover' : 'cursor-default'
                  } transition-colors`}
                >
                  <span className="text-sm">{isImage(getName(f)) ? '🖼️' : '📄'}</span>
                  <span
                    className={`text-xs flex-1 overflow-hidden text-ellipsis whitespace-nowrap ${
                      hasData(f)
                        ? 'text-hm-blue font-semibold underline'
                        : 'text-hm-text font-normal no-underline'
                    }`}
                  >
                    {getName(f)}
                  </span>
                  {hasData(f) && (
                    <span className="text-xs text-hm-text-muted shrink-0">
                      클릭하여 보기
                    </span>
                  )}
                  {onRemove && (
                    <button
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                        e.stopPropagation();
                        onRemove(i);
                      }}
                      className="w-5 h-5 rounded border-none bg-red-100 text-hm-danger text-xs cursor-pointer font-[inherit] leading-none shrink-0 hover:bg-red-200 transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            {/* Add more hint */}
            <div className="text-center">
              <span className="text-xs text-hm-blue font-semibold">
                + 클릭 또는 드래그하여 추가
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-2xl mb-1">📎</div>
            <div className="text-xs font-bold text-hm-blue mb-1">
              계약서를 드래그하거나 클릭하여 업로드
            </div>
            <div className="text-xs text-hm-text-muted">여러장 가능 · PDF, JPG, PNG 등</div>
          </div>
        )}
      </div>

      {/* 파일 미리보기 모달 */}
      {previewFile && (
        <div
          onClick={() => setPreviewFile(null)}
          className="fixed inset-0 bg-black/70 z-[10000] flex flex-col items-center justify-center cursor-pointer"
        >
          <div
            onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
            className="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center"
          >
            {/* 상단 바: 파일명 + 다운로드 + 닫기 */}
            <div className="flex items-center gap-3 mb-3 px-4 py-2 bg-white/95 rounded-[10px] shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
              <span className="text-xs font-bold text-hm-text max-w-[300px] overflow-hidden text-ellipsis whitespace-nowrap">
                {previewFile.name}
              </span>
              <button
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = previewFile.dataUrl;
                  a.download = previewFile.name;
                  a.click();
                }}
                className="px-4 py-[5px] rounded-md border-[1.5px] border-hm-blue bg-hm-blue-bg text-hm-blue-dark text-xs font-bold cursor-pointer font-[inherit] whitespace-nowrap hover:bg-blue-100 transition-colors"
              >
                ⬇️ 다운로드
              </button>
              <button
                onClick={() => setPreviewFile(null)}
                className="w-7 h-7 rounded-full border-none bg-red-100 text-hm-danger text-sm font-bold cursor-pointer hover:bg-red-200 transition-colors"
              >
                ✕
              </button>
            </div>
            {/* 본문 */}
            {isImage(previewFile.name) ? (
              <img
                src={previewFile.dataUrl}
                alt="미리보기"
                className="max-w-[90vw] max-h-[80vh] rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
              />
            ) : (
              <iframe
                src={previewFile.dataUrl}
                title="미리보기"
                className="w-[80vw] h-[80vh] rounded-xl border-none shadow-[0_20px_60px_rgba(0,0,0,0.5)] bg-white"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
