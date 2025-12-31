// Settings Store using Zustand
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Settings {
  geminiApiKey: string
  openaiApiKey: string
  outputDirectory: string
  defaultGenre: string
  defaultClipDuration: number
  defaultClipCount: number
  cropPosition: 'auto' | 'left' | 'center' | 'right'  // Smart auto-detect or manual
}

interface SettingsStore {
  settings: Settings
  updateSettings: (settings: Partial<Settings>) => void
  resetSettings: () => void
}

const defaultSettings: Settings = {
  geminiApiKey: '',
  openaiApiKey: '',
  outputDirectory: '',
  defaultGenre: 'auto',
  defaultClipDuration: 60,
  defaultClipCount: 10,
  cropPosition: 'auto'  // Smart auto-detection by default
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings }
        })),
      resetSettings: () =>
        set({ settings: defaultSettings })
    }),
    {
      name: 'clipper-settings'
    }
  )
)
