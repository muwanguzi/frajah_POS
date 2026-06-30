import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BranchState {
  activeBranchId: string | null;
  activeBranchName: string | null;
  setBranch: (id: string, name: string) => void;
  clearBranch: () => void;
}

export const useBranchStore = create<BranchState>()(
  persist(
    (set) => ({
      activeBranchId: null,
      activeBranchName: null,
      setBranch: (id, name) => set({ activeBranchId: id, activeBranchName: name }),
      clearBranch: () => set({ activeBranchId: null, activeBranchName: null }),
    }),
    { name: 'franjah-branch' }
  )
);
