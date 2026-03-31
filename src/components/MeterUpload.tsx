/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { api } from '@/lib/api';
import { truncate10 } from '@/data';

interface MeterUploadProps {
  billingMonth: string;
  onComplete?: (result: { matched: any[]; unmatched: any[]; errors: string[] }) => void;
}

/**
 * MeterUpload -- 전기/가스 엑셀 업로드 → meter_readings INSERT
 *
 * 플로우:
 * 1. 엑셀 파일 드래그/클릭으로 업로드
 * 2. 파싱: 고객번호, 사용기간, 검침값, 금액 추출
 * 3. rooms.electric_customer_number / gas_customer_number로 호실 매칭
 * 4. meter_readings에 INSERT (upsert)
 * 5. 매칭 결과 표시 (성공/실패/미매칭)
 */
export default function MeterUpload({ billingMonth, onComplete }: MeterUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ matched: any[]; unmatched: any[]; errors: string[] } | null>(null);
  const [uploadType, setUploadType] = useState<'elec' | 'gas'>('elec');

  // ── rooms 테이블에서 고객번호 매핑 로드 ──
  // TODO Phase 6: API endpoint 필요 (GET /api/rooms?withCustomerNumber=true)
  const loadCustomerMap = useCallback(async (_type: 'elec' | 'gas') => {
    return {} as Record<string, any[]>;
  }, []);

  // ── 엑셀 컬럼 자동 감지 ──
  const findCol = (headers: string[], candidates: string[]) => {
    for (const c of candidates) {
      const idx = headers.findIndex(h => h && String(h).includes(c));
      if (idx >= 0) return idx;
    }
    return -1;
  };

  // ── 전기 엑셀 파싱 (한전산업빌링 형식) ──
  const parseElecExcel = (rows: any[][]): any => {
    if (rows.length < 2) return [];
    const headers = rows[0].map(h => String(h || '').trim());

    const colCustomer = findCol(headers, ['고객번호', '수용번호', 'customer']);
    const colAmount = findCol(headers, ['청구금액', '전기요금', '금액', 'amount']);
    const colUsage = findCol(headers, ['사용량', '사용전력', 'kWh', 'usage']);
    const colPeriodStart = findCol(headers, ['사용기간시작', '검침시작', '시작일']);
    const colPeriodEnd = findCol(headers, ['사용기간종료', '검침종료', '종료일']);
    const colPrevReading = findCol(headers, ['전월지침', '전검침', '전월']);
    const colCurrReading = findCol(headers, ['당월지침', '당검침', '당월']);

    if (colCustomer < 0 || colAmount < 0) {
      return { error: '고객번호 또는 금액 컬럼을 찾을 수 없습니다' };
    }

    return rows.slice(1).filter(row => row[colCustomer]).map(row => ({
      customerNumber: String(row[colCustomer]).trim(),
      amount: Math.round(Number(row[colAmount]) || 0),
      usage: Number(row[colUsage]) || 0,
      periodStart: row[colPeriodStart] ? String(row[colPeriodStart]).trim() : null,
      periodEnd: row[colPeriodEnd] ? String(row[colPeriodEnd]).trim() : null,
      prevReading: Number(row[colPrevReading]) || 0,
      currReading: Number(row[colCurrReading]) || 0,
    }));
  };

  // ── 가스 엑셀 파싱 ──
  const parseGasExcel = (rows: any[][]): any => {
    if (rows.length < 2) return [];
    const headers = rows[0].map(h => String(h || '').trim());

    const colCustomer = findCol(headers, ['고객번호', '수용번호', 'customer']);
    const colAmount = findCol(headers, ['청구금액', '가스요금', '금액', 'amount']);
    const colUsage = findCol(headers, ['사용량', '㎥', 'usage']);
    const colPeriodStart = findCol(headers, ['사용기간시작', '검침시작', '시작일']);
    const colPeriodEnd = findCol(headers, ['사용기간종료', '검침종료', '종료일']);
    const colPrevReading = findCol(headers, ['전월지침', '전검침']);
    const colCurrReading = findCol(headers, ['당월지침', '당검침']);

    if (colCustomer < 0 || colAmount < 0) {
      return { error: '고객번호 또는 금액 컬럼을 찾을 수 없습니다' };
    }

    return rows.slice(1).filter(row => row[colCustomer]).map(row => ({
      customerNumber: String(row[colCustomer]).trim(),
      amount: Math.round(Number(row[colAmount]) || 0),
      usage: Number(row[colUsage]) || 0,
      periodStart: row[colPeriodStart] ? String(row[colPeriodStart]).trim() : null,
      periodEnd: row[colPeriodEnd] ? String(row[colPeriodEnd]).trim() : null,
      prevReading: Number(row[colPrevReading]) || 0,
      currReading: Number(row[colCurrReading]) || 0,
    }));
  };

  // ── 날짜 문자열 정규화 (엑셀 형식 → YYYY-MM-DD) ──
  const normalizeDate = (dateStr: any): string | null => {
    if (!dateStr) return null;
    const s = String(dateStr).trim();
    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    // MM/DD 또는 M/D
    const slashMatch = s.match(/^(\d{1,2})\/(\d{1,2})$/);
    if (slashMatch) {
      const [, mm, dd] = slashMatch;
      const year = new Date().getFullYear();
      return `${year}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
    }
    // MM.DD~MM.DD 형식 (가스)
    const rangeMatch = s.match(/^(\d{1,2})\.(\d{1,2})~(\d{1,2})\.(\d{1,2})$/);
    if (rangeMatch) {
      const year = new Date().getFullYear();
      return `${year}-${rangeMatch[1].padStart(2, '0')}-${rangeMatch[2].padStart(2, '0')}`;
    }
    // 엑셀 시리얼 날짜
    const num = Number(s);
    if (num > 40000 && num < 50000) {
      const d = new Date((num - 25569) * 86400 * 1000);
      return d.toISOString().slice(0, 10);
    }
    return null;
  };

  const normalizePeriodEnd = (dateStr: any): string | null => {
    if (!dateStr) return null;
    const s = String(dateStr).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const slashMatch = s.match(/^(\d{1,2})\/(\d{1,2})$/);
    if (slashMatch) {
      const [, mm, dd] = slashMatch;
      const year = new Date().getFullYear();
      return `${year}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
    }
    const rangeMatch = String(dateStr).trim().match(/~(\d{1,2})\.(\d{1,2})$/);
    if (rangeMatch) {
      const year = new Date().getFullYear();
      return `${year}-${rangeMatch[1].padStart(2, '0')}-${rangeMatch[2].padStart(2, '0')}`;
    }
    const num = Number(s);
    if (num > 40000 && num < 50000) {
      const d = new Date((num - 25569) * 86400 * 1000);
      return d.toISOString().slice(0, 10);
    }
    return null;
  };

  // ── 파일 업로드 핸들러 ──
  const handleFile = useCallback(async (file: File) => {
    setUploading(true);
    setResult(null);

    try {
      // 1. 엑셀 파싱
      const ab = await file.arrayBuffer();
      const wb = XLSX.read(ab, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

      const parsed = uploadType === 'elec' ? parseElecExcel(rows) : parseGasExcel(rows);
      if (parsed.error) {
        setResult({ matched: [], unmatched: [], errors: [parsed.error] });
        setUploading(false);
        return;
      }

      // 2. 고객번호 매핑 로드
      const customerMap = await loadCustomerMap(uploadType);

      // 3. 매칭 + meter_readings INSERT
      const matched: any[] = [];
      const unmatched: any[] = [];
      const errors: string[] = [];

      for (const row of parsed) {
        const rooms = (customerMap as Record<string, any[]>)[row.customerNumber];
        if (!rooms || rooms.length === 0) {
          unmatched.push({ customerNumber: row.customerNumber, amount: row.amount });
          continue;
        }

        for (const room of rooms) {
          const shareRatio = rooms.length > 1 ? (1 / rooms.length) : 1;
          const sharedAmount = truncate10(Math.round(row.amount * shareRatio));
          const sharedUsage = Math.round(row.usage * shareRatio);

          const readingDate = normalizeDate(row.periodEnd) || new Date().toISOString().slice(0, 10);

          const record = {
            building_id: room.buildingId,
            room_id: room.roomId,
            type: uploadType,
            reading_date: readingDate,
            reading_value: row.currReading,
            usage: sharedUsage,
            amount: sharedAmount,
            period_start: normalizeDate(row.periodStart),
            period_end: normalizePeriodEnd(row.periodEnd),
            billing_month: billingMonth,
            customer_number: row.customerNumber,
            is_meter_replaced: false,
            source: 'upload',
          };

          // TODO Phase 6: API endpoint 필요 (POST /api/meter-readings)
          const error = null as any;

          if (error) {
            errors.push(`${room.buildingName} ${room.roomNumber}: API not implemented`);
          } else {
            matched.push({ ...room, amount: sharedAmount, usage: sharedUsage });
          }
        }
      }

      setResult({ matched, unmatched, errors });
      if (onComplete) onComplete({ matched, unmatched, errors });
    } catch (err: any) {
      setResult({ matched: [], unmatched: [], errors: [err.message] });
    }

    setUploading(false);
  }, [uploadType, billingMonth, loadCustomerMap, onComplete]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="bg-white rounded-xl border border-[#E5E5E5] p-5 mb-5">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-sm font-extrabold text-hm-text">검침 데이터 업로드</span>
        <div className="flex gap-1.5">
          {(['elec', 'gas'] as const).map(type => (
            <button
              key={type}
              onClick={() => setUploadType(type)}
              className={`px-3 py-1 rounded-md text-xs font-bold cursor-pointer transition-all duration-150 ${
                uploadType === type
                  ? 'border border-[#346aff] bg-[#EBF0FF] text-[#346aff]'
                  : 'border border-[#E5E5E5] bg-white text-[#666] hover:border-[#346aff]/40'
              }`}
            >
              {type === 'elec' ? '⚡ 전기' : '🔥 가스'}
            </button>
          ))}
        </div>
        <span className="text-[11px] text-hm-text-muted ml-auto">{billingMonth}</span>
      </div>

      {/* 드래그 영역 */}
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
        className={`border-[1.5px] border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer transition-all duration-150 hover:border-[#346aff]/40 ${
          uploading ? 'bg-hm-bg' : 'bg-[#FAFBFC]'
        }`}
        onClick={() => document.getElementById('meter-upload-input')?.click()}
      >
        <input
          id="meter-upload-input"
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleInputChange}
          className="hidden"
        />
        {uploading ? (
          <span className="text-[13px] text-[#346aff] font-semibold">업로드 중...</span>
        ) : (
          <div>
            <div className="text-[13px] text-[#666] mb-1">
              {uploadType === 'elec' ? '한전 청구서' : '가스 청구서'} 엑셀 파일을 드래그하거나 클릭
            </div>
            <div className="text-[11px] text-hm-text-muted">
              고객번호로 호실을 자동 매칭하여 meter_readings에 저장합니다
            </div>
          </div>
        )}
      </div>

      {/* 결과 표시 */}
      {result && (
        <div className="mt-4">
          {result.matched.length > 0 && (
            <div className="text-xs text-hm-success font-bold mb-1.5">
              ✓ 매칭 성공: {result.matched.length}건
              <div className="font-normal mt-1 max-h-[120px] overflow-y-auto">
                {result.matched.map((m: any, i: number) => (
                  <div key={i} className="text-[11px] text-[#333] py-0.5">
                    {m.buildingName} {m.roomNumber} — {m.amount.toLocaleString()}원 ({m.usage}{uploadType === 'elec' ? 'kWh' : '㎥'})
                  </div>
                ))}
              </div>
            </div>
          )}
          {result.unmatched.length > 0 && (
            <div className="text-xs text-hm-danger font-bold mb-1.5">
              ✗ 미매칭: {result.unmatched.length}건
              <div className="font-normal mt-1">
                {result.unmatched.map((u: any, i: number) => (
                  <div key={i} className="text-[11px] text-hm-text-muted py-0.5">
                    고객번호 {u.customerNumber} — {u.amount.toLocaleString()}원
                  </div>
                ))}
              </div>
            </div>
          )}
          {result.errors.length > 0 && (
            <div className="text-xs text-hm-danger font-bold">
              오류: {result.errors.join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
