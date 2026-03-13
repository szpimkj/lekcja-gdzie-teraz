import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SETTINGS_STORAGE_KEY } from '@/lib/constants';

export type Language = 'pl' | 'en';
export type Theme = 'system' | 'light' | 'dark';

interface SettingsState {
  class_id: string | null;
  class_label: string | null;
  subgroup_id: string | null;
  subgroup_label: string | null;
  language: Language;
  theme: Theme;
  use24Hour: boolean;
  substitutionsSheetUrl: string | null;
  
  setClass: (class_id: string, class_label: string) => void;
  setSubgroup: (subgroup_id: string | null, subgroup_label: string | null) => void;
  setLanguage: (language: Language) => void;
  setTheme: (theme: Theme) => void;
  setUse24Hour: (use24Hour: boolean) => void;
  setSubstitutionsSheetUrl: (url: string | null) => void;
  reset: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      class_id: null,
      class_label: null,
      subgroup_id: null,
      subgroup_label: null,
      language: 'pl',
      theme: 'system',
      use24Hour: true,
      
      setClass: (class_id, class_label) => set({ class_id, class_label }),
      setSubgroup: (subgroup_id, subgroup_label) => set({ subgroup_id, subgroup_label }),
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
      setUse24Hour: (use24Hour) => set({ use24Hour }),
      reset: () => set({
        class_id: null,
        class_label: null,
        subgroup_id: null,
        subgroup_label: null,
      }),
    }),
    {
      name: SETTINGS_STORAGE_KEY,
    }
  )
);
