import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type FilterOperator = 'equals' | 'contains' | 'gt' | 'lt' | 'isEmpty' | 'isNotEmpty';

export interface FilterCondition {
  columnId: string;
  operator: FilterOperator;
  value: string | number | boolean | null;
}

export interface SavedFilter {
  id: string;
  name: string;
  conditions: FilterCondition[];
}

interface FilterState {
  isAdvancedMode: boolean;
  conditions: FilterCondition[];
  savedFilters: SavedFilter[];
  setAdvancedMode: (enabled: boolean) => void;
  addCondition: (condition: FilterCondition) => void;
  removeCondition: (index: number) => void;
  updateCondition: (index: number, condition: Partial<FilterCondition>) => void;
  clearConditions: () => void;
  addSavedFilter: (filter: SavedFilter) => void;
  removeSavedFilter: (id: string) => void;
  applySavedFilter: (id: string) => void;
}

export const useFilterStore = create<FilterState>()(
  persist(
    (set, get) => ({
      isAdvancedMode: false,
      conditions: [],
      savedFilters: [],

      setAdvancedMode: (enabled) => set({ isAdvancedMode: enabled }),

      addCondition: (condition) =>
        set((state) => ({ conditions: [...state.conditions, condition] })),

      removeCondition: (index) =>
        set((state) => ({
          conditions: state.conditions.filter((_, i) => i !== index),
        })),

      updateCondition: (index, condition) =>
        set((state) => ({
          conditions: state.conditions.map((c, i) =>
            i === index ? { ...c, ...condition } : c
          ),
        })),

      clearConditions: () => set({ conditions: [] }),

      addSavedFilter: (filter) =>
        set((state) => ({ savedFilters: [...state.savedFilters, filter] })),

      removeSavedFilter: (id) =>
        set((state) => ({
          savedFilters: state.savedFilters.filter((f) => f.id !== id),
        })),

      applySavedFilter: (id) => {
        const filter = get().savedFilters.find((f) => f.id === id);
        if (filter) {
          set({ conditions: [...filter.conditions] });
        }
      },
    }),
    {
      name: 'stratum-filters',
    }
  )
);