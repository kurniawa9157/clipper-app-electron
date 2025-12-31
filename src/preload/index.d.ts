import { ElectronAPI } from '@electron-toolkit/preload'

export interface ClipperAPI {
  youtube: {
    getInfo: (url: string) => Promise<{
      id: string
      title: string
      duration: number
      thumbnail: string
      channel: string
    }>
    download: (url: string) => Promise<string>
    onDownloadProgress: (callback: (progress: number) => void) => void
  }
  ai: {
    analyze: (transcript: string, options: {
      genre: string
      clipDuration: number
      clipCount: number
      customPrompt?: string
      apiKey?: string
    }) => Promise<Array<{
      startTime: number
      endTime: number
      score: number
      reason: string
      suggestedTitle: string
      viralHook: string
    }>>
    generateHook: (clipContent: string) => Promise<string>
  }
  ffmpeg: {
    createClip: (videoPath: string, clipOptions: {
      startTime: number
      duration: number
      outputPath: string
      filters?: string[]
      viralHook?: string
      cropPosition?: 'auto' | 'left' | 'center' | 'right'
    }) => Promise<string>
    getMetadata: (videoPath: string) => Promise<any>
    generateThumbnails: (videoPath: string, timestamps: number[]) => Promise<string[]>
    onClipProgress: (callback: (progress: number) => void) => void
  }
  whisper: {
    transcribe: (audioPath: string, apiKey: string) => Promise<string>
  }
  dialog: {
    selectFolder: () => Promise<string>
    moveFile: (sourcePath: string, destPath: string) => Promise<string>
    deleteFile: (filePath: string) => Promise<boolean>
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: ClipperAPI
  }
}
