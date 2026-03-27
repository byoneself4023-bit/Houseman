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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ fontSize: 10, fontWeight: 700, color, marginBottom: 6 }}>
        📷 {label} ({count}/{maxPhotos})
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
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
        style={{
          padding: count > 0 ? '10px' : '20px 10px',
          borderRadius: 10,
          border: '2px dashed #D1D5DB',
          background: '#FAFBFC',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
          minHeight: 70,
          flex: 1,
        }}
      >
        {count > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(6, 1fr)',
              gap: 6,
            }}
          >
            {photos.map((src, pi) => (
              <div
                key={pi}
                style={{
                  aspectRatio: '1',
                  borderRadius: 8,
                  border: `2px solid ${color}`,
                  overflow: 'hidden',
                  position: 'relative',
                  background: color + '15',
                  cursor: onZoom ? 'pointer' : 'default',
                }}
                onClick={() => onZoom && onZoom(pi)}
              >
                {src && src.startsWith('data:') ? (
                  <img
                    src={src}
                    alt={`${label} ${pi + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span style={{ fontSize: 18 }}>🖼️</span>
                  </div>
                )}
                {onRemove && (
                  <div
                    onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                      e.stopPropagation();
                      onRemove(pi);
                    }}
                    style={{
                      position: 'absolute',
                      top: -1,
                      right: -1,
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: '#DC2626',
                      color: '#fff',
                      fontSize: 9,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    ✕
                  </div>
                )}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 1,
                    left: 0,
                    right: 0,
                    fontSize: 7,
                    color: '#fff',
                    fontWeight: 700,
                    textShadow: '0 0 3px rgba(0,0,0,0.7)',
                    textAlign: 'center',
                  }}
                >
                  {pi + 1}
                </div>
              </div>
            ))}
            {remaining > 0 && (
              <div
                onClick={openPicker}
                style={{
                  aspectRatio: '1',
                  borderRadius: 8,
                  border: '2px dashed #D1D5DB',
                  background: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 16, color }}>+</span>
                <span style={{ fontSize: 7, color: '#8F95A3' }}>추가</span>
              </div>
            )}
          </div>
        ) : (
          <div onClick={openPicker}>
            <div style={{ fontSize: 26, marginBottom: 4 }}>📷</div>
            <div style={{ fontSize: 11, fontWeight: 700, color, marginBottom: 2 }}>
              사진을 드래그하거나 클릭하여 업로드
            </div>
            <div style={{ fontSize: 9, color: '#8F95A3' }}>최대 {maxPhotos}장 · JPG, PNG</div>
          </div>
        )}
      </div>
    </div>
  );
};
