import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    title: 'ViralCraft Studio',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // YouTube Service Handlers
  ipcMain.handle('youtube:getInfo', async (_, url: string) => {
    try {
      const { YouTubeService } = await import('./services/youtube.service')
      const youtubeService = new YouTubeService()
      return await youtubeService.getVideoInfo(url)
    } catch (error: any) {
      throw new Error(error.message)
    }
  })

  ipcMain.handle('youtube:download', async (event, url: string) => {
    try {
      const { YouTubeService } = await import('./services/youtube.service')
      const youtubeService = new YouTubeService()
      
      return await youtubeService.downloadVideo(url, (progress) => {
        event.sender.send('youtube:downloadProgress', progress)
      })
    } catch (error: any) {
      throw new Error(error.message)
    }
  })

  // AI Service Handlers
  ipcMain.handle('ai:analyze', async (_, transcript: string, options: any) => {
    try {
      const { AIService } = await import('./services/ai.service')
      
      // Get API key from renderer (passed from settings)
      const apiKey = options.apiKey
      if (!apiKey) {
        throw new Error('Gemini API key not configured. Please set it in Settings.')
      }
      
      const aiService = new AIService(apiKey)
      
      // Remove apiKey from options before passing to service
      const { apiKey: _, ...analysisOptions } = options
      return await aiService.analyzeTranscript(transcript, analysisOptions)
    } catch (error: any) {
      throw new Error(error.message)
    }
  })

  ipcMain.handle('ai:generateHook', async (_, clipContent: string, apiKey: string) => {
    try {
      const { AIService } = await import('./services/ai.service')
      
      if (!apiKey) {
        throw new Error('Gemini API key not configured. Please set it in Settings.')
      }
      
      const aiService = new AIService(apiKey)
      return await aiService.generateViralHook(clipContent)
    } catch (error: any) {
      throw new Error(error.message)
    }
  })

  // FFmpeg Service Handlers
  ipcMain.handle('ffmpeg:createClip', async (event, videoPath: string, clipOptions: any) => {
    try {
      const { FFmpegService } = await import('./services/ffmpeg.service')
      const ffmpegService = new FFmpegService()
      
      return await ffmpegService.createClip(videoPath, clipOptions, (progress) => {
        event.sender.send('ffmpeg:clipProgress', progress)
      })
    } catch (error: any) {
      throw new Error(error.message)
    }
  })

  ipcMain.handle('ffmpeg:getMetadata', async (_, videoPath: string) => {
    try {
      const { FFmpegService } = await import('./services/ffmpeg.service')
      const ffmpegService = new FFmpegService()
      
      return await ffmpegService.getMetadata(videoPath)
    } catch (error: any) {
      throw new Error(error.message)
    }
  })

  ipcMain.handle('ffmpeg:generateThumbnails', async (_, videoPath: string, timestamps: number[]) => {
    try {
      const { FFmpegService } = await import('./services/ffmpeg.service')
      const ffmpegService = new FFmpegService()
      const outputDir = require('path').join(process.cwd(), 'thumbnails')
      
      return await ffmpegService.generateThumbnails(videoPath, timestamps, outputDir)
    } catch (error: any) {
      throw new Error(error.message)
    }
  })

  // Whisper Service Handlers
  ipcMain.handle('whisper:transcribe', async (_, audioPath: string, apiKey: string) => {
    try {
      const { WhisperService } = await import('./services/whisper.service')
      
      if (!apiKey) {
        throw new Error('OpenAI API key not configured. Please set it in Settings.')
      }
      
      const whisperService = new WhisperService(apiKey)
      return await whisperService.transcribe(audioPath)
    } catch (error: any) {
      throw new Error(error.message)
    }
  })

  // Dialog handlers
  ipcMain.handle('dialog:selectFolder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0]
    }
    return null
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

