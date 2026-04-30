import { create } from 'zustand';

export interface Command {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  category: 'navigation' | 'action' | 'settings';
  action: () => void;
}

interface CommandState {
  isOpen: boolean;
  query: string;
  selectedIndex: number;
  commands: Command[];
  open: () => void;
  close: () => void;
  setQuery: (q: string) => void;
  setSelectedIndex: (i: number) => void;
  execute: (index: number) => void;
}

export const useCommandStore = create<CommandState>((set, get) => ({
  isOpen: false,
  query: '',
  selectedIndex: 0,
  commands: [],

  open: () => set({ isOpen: true, query: '', selectedIndex: 0 }),
  close: () => set({ isOpen: false, query: '', selectedIndex: 0 }),

  setQuery: (q) => set({ query: q, selectedIndex: 0 }),

  setSelectedIndex: (i) => set({ selectedIndex: i }),

  execute: (index) => {
    const { commands } = get();
    const filtered = getFilteredCommands(commands, get().query);
    if (filtered[index]) {
      filtered[index].action();
      get().close();
    }
  },
}));

export function getFilteredCommands(commands: Command[], query: string): Command[] {
  if (!query.trim()) return commands;
  const q = query.toLowerCase();
  return commands.filter((c) => c.label.toLowerCase().includes(q));
}