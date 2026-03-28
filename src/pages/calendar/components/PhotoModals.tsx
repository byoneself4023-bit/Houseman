import React from 'react';
import { PhotoDropZone } from '@/components/PhotoDropZone';

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
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={() => setPhotoModalTenant(null)}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 24, width: 480, maxHeight: "80vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.3)" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#1A1D23" }}>📷 퇴실사진 등록 — {photoModalTenant.building} {photoModalTenant.room}호</div>
          <button onClick={() => setPhotoModalTenant(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#8F95A3" }}>✕</button>
        </div>
        <PhotoDropZone
          label="퇴실사진" color="#DC2626" maxPhotos={50}
          photos={photoModalTenant.moveOutPhotos || []}
          onZoom={(idx: number) => setZoomPhoto({ photos: photoModalTenant.moveOutPhotos || [], index: idx, zoom: 1 })}
          onAdd={(newPhotos: any[]) => {
            const updated = [...(photoModalTenant.moveOutPhotos || []), ...newPhotos];
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
        <div style={{ textAlign: "right", marginTop: 12 }}>
          <button onClick={() => setPhotoModalTenant(null)}
            style={{ padding: "8px 24px", borderRadius: 8, border: "none", background: "#DC2626", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
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
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={() => setCheckPhotoModalTenant(null)}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 24, width: 480, maxHeight: "80vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.3)" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#1A1D23" }}>📷 입주체크사진 등록 — {checkPhotoModalTenant.building} {checkPhotoModalTenant.room}호</div>
          <button onClick={() => setCheckPhotoModalTenant(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#8F95A3" }}>✕</button>
        </div>
        <PhotoDropZone
          label="입주체크사진" color="#F59E0B" maxPhotos={50}
          photos={checkPhotoModalTenant.moveOutCheckPhotos || []}
          onZoom={(idx: number) => setZoomPhoto({ photos: checkPhotoModalTenant.moveOutCheckPhotos || [], index: idx, zoom: 1 })}
          onAdd={(newPhotos: any[]) => {
            const updated = [...(checkPhotoModalTenant.moveOutCheckPhotos || []), ...newPhotos];
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
        <div style={{ textAlign: "right", marginTop: 12 }}>
          <button onClick={() => setCheckPhotoModalTenant(null)}
            style={{ padding: "8px 24px", borderRadius: 8, border: "none", background: "#F59E0B", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
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
    <div style={{ position: "fixed", inset: 0, zIndex: 10001, background: "rgba(0,0,0,.9)", display: "flex", alignItems: "center", justifyContent: "center", userSelect: "none" }}
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
          style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,.15)", border: "none", fontSize: 28, color: "#fff", cursor: "pointer", borderRadius: "50%", width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
          &#8249;
        </button>
      )}
      {zp.index < zp.photos.length - 1 && (
        <button onClick={e => { e.stopPropagation(); goTo(1); }}
          style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,.15)", border: "none", fontSize: 28, color: "#fff", cursor: "pointer", borderRadius: "50%", width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
          &#8250;
        </button>
      )}
      <img src={src} alt=""
        style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 8, boxShadow: "0 0 40px rgba(0,0,0,.5)", transform: `scale(${zp.zoom})`, transition: "transform 0.1s ease-out" }}
        onClick={e => e.stopPropagation()}
        draggable={false} />
      <div style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,.5)", borderRadius: 20, padding: "6px 16px", color: "#fff", fontSize: 13, fontWeight: 700 }}>
        {zp.index + 1} / {zp.photos.length}
        {zp.zoom !== 1 && <span style={{ marginLeft: 8, fontSize: 11, color: "#93C5FD" }}>{Math.round(zp.zoom * 100)}%</span>}
      </div>
      <button onClick={() => setZoomPhoto(null)}
        style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,.2)", border: "none", fontSize: 24, color: "#fff", cursor: "pointer", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
        ✕
      </button>
      <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", color: "rgba(255,255,255,.4)", fontSize: 11 }}>
        ← → 이전/다음 · 스크롤 확대/축소 · ESC 닫기
      </div>
    </div>
  );
};

interface CompareModalProps {
  compareData: Record<string, any> | null;
  setCompareData: (v: any) => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({ compareData, setCompareData }) => {
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
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,.85)", display: "flex", flexDirection: "column" }}
      onClick={() => setCompareData(null)}>
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}
        onClick={e => e.stopPropagation()}>
        {/* 헤더 */}
        <div style={{ padding: "12px 24px", background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>🔍 사진 비교 — {compareData.building} {compareData.room}호</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {isCompareMode && (
              <button onClick={() => updateCmp({ _leftIdx: null, _rightIdx: null, _leftZoom: 1, _rightZoom: 1, _leftPos: { x: 0, y: 0 }, _rightPos: { x: 0, y: 0 } })}
                style={{ padding: "5px 14px", borderRadius: 6, border: "1px solid rgba(255,255,255,.3)", background: "rgba(255,255,255,.1)", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                목록으로
              </button>
            )}
            <button onClick={() => setCompareData(null)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#fff" }}>✕</button>
          </div>
        </div>

        {/* 본문: 좌우 반반 */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* 왼쪽: 입주체크사진 */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", borderRight: "2px solid rgba(255,255,255,.15)" }}>
            <div style={{ padding: "8px 16px", background: "rgba(245,158,11,.15)", textAlign: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#FCD34D" }}>📋 입주체크사진 (입주 시) — {leftPhotos.length}장</span>
            </div>
            <div style={{ flex: 1, overflow: "auto", padding: cmpLeft !== null ? 0 : 12 }}>
              {cmpLeft !== null && leftPhotos[cmpLeft] ? (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", cursor: "grab", position: "relative" }}
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
                    style={{ maxWidth: "100%", maxHeight: "100%", transform: `scale(${cmpLeftZoom}) translate(${cmpLeftPos.x / cmpLeftZoom}px, ${cmpLeftPos.y / cmpLeftZoom}px)`, transition: "transform 0.1s ease-out", objectFit: "contain" }}
                    draggable={false} />
                  {cmpLeft > 0 && (
                    <button onClick={() => updateCmp({ _leftIdx: cmpLeft - 1, _leftZoom: 1, _leftPos: { x: 0, y: 0 } })}
                      style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,.5)", border: "none", color: "#fff", fontSize: 20, cursor: "pointer", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>&#8249;</button>
                  )}
                  {cmpLeft < leftPhotos.length - 1 && (
                    <button onClick={() => updateCmp({ _leftIdx: cmpLeft + 1, _leftZoom: 1, _leftPos: { x: 0, y: 0 } })}
                      style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,.5)", border: "none", color: "#fff", fontSize: 20, cursor: "pointer", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>&#8250;</button>
                  )}
                  <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,.6)", borderRadius: 12, padding: "3px 10px", color: "#fff", fontSize: 10, fontWeight: 700 }}>
                    {cmpLeft + 1}/{leftPhotos.length} {cmpLeftZoom !== 1 && `· ${Math.round(cmpLeftZoom * 100)}%`}
                  </div>
                </div>
              ) : leftPhotos.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "#6B7280", fontSize: 12 }}>등록된 사진 없음</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                  {leftPhotos.map((p: any, i: number) => (
                    <div key={i} onClick={() => updateCmp({ _leftIdx: i, _leftZoom: 1, _leftPos: { x: 0, y: 0 } })}
                      style={{ cursor: "pointer", borderRadius: 8, overflow: "hidden", border: "2px solid rgba(253,224,71,.4)", aspectRatio: "1", background: "#111" }}>
                      <img src={typeof p === "string" ? p : URL.createObjectURL(p)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 오른쪽: 퇴실사진 */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "8px 16px", background: "rgba(220,38,38,.15)", textAlign: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#FCA5A5" }}>🚪 퇴실사진 (퇴실 시) — {rightPhotos.length}장</span>
            </div>
            <div style={{ flex: 1, overflow: "auto", padding: cmpRight !== null ? 0 : 12 }}>
              {cmpRight !== null && rightPhotos[cmpRight] ? (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", cursor: "grab", position: "relative" }}
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
                    style={{ maxWidth: "100%", maxHeight: "100%", transform: `scale(${cmpRightZoom}) translate(${cmpRightPos.x / cmpRightZoom}px, ${cmpRightPos.y / cmpRightZoom}px)`, transition: "transform 0.1s ease-out", objectFit: "contain" }}
                    draggable={false} />
                  {cmpRight > 0 && (
                    <button onClick={() => updateCmp({ _rightIdx: cmpRight - 1, _rightZoom: 1, _rightPos: { x: 0, y: 0 } })}
                      style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,.5)", border: "none", color: "#fff", fontSize: 20, cursor: "pointer", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>&#8249;</button>
                  )}
                  {cmpRight < rightPhotos.length - 1 && (
                    <button onClick={() => updateCmp({ _rightIdx: cmpRight + 1, _rightZoom: 1, _rightPos: { x: 0, y: 0 } })}
                      style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,.5)", border: "none", color: "#fff", fontSize: 20, cursor: "pointer", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>&#8250;</button>
                  )}
                  <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,.6)", borderRadius: 12, padding: "3px 10px", color: "#fff", fontSize: 10, fontWeight: 700 }}>
                    {cmpRight + 1}/{rightPhotos.length} {cmpRightZoom !== 1 && `· ${Math.round(cmpRightZoom * 100)}%`}
                  </div>
                </div>
              ) : rightPhotos.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "#6B7280", fontSize: 12 }}>등록된 사진 없음</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                  {rightPhotos.map((p: any, i: number) => (
                    <div key={i} onClick={() => updateCmp({ _rightIdx: i, _rightZoom: 1, _rightPos: { x: 0, y: 0 } })}
                      style={{ cursor: "pointer", borderRadius: 8, overflow: "hidden", border: "2px solid rgba(254,202,202,.4)", aspectRatio: "1", background: "#111" }}>
                      <img src={typeof p === "string" ? p : URL.createObjectURL(p)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 하단 안내 */}
        <div style={{ padding: "8px 24px", background: "rgba(0,0,0,.6)", textAlign: "center", flexShrink: 0 }}>
          <span style={{ color: "rgba(255,255,255,.5)", fontSize: 11 }}>사진 클릭하여 확대 · 스크롤로 줌 · 드래그로 이동 · ESC 닫기</span>
        </div>
      </div>
    </div>
  );
};
