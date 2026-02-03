import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const STORAGE_KEY = 'commerce-sales-store';

interface DayStats {
  date: string; // YYYY-MM-DD
  totalSales: number;
  invoiceCount: number;
}

interface SalesState {
  nextInvoiceNumber: number;
  invoiceYear: number;
  dayStats: DayStats | null;
  // Computed
  getNextInvoiceNumber: () => string;
  getTodaySales: () => number;
  getTodayInvoiceCount: () => number;
  recordSale: (total: number) => void;
}

const getTodayKey = () => new Date().toISOString().slice(0, 10);
const currentYear = new Date().getFullYear();

export const useSalesStore = create<SalesState>()(
  persist(
    (set, get) => ({
      nextInvoiceNumber: 46,
      invoiceYear: currentYear,
      dayStats: null,

      getNextInvoiceNumber: () => {
        const { nextInvoiceNumber, invoiceYear } = get();
        const year = new Date().getFullYear();
        const num = year !== invoiceYear ? 1 : nextInvoiceNumber;
        return `INV-${year}-${String(num).padStart(4, '0')}`;
      },

      getTodaySales: () => {
        const today = getTodayKey();
        const stats = get().dayStats;
        return stats?.date === today ? stats.totalSales : 0;
      },

      getTodayInvoiceCount: () => {
        const today = getTodayKey();
        const stats = get().dayStats;
        return stats?.date === today ? stats.invoiceCount : 0;
      },

      recordSale: (total: number) => {
        const today = getTodayKey();
        set((state) => {
          const year = new Date().getFullYear();
          const newInvoiceNum =
            year !== state.invoiceYear ? 1 : state.nextInvoiceNumber + 1;
          const stats = state.dayStats;
          const newStats: DayStats =
            stats?.date === today
              ? {
                  date: today,
                  totalSales: stats.totalSales + total,
                  invoiceCount: stats.invoiceCount + 1,
                }
              : {
                  date: today,
                  totalSales: total,
                  invoiceCount: 1,
                };
          return {
            nextInvoiceNumber: newInvoiceNum,
            invoiceYear: year,
            dayStats: newStats,
          };
        });
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (s) => ({
        nextInvoiceNumber: s.nextInvoiceNumber,
        invoiceYear: s.invoiceYear,
        dayStats: s.dayStats,
      }),
    }
  )
);
