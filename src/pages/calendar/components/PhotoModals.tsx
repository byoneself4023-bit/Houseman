import React, { useRef } from 'react';
import { toast } from 'sonner';
import { PhotoDropZone } from '@/components/PhotoDropZone';
import { persistUploadPhotos } from '../calendarApi';
import { api } from '@/lib/api';

interface PhotoModalProps {
  photoModalTenant: Record<string, any> | null;
  setPhotoModalTenant: (v: any) => void;
  setActiveTenants: (fn: any) => void;
  setPastTenantsData?: (fn: any) => void;
  setZoomPhoto: (v: any) => void;
}

export const PhotoModal: React.FC<PhotoModalProps> = ({
  photoModalTenant, setPhotoModalTenant, setActiveTenants, setPastTenantsData, setZoomPhoto,
}) => {
  if (!photoModalTenant) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/45 flex items-center justify-center"
      onClick={() => setPhotoModalTenant(null)}>
      <div className="bg-white rounded-2xl p-6 w-[480px] max-h-[80vh] overflow-y-auto shadow-[0_20px_60px_rgba(0,0,0,.3)]"
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <div className="text-base font-bold text-hm-text">📷 퇴실사진 등록 — {photoModalTenant.building} {photoModalTenant.room}호</div>
          <button onClick={() => setPhotoModalTenant(null)} className="bg-transparent border-none text-xl cursor-pointer text-hm-text-muted hover:text-hm-text transition-colors">✕</button>
        </div>
        <PhotoDropZone
          label="퇴실사진" color="var(--color-hm-danger)" maxPhotos={50}
          photos={photoModalTenant.moveOutPhotos || []}
          onZoom={(idx: number) => setZoomPhoto({ photos: photoModalTenant.moveOutPhotos || [], index: idx, zoom: 1 })}
          onAdd={async (newPhotos: any[]) => {
            const uploadedUrls = await persistUploadPhotos(newPhotos, photoModalTenant.building, photoModalTenant.room, "move-out");
            const photosToAdd = uploadedUrls.length > 0 ? uploadedUrls : newPhotos;
            const updated = [...(photoModalTenant.moveOutPhotos || []), ...photosToAdd];
            setPhotoModalTenant((prev: any) => ({ ...prev, moveOutPhotos: updated }));
            if (photoModalTenant._isPastTenant) {
              const hk = `${photoModalTenant.building}_${photoModalTenant.room}`;
              setPastTenantsData?.((prev: any) => {
                const records = [...(prev[hk] || [])];
                if (records.length > 0) records[records.length - 1] = { ...records[records.length - 1], moveOutPhotos: updated };
                return { ...prev, [hk]: records };
              });
            } else {
              setActiveTenants((prev: any[]) => prev.map((t: any) =>
                (photoModalTenant.id && t.id === photoModalTenant.id) ||
                (t.building === photoModalTenant.building && String(t.room) === String(photoModalTenant.room))
                  ? { ...t, moveOutPhotos: updated } : t
              ));
            }
            // API tenants 업데이트
            const sbId = photoModalTenant.supabaseId || photoModalTenant.id;
            if (sbId) {
              api.put(`/api/contracts/${sbId}`, { moveOutPhotos: updated }).catch(() => {});
            }
            if (uploadedUrls.length > 0) toast.success(`퇴실사진 ${uploadedUrls.length}장 업로드 완료`);
          }}
          onRemove={(idx: number) => {
            const updated = (photoModalTenant.moveOutPhotos || []).filter((_: any, j: number) => j !== idx);
            setPhotoModalTenant((prev: any) => ({ ...prev, moveOutPhotos: updated }));
            if (photoModalTenant._isPastTenant) {
              const hk = `${photoModalTenant.building}_${photoModalTenant.room}`;
              setPastTenantsData?.((prev: any) => {
                const records = [...(prev[hk] || [])];
                if (records.length > 0) records[records.length - 1] = { ...records[records.length - 1], moveOutPhotos: updated };
                return { ...prev, [hk]: records };
              });
            } else {
              setActiveTenants((prev: any[]) => prev.map((t: any) =>
                (photoModalTenant.id && t.id === photoModalTenant.id) ||
                (t.building === photoModalTenant.building && String(t.room) === String(photoModalTenant.room))
                  ? { ...t, moveOutPhotos: updated } : t
              ));
            }
          }}
        />
        <div className="text-right mt-3">
          <button onClick={() => setPhotoModalTenant(null)}
            className="px-6 py-2 rounded-lg border-none bg-hm-danger text-white font-bold text-xs cursor-pointer font-[inherit] hover:bg-red-700 transition-colors">
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

interface CheckPhotoModalProps {
  checkPhotoModalTenant: Record<string, any> | null;
  setCheckPhotoModalTenant: (v: any) => void;
  setActiveTenants: (fn: any) => void;
  setPastTenantsData?: (fn: any) => void;
  setZoomPhoto: (v: any) => void;
}

export const CheckPhotoModal: React.FC<CheckPhotoModalProps> = ({
  checkPhotoModalTenant, setCheckPhotoModalTenant, setActiveTenants, setPastTenantsData, setZoomPhoto,
}) => {
  if (!checkPhotoModalTenant) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/45 flex items-center justify-center"
      onClick={() => setCheckPhotoModalTenant(null)}>
      <div className="bg-white rounded-2xl p-6 w-[480px] max-h-[80vh] overflow-y-auto shadow-[0_20px_60px_rgba(0,0,0,.3)]"
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <div className="text-base font-bold text-hm-text">📷 입주체크사진 등록 — {checkPhotoModalTenant.building} {checkPhotoModalTenant.room}호</div>
          <button onClick={() => setCheckPhotoModalTenant(null)} className="bg-transparent border-none text-xl cursor-pointer text-hm-text-muted hover:text-hm-text transition-colors">✕</button>
        </div>
        <PhotoDropZone
          label="입주체크사진" color="#F59E0B" maxPhotos={50}
          photos={checkPhotoModalTenant.moveOutCheckPhotos || []}
          onZoom={(idx: number) => setZoomPhoto({ photos: checkPhotoModalTenant.moveOutCheckPhotos || [], index: idx, zoom: 1 })}
          onAdd={async (newPhotos: any[]) => {
            const uploadedUrls = await persistUploadPhotos(newPhotos, checkPhotoModalTenant.building, checkPhotoModalTenant.room, "move-in-check");
            const photosToAdd = uploadedUrls.length > 0 ? uploadedUrls : newPhotos;
            const updated = [...(checkPhotoModalTenant.moveOutCheckPhotos || []), ...photosToAdd];
            setCheckPhotoModalTenant((prev: any) => ({ ...prev, moveOutCheckPhotos: updated }));
            if (checkPhotoModalTenant._isPastTenant) {
              const hk = `${checkPhotoModalTenant.building}_${checkPhotoModalTenant.room}`;
              setPastTenantsData?.((prev: any) => {
                const records = [...(prev[hk] || [])];
                if (records.length > 0) records[records.length - 1] = { ...records[records.length - 1], moveOutCheckPhotos: updated };
                return { ...prev, [hk]: records };
              });
            } else {
              setActiveTenants((prev: any[]) => prev.map((t: any) =>
                (checkPhotoModalTenant.id && t.id === checkPhotoModalTenant.id) ||
                (t.building === checkPhotoModalTenant.building && String(t.room) === String(checkPhotoModalTenant.room))
                  ? { ...t, moveOutCheckPhotos: updated } : t
              ));
            }
            const sbId = checkPhotoModalTenant.supabaseId || checkPhotoModalTenant.id;
            if (sbId) {
              api.put(`/api/contracts/${sbId}`, { moveInPhotos: updated }).catch(() => {});
            }
            if (uploadedUrls.length > 0) toast.success(`입주체크사진 ${uploadedUrls.length}장 업로드 완료`);
          }}
          onRemove={(idx: number) => {
            const updated = (checkPhotoModalTenant.moveOutCheckPhotos || []).filter((_: any, j: number) => j !== idx);
            setCheckPhotoModalTenant((prev: any) => ({ ...prev, moveOutCheckPhotos: updated }));
            if (checkPhotoModalTenant._isPastTenant) {
              const hk = `${checkPhotoModalTenant.building}_${checkPhotoModalTenant.room}`;
              setPastTenantsData?.((prev: any) => {
                const records = [...(prev[hk] || [])];
                if (records.length > 0) records[records.length - 1] = { ...records[records.length - 1], moveOutCheckPhotos: updated };
                return { ...prev, [hk]: records };
              });
            } else {
              setActiveTenants((prev: any[]) => prev.map((t: any) =>
                (checkPhotoModalTenant.id && t.id === checkPhotoModalTenant.id) ||
                (t.building === checkPhotoModalTenant.building && String(t.room) === String(checkPhotoModalTenant.room))
                  ? { ...t, moveOutCheckPhotos: updated } : t
              ));
            }
          }}
        />
        <div className="text-right mt-3">
          <button onClick={() => setCheckPhotoModalTenant(null)}
            className="px-6 py-2 rounded-lg border-none bg-amber-400 text-white font-bold text-xs cursor-pointer font-[inherit] hover:bg-amber-500 transition-colors">
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

interface ZoomPhotoModalProps {
  zoomPhoto: { photos: any[]; index: number; zoom: number } | null;
  setZoomPhoto: (v: any) => void;
}

export const ZoomPhotoModal: React.FC<ZoomPhotoModalProps> = ({ zoomPhoto, setZoomPhoto }) => {
  if (!zoomPhoto) return null;

  const zp = zoomPhoto;
  const photo = zp.photos[zp.index];
  const src = typeof photo === "string" ? photo : URL.createObjectURL(photo);
  const goTo = (dir: number) => {
    const next = zp.index + dir;
    if (next >= 0 && next < zp.photos.length) setZoomPhoto({ ...zp, index: next, zoom: 1 });
  };

  return (
    <div className="fixed inset-0 z-[10001] bg-black/90 flex items-center justify-center select-none"
      tabIndex={0} ref={(el: HTMLDivElement | null) => { if (el) el.focus(); }}
      onClick={() => setZoomPhoto(null)}
      onKeyDown={e => {
        if (e.key === "ArrowLeft") { e.preventDefault(); goTo(-1); }
        else if (e.key === "ArrowRight") { e.preventDefault(); goTo(1); }
        else if (e.key === "Escape") setZoomPhoto(null);
      }}
      onWheel={e => {
        e.stopPropagation();
        const delta = e.deltaY > 0 ? -0.15 : 0.15;
        setZoomPhoto((prev: any) => prev ? { ...prev, zoom: Math.max(0.3, Math.min(5, prev.zoom + delta)) } : null);
      }}>
      {zp.index > 0 && (
        <button onClick={e => { e.stopPropagation(); goTo(-1); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/15 border-none text-2xl text-white cursor-pointer rounded-full w-12 h-12 flex items-center justify-center z-[2] hover:bg-white/25 transition-colors">
          &#8249;
        </button>
      )}
      {zp.index < zp.photos.length - 1 && (
        <button onClick={e => { e.stopPropagation(); goTo(1); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/15 border-none text-2xl text-white cursor-pointer rounded-full w-12 h-12 flex items-center justify-center z-[2] hover:bg-white/25 transition-colors">
          &#8250;
        </button>
      )}
      <img src={src} alt=""
        className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-[0_0_40px_rgba(0,0,0,.5)] transition-transform duration-100 ease-out"
        style={{ transform: `scale(${zp.zoom})` }}
        onClick={e => e.stopPropagation()}
        draggable={false} />
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 rounded-[20px] px-4 py-1.5 text-white text-sm font-bold">
        {zp.index + 1} / {zp.photos.length}
        {zp.zoom !== 1 && <span className="ml-2 text-xs text-blue-300">{Math.round(zp.zoom * 100)}%</span>}
      </div>
      <button onClick={() => setZoomPhoto(null)}
        className="absolute top-4 right-4 bg-white/20 border-none text-2xl text-white cursor-pointer rounded-full w-10 h-10 flex items-center justify-center hover:bg-white/30 transition-colors">
        ✕
      </button>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/40 text-xs">
        ← → 이전/다음 · 스크롤 확대/축소 · ESC 닫기
      </div>
    </div>
  );
};

interface CompareModalProps {
  compareData: Record<string, any> | null;
  setCompareData: (v: any) => void;
  onRemoveRight?: (index: number) => void;
  onAddRight?: (dataUrls: string[]) => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({ compareData, setCompareData, onRemoveRight, onAddRight }) => {
  const rightFileRef = useRef<HTMLInputElement>(null);
  if (!compareData) return null;

  const leftPhotos = compareData.moveInCheckPhotos || [];
  const rightPhotos = compareData.moveOutPhotos || [];
  const cmpLeft = compareData._leftIdx ?? null;
  const cmpRight = compareData._rightIdx ?? null;
  const cmpLeftZoom = compareData._leftZoom ?? 1;
  const cmpRightZoom = compareData._rightZoom ?? 1;
  const cmpLeftPos = compareData._leftPos ?? { x: 0, y: 0 };
  const cmpRightPos = compareData._rightPos ?? { x: 0, y: 0 };
  const isCompareMode = cmpLeft !== null || cmpRight !== null;
  const updateCmp = (patch: Record<string, any>) => setCompareData((prev: any) => ({ ...prev, ...patch }));

  return (
    <div className="fixed inset-0 z-[9999] bg-black/85 flex flex-col"
      onClick={() => setCompareData(null)}>
      <div className="w-full h-full flex flex-col"
        onClick={e => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="px-6 py-3 bg-black/60 flex items-center justify-between shrink-0">
          <div className="text-base font-bold text-white">🔍 사진 비교 — {compareData.building} {compareData.room}호</div>
          <div className="flex items-center gap-3">
            {isCompareMode && (
              <button onClick={() => updateCmp({ _leftIdx: null, _rightIdx: null, _leftZoom: 1, _rightZoom: 1, _leftPos: { x: 0, y: 0 }, _rightPos: { x: 0, y: 0 } })}
                className="px-4 py-[5px] rounded-md border border-white/30 bg-white/10 text-white text-xs font-bold cursor-pointer font-[inherit] hover:bg-white/20 transition-colors">
                목록으로
              </button>
            )}
            <button onClick={() => setCompareData(null)} className="bg-transparent border-none text-xl cursor-pointer text-white hover:text-white/70 transition-colors">✕</button>
          </div>
        </div>

        {/* 본문: 좌우 반반 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 왼쪽: 입주체크사진 */}
          <div className="flex-1 flex flex-col border-r-2 border-white/15">
            <div className="px-4 py-2 bg-amber-500/15 text-center shrink-0">
              <span className="text-xs font-bold text-yellow-300">📋 입주체크사진 (입주 시) — {leftPhotos.length}장</span>
            </div>
            <div className="flex-1 overflow-auto" style={{ padding: cmpLeft !== null ? 0 : 12 }}>
              {cmpLeft !== null && leftPhotos[cmpLeft] ? (
                <div className="w-full h-full flex items-center justify-center overflow-hidden cursor-grab relative"
                  onWheel={e => {
                    e.stopPropagation();
                    const delta = e.deltaY > 0 ? -0.15 : 0.15;
                    updateCmp({ _leftZoom: Math.max(0.3, Math.min(8, cmpLeftZoom + delta)) });
                  }}
                  onMouseDown={e => {
                    if (cmpLeftZoom <= 1) return;
                    e.preventDefault();
                    const startX = e.clientX - cmpLeftPos.x;
                    const startY = e.clientY - cmpLeftPos.y;
                    const onMove = (me: MouseEvent) => updateCmp({ _leftPos: { x: me.clientX - startX, y: me.clientY - startY } });
                    const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
                    window.addEventListener("mousemove", onMove);
                    window.addEventListener("mouseup", onUp);
                  }}>
                  <img src={typeof leftPhotos[cmpLeft] === "string" ? leftPhotos[cmpLeft] : URL.createObjectURL(leftPhotos[cmpLeft])} alt=""
                    className="max-w-full max-h-full object-contain transition-transform duration-100 ease-out"
                    style={{ transform: `scale(${cmpLeftZoom}) translate(${cmpLeftPos.x / cmpLeftZoom}px, ${cmpLeftPos.y / cmpLeftZoom}px)` }}
                    draggable={false} />
                  {cmpLeft > 0 && (
                    <button onClick={() => updateCmp({ _leftIdx: cmpLeft - 1, _leftZoom: 1, _leftPos: { x: 0, y: 0 } })}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 border-none text-white text-xl cursor-pointer rounded-full w-9 h-9 flex items-center justify-center hover:bg-black/70 transition-colors">&#8249;</button>
                  )}
                  {cmpLeft < leftPhotos.length - 1 && (
                    <button onClick={() => updateCmp({ _leftIdx: cmpLeft + 1, _leftZoom: 1, _leftPos: { x: 0, y: 0 } })}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 border-none text-white text-xl cursor-pointer rounded-full w-9 h-9 flex items-center justify-center hover:bg-black/70 transition-colors">&#8250;</button>
                  )}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 rounded-xl px-2.5 py-[3px] text-white text-xs font-bold">
                    {cmpLeft + 1}/{leftPhotos.length} {cmpLeftZoom !== 1 && `· ${Math.round(cmpLeftZoom * 100)}%`}
                  </div>
                </div>
              ) : leftPhotos.length === 0 ? (
                <div className="p-10 text-center text-gray-500 text-xs">등록된 사진 없음</div>
              ) : (
                <div className="grid grid-cols-3 gap-1.5">
                  {leftPhotos.map((p: any, i: number) => (
                    <div key={i} onClick={() => updateCmp({ _leftIdx: i, _leftZoom: 1, _leftPos: { x: 0, y: 0 } })}
                      className="cursor-pointer rounded-lg overflow-hidden border-2 border-yellow-300/40 aspect-square bg-[#111]">
                      <img src={typeof p === "string" ? p : URL.createObjectURL(p)} alt="" className="w-full h-full object-cover block" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 오른쪽: 퇴실사진 */}
          <div className="flex-1 flex flex-col">
            <div className="px-4 py-2 bg-red-600/15 text-center shrink-0">
              <span className="text-xs font-bold text-red-300">🚪 퇴실사진 (퇴실 시) — {rightPhotos.length}장</span>
            </div>
            <div className="flex-1 overflow-auto" style={{ padding: cmpRight !== null ? 0 : 12 }}>
              {cmpRight !== null && rightPhotos[cmpRight] ? (
                <div className="w-full h-full flex items-center justify-center overflow-hidden cursor-grab relative"
                  onWheel={e => {
                    e.stopPropagation();
                    const delta = e.deltaY > 0 ? -0.15 : 0.15;
                    updateCmp({ _rightZoom: Math.max(0.3, Math.min(8, cmpRightZoom + delta)) });
                  }}
                  onMouseDown={e => {
                    if (cmpRightZoom <= 1) return;
                    e.preventDefault();
                    const startX = e.clientX - cmpRightPos.x;
                    const startY = e.clientY - cmpRightPos.y;
                    const onMove = (me: MouseEvent) => updateCmp({ _rightPos: { x: me.clientX - startX, y: me.clientY - startY } });
                    const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
                    window.addEventListener("mousemove", onMove);
                    window.addEventListener("mouseup", onUp);
                  }}>
                  <img src={typeof rightPhotos[cmpRight] === "string" ? rightPhotos[cmpRight] : URL.createObjectURL(rightPhotos[cmpRight])} alt=""
                    className="max-w-full max-h-full object-contain transition-transform duration-100 ease-out"
                    style={{ transform: `scale(${cmpRightZoom}) translate(${cmpRightPos.x / cmpRightZoom}px, ${cmpRightPos.y / cmpRightZoom}px)` }}
                    draggable={false} />
                  {cmpRight > 0 && (
                    <button onClick={() => updateCmp({ _rightIdx: cmpRight - 1, _rightZoom: 1, _rightPos: { x: 0, y: 0 } })}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 border-none text-white text-xl cursor-pointer rounded-full w-9 h-9 flex items-center justify-center hover:bg-black/70 transition-colors">&#8249;</button>
                  )}
                  {cmpRight < rightPhotos.length - 1 && (
                    <button onClick={() => updateCmp({ _rightIdx: cmpRight + 1, _rightZoom: 1, _rightPos: { x: 0, y: 0 } })}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 border-none text-white text-xl cursor-pointer rounded-full w-9 h-9 flex items-center justify-center hover:bg-black/70 transition-colors">&#8250;</button>
                  )}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2">
                    <div className="bg-black/60 rounded-xl px-2.5 py-[3px] text-white text-xs font-bold">
                      {cmpRight + 1}/{rightPhotos.length} {cmpRightZoom !== 1 && `· ${Math.round(cmpRightZoom * 100)}%`}
                    </div>
                    {onRemoveRight && (
                      <button onClick={() => {
                        onRemoveRight(cmpRight);
                        toast.success("퇴실사진 삭제됨");
                        const newLen = rightPhotos.length - 1;
                        if (newLen === 0) updateCmp({ _rightIdx: null });
                        else if (cmpRight >= newLen) updateCmp({ _rightIdx: newLen - 1, _rightZoom: 1, _rightPos: { x: 0, y: 0 } });
                      }}
                        className="px-2.5 py-[3px] rounded-xl border-none bg-red-600/80 text-white text-xs font-bold cursor-pointer font-[inherit] hover:bg-red-700 transition-colors">
                        🗑 삭제
                      </button>
                    )}
                  </div>
                </div>
              ) : rightPhotos.length === 0 ? (
                <div className="p-10 text-center text-gray-500 text-xs">
                  등록된 사진 없음
                  {onAddRight && (
                    <div className="mt-3">
                      <button onClick={() => rightFileRef.current?.click()}
                        className="px-5 py-2 rounded-lg border-2 border-dashed border-red-200/60 bg-red-600/10 text-red-300 text-xs font-bold cursor-pointer font-[inherit] hover:bg-red-600/20 transition-colors">
                        + 사진 추가
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {rightPhotos.map((p: any, i: number) => (
                      <div key={i} className="relative cursor-pointer rounded-lg overflow-hidden border-2 border-red-200/40 aspect-square bg-[#111]">
                        <div onClick={() => updateCmp({ _rightIdx: i, _rightZoom: 1, _rightPos: { x: 0, y: 0 } })} className="w-full h-full">
                          <img src={typeof p === "string" ? p : URL.createObjectURL(p)} alt="" className="w-full h-full object-cover block" />
                        </div>
                        {onRemoveRight && (
                          <div onClick={(e) => { e.stopPropagation(); onRemoveRight(i); toast.success("퇴실사진 삭제됨"); }}
                            className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-600/85 text-white text-xs font-bold flex items-center justify-center cursor-pointer hover:bg-red-700 transition-colors">
                            ✕
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {onAddRight && (
                    <div className="mt-2 text-center">
                      <button onClick={() => rightFileRef.current?.click()}
                        className="px-4 py-1.5 rounded-lg border-2 border-dashed border-red-200/60 bg-red-600/10 text-red-300 text-xs font-bold cursor-pointer font-[inherit] hover:bg-red-600/20 transition-colors">
                        + 사진 추가
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* hidden file input for adding photos */}
        {onAddRight && (
          <input ref={rightFileRef} type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => {
              const files = e.target.files;
              if (!files || files.length === 0) return;
              const readers = Array.from(files).filter(f => f.type.startsWith("image/")).map(f =>
                new Promise<string>((resolve) => { const r = new FileReader(); r.onload = () => resolve(r.result as string); r.readAsDataURL(f); })
              );
              Promise.all(readers).then(dataUrls => { if (dataUrls.length > 0) onAddRight(dataUrls); });
              e.target.value = "";
            }}
          />
        )}

        {/* 하단 안내 */}
        <div className="px-6 py-2 bg-black/60 text-center shrink-0">
          <span className="text-white/50 text-xs">사진 클릭하여 확대 · 스크롤로 줌 · 드래그로 이동 · ESC 닫기</span>
        </div>
      </div>
    </div>
  );
};
