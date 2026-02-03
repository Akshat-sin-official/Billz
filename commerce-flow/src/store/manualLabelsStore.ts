import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ManualLabel {
  id: string;
  productName: string;
  unit: string;
  pricePerUnit: number;
  weight: number;
  totalPrice: number;
  taxRate: number;
  createdAt: number;
}

interface ManualLabelsStore {
  labels: Record<string, ManualLabel>;
  addLabel: (label: Omit<ManualLabel, 'id' | 'createdAt'>) => string;
  getLabel: (id: string) => ManualLabel | undefined;
}

const generateId = () => `M${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const useManualLabelsStore = create<ManualLabelsStore>()(
  persist(
    (set, get) => ({
      labels: {},

      addLabel: (label) => {
        const id = generateId();
        const fullLabel: ManualLabel = {
          ...label,
          id,
          createdAt: Date.now(),
        };
        set((state) => ({
          labels: { ...state.labels, [id]: fullLabel },
        }));
        return id;
      },

      getLabel: (id) => get().labels[id],
    }),
    { name: 'commerce-manual-labels' }
  )
);
