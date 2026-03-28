// @ts-nocheck
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { defaultSettlementExpenses } from '../data';
import { defaultBillingHistory, defaultTransactions } from '../data/defaultFinanceData';

// 청구/수금은 처음부터 새로 쌓아갈 예정. localStorage 레거시 미사용.
export const useFinanceStore = create(
  persist(
    (set, get) => ({
      roomBalances: {},
      billingHistory: defaultBillingHistory,
      transactions: defaultTransactions,
      billingConfirmed: {},
      billingSent: {},
      lateFeeOverrides: {},
      settlementExpenses: defaultSettlementExpenses,
      cashbookEntries: [],

      setRoomBalances: (v) =>
        set((s) => ({ roomBalances: typeof v === 'function' ? v(s.roomBalances) : v })),
      setBillingHistory: (v) =>
        set((s) => ({ billingHistory: typeof v === 'function' ? v(s.billingHistory) : v })),
      setTransactions: (v) =>
        set((s) => ({ transactions: typeof v === 'function' ? v(s.transactions) : v })),
      setBillingConfirmed: (v) =>
        set((s) => ({ billingConfirmed: typeof v === 'function' ? v(s.billingConfirmed) : v })),
      setBillingSent: (v) =>
        set((s) => ({ billingSent: typeof v === 'function' ? v(s.billingSent) : v })),
      setLateFeeOverrides: (v) =>
        set((s) => ({ lateFeeOverrides: typeof v === 'function' ? v(s.lateFeeOverrides) : v })),
      setSettlementExpenses: (v) =>
        set((s) => ({
          settlementExpenses: typeof v === 'function' ? v(s.settlementExpenses) : v,
        })),
      setCashbookEntries: (v) =>
        set((s) => ({ cashbookEntries: typeof v === 'function' ? v(s.cashbookEntries) : v })),

      // 청구 추가
      addBilling: (building, room, name, items, total) => {
        const key = `${building}_${room}`;
        set((s) => ({
          roomBalances: { ...s.roomBalances, [key]: (s.roomBalances[key] || 0) + total },
          billingHistory: [
            ...s.billingHistory,
            {
              id: s.billingHistory.length + 1,
              date: new Date().toISOString().slice(0, 10),
              building,
              room,
              name,
              items,
              total,
            },
          ],
        }));
      },

      // 출납 내역 추가
      addCashbookEntry: (entry) => {
        set((s) => {
          if (entry.sourceId && s.cashbookEntries.some((e) => e.sourceId === entry.sourceId))
            return s;
          return {
            cashbookEntries: [
              ...s.cashbookEntries,
              {
                id: Date.now() + Math.random(),
                status: '대기',
                sentAt: null,
                direction: '출금',
                ...entry,
              },
            ],
          };
        });
      },

      // 입금 처리
      addDeposit: (building, room, name, amount, method, note) => {
        const key = `${building}_${room}`;
        set((s) => ({
          roomBalances: {
            ...s.roomBalances,
            [key]: Math.max(0, (s.roomBalances[key] || 0) - amount),
          },
          transactions: [
            ...s.transactions,
            {
              id: s.transactions.length + 1,
              date: new Date().toISOString().slice(0, 10),
              type: '입금',
              building,
              room,
              name,
              amount,
              method,
              note,
            },
          ],
        }));
      },
    }),
    {
      name: 'hm-finance',
      partialize: (state) => ({
        roomBalances: state.roomBalances,
        billingHistory: state.billingHistory,
        transactions: state.transactions,
        billingConfirmed: state.billingConfirmed,
        billingSent: state.billingSent,
        lateFeeOverrides: state.lateFeeOverrides,
        settlementExpenses: state.settlementExpenses,
        cashbookEntries: state.cashbookEntries,
      }),
    },
  ),
);
