import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // YouTube API
  youtube: {
    getInfo: (url: string) => ipcRenderer.invoke('youtube:getInfo', url),
    download: (url: string) => ipcRenderer.invoke('youtube:download', url),
    onDownloadProgress: (callback: (progress: number) => void) => {
      ipcRenderer.on('youtube:downloadProgress', (_, progress) => callback(progress))
    }
  },
  
  // AI API
  ai: {
    analyze: (transcript: string, options: any) => 
      ipcRenderer.invoke('ai:analyze', transcript, options),
    generateHook: (clipContent: string, apiKey: string) => 
      ipcRenderer.invoke('ai:generateHook', clipContent, apiKey)
  },
  
  // FFmpeg API
  ffmpeg: {
    createClip: (videoPath: string, clipOptions: any) =>
      ipcRenderer.invoke('ffmpeg:createClip', videoPath, clipOptions),
    getMetadata: (videoPath: string) =>
      ipcRenderer.invoke('ffmpeg:getMetadata', videoPath),
    generateThumbnails: (videoPath: string, timestamps: number[]) =>
      ipcRenderer.invoke('ffmpeg:generateThumbnails', videoPath, timestamps),
    onClipProgress: (callback: (progress: number) => void) => {
      ipcRenderer.on('ffmpeg:clipProgress', (_, progress) => callback(progress))
    }
  },
  
  // Whisper API
  whisper: {
    transcribe: (audioPath: string, apiKey: string) =>
      ipcRenderer.invoke('whisper:transcribe', audioPath, apiKey)
  },
  
  // Dialog API
  dialog: {
    selectFolder: () => ipcRenderer.invoke('dialog:selectFolder')
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
