import React, { useRef } from 'react';
import { useIsMobile } from '../utils';

const readFileOriginal = (file: File): Promise<string | null> =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve(null);
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });

const readFilesAsDataURLs = (files: FileList, max: number): Promise<string[]> => {
  const targets = Array.from(files)
    .filter((f) => f.type.startsWith('image/'))
    .slice(0, max);
  return Promise.all(targets.map((f) => readFileOriginal(f))).then((results) =>
    results.filter((r): r is string => r !== null),
  );
};

interface PhotoDropZoneProps {
  photos?: string[];
  maxPhotos?: number;
  label?: string;
  color?: string;
  onAdd?: (dataUrls: string[]) => void;
  onRemove?: (index: number) => void;
  onZoom?: (index: number) => void;
}

export const PhotoDropZone: React.FC<PhotoDropZoneProps> = ({
  photos = [],
  maxPhotos = 30,
  label = '사진',
  color = '#8B5CF6',
  onAdd,
  onRemove,
  onZoom,
}) => {
  const isMobile = useIsMobile();
  const fileRef = useRef<HTMLInputElement>(null);
  const count = photos.length;
  const remaining = maxPhotos - count;

  const handleFiles = async (files: FileList): Promise<void> => {
    if (!onAdd || remaining <= 0) return;
    const dataUrls = await readFilesAsDataURLs(files, remaining);
    if (dataUrls.length > 0) onAdd(dataUrls);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.currentTarget.style.borderColor = '#D1D5DB';
    e.currentTarget.style.background = '#FAFBFC';
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files && e.target.files.length > 0) handleFiles(e.target.files);
    e.target.value = '';
  };

  const openPicker = (): void => {
    fileRef.current?.click();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="text-xs font-bold mb-1.5" style={{ color }}>
        📷 {label} ({count}/{maxPhotos})
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onFileChange}
      />
      <div
        onDragOver={(e: React.DragEvent<HTMLDivElement>) => {
          e.preventDefault();
          e.currentTarget.style.borderColor = color;
          e.currentTarget.style.background = color + '11';
        }}
        onDragLeave={(e: React.DragEvent<HTMLDivElement>) => {
          e.currentTarget.style.borderColor = '#D1D5DB';
          e.currentTarget.style.background = '#FAFBFC';
        }}
        onDrop={onDrop}
        className={`${count > 0 ? 'p-2.5' : 'px-2.5 py-5'} rounded-[10px] border-2 border-dashed border-gray-300 bg-[#FAFBFC] text-center cursor-pointer transition-all duration-200 min-h-[70px] flex-1`}
      >
        {count > 0 ? (
          <div
            className={`grid ${isMobile ? 'grid-cols-3' : 'grid-cols-6'} gap-1.5`}
          >
            {photos.map((src, pi) => (
              <div
                key={pi}
                className="aspect-square rounded-lg relative overflow-hidden"
                style={{
                  border: `2px solid ${color}`,
                  background: color + '15',
                  cursor: onZoom ? 'pointer' : 'default',
                }}
                onClick={() => onZoom && onZoom(pi)}
              >
                {src && (src.startsWith('data:') || src.startsWith('http')) ? (
                  <img
                    src={src}
                    alt={`${label} ${pi + 1}`}
                    className="w-full h-full object-cover block"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-lg">🖼️</span>
                  </div>
                )}
                {onRemove && (
                  <div
                    onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                      e.stopPropagation();
                      onRemove(pi);
                    }}
                    className="absolute top-0.5 right-0.5 w-[18px] h-[18px] rounded-full bg-hm-danger text-white text-xs font-bold flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    ✕
                  </div>
                )}
                <div className="absolute bottom-px left-0 right-0 text-[7px] text-white font-bold text-center" style={{ textShadow: '0 0 3px rgba(0,0,0,0.7)' }}>
                  {pi + 1}
                </div>
              </div>
            ))}
            {remaining > 0 && (
              <div
                onClick={openPicker}
                className="aspect-square rounded-lg border-2 border-dashed border-gray-300 bg-white flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
              >
                <span className="text-base" style={{ color }}>+</span>
                <span className="text-[7px] text-hm-text-muted">추가</span>
              </div>
            )}
          </div>
        ) : (
          <div onClick={openPicker}>
            <div className="text-2xl mb-1">📷</div>
            <div className="text-xs font-bold mb-1" style={{ color }}>
              사진을 드래그하거나 클릭하여 업로드
            </div>
            <div className="text-xs text-hm-text-muted">최대 {maxPhotos}장 · JPG, PNG</div>
          </div>
        )}
      </div>
    </div>
  );
};
