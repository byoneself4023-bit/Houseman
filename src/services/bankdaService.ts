export interface BankdaTransaction {
  bkcode: string;
  accountnum: string;
  bkname: string;
  bkdate: string;      // YYYYMMDD
  bktime: string;      // HHMMSS
  bkjukyo: string;     // 적요 (입금자명)
  bkcontent: string;
  bketc: string;
  bkinput: string;      // 입금액 (출금이면 "0")
  bkoutput: string;     // 출금액 (입금이면 "0")
  bkjango: string;      // 잔액
}

export interface BankdaResponse {
  request: {
    accountnum: string;
    bkname: string;
    bkcode: string;
    datefrom: string;
    dateto: string;
  };
  response: {
    record: number;
    description: string;
    bank: BankdaTransaction[];
  };
}

/** Bankda API를 호출하여 거래내역을 조회한다. Vite proxy 경유. */
export async function fetchBankdaTransactions(params: {
  accountnum?: string;
  datefrom: string;
  dateto: string;
  istest?: 'y' | 'n';
}): Promise<BankdaResponse> {
  const token = import.meta.env.VITE_BANKDA_TOKEN;
  if (!token) throw new Error('VITE_BANKDA_TOKEN이 설정되지 않았습니다.');

  const body = new URLSearchParams({
    datefrom: params.datefrom,
    dateto: params.dateto,
    datatype: 'json',
    charset: 'utf8',
    istest: params.istest || 'n',
  });
  if (params.accountnum) body.set('accountnum', params.accountnum);

  const res = await fetch('/api/bankda/bank_tr.php', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!res.ok) throw new Error(`Bankda API error: ${res.status}`);
  return res.json();
}

/** Bankda 거래를 기존 sampleBankData 형식으로 변환 */
export function toBankdaLocal(tx: BankdaTransaction) {
  const input = parseInt(tx.bkinput) || 0;
  const output = parseInt(tx.bkoutput) || 0;
  const d = tx.bkdate; // YYYYMMDD
  const t = tx.bktime; // HHMMSS
  return {
    id: tx.bkcode,
    date: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`,
    time: t ? `${t.slice(0, 2)}:${t.slice(2, 4)}` : '',
    depositor: tx.bkjukyo || tx.bkcontent || tx.bketc || '(적요없음)',
    amount: input > 0 ? input : output,
    type: (input > 0 ? '입금' : '출금') as '입금' | '출금',
    bank: tx.bkname,
    accountnum: tx.accountnum,
    memo: tx.bketc,
    balance: parseInt(tx.bkjango) || 0,
  };
}
