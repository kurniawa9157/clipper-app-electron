// Custom hook for using clipper services
import { useState, useCallback } from 'react'
import { useSettingsStore } from '../store/settingsStore'

export interface ProcessingStatus {
  stage: 'idle' | 'downloading' | 'analyzing' | 'generating' | 'complete' | 'error'
  progress: number
  message: string
  error?: string
}

export interface ClipData {
  startTime: number
  endTime: number
  score: number
  reason: string
  suggestedTitle: string
  viralHook: string
  thumbnailPath?: string
  outputPath?: string
  previewPath?: string  // Temp preview path
  isKept?: boolean  // Whether user kept this clip
}

export function useClipperService() {
  const { settings } = useSettingsStore()
  const [status, setStatus] = useState<ProcessingStatus>({
    stage: 'idle',
    progress: 0,
    message: ''
  })
  const [clips, setClips] = useState<ClipData[]>([])
  const [videoPath, setVideoPath] = useState<string>('')

  const processVideo = useCallback(async (
    youtubeUrl: string,
    options: {
      genre: string
      clipDuration: number
      clipCount: number
      customPrompt?: string
      transcript?: string
      apiKey?: string  // Add API key parameter
    }
  ) => {
    try {
      // Check for API key
      if (!options.apiKey) {
        setStatus({
          stage: 'error',
          progress: 0,
          message: 'API key not configured',
          error: 'Please set your Gemini API key in Settings'
        })
        return
      }

      // Step 1: Get video info
      setStatus({ stage: 'downloading', progress: 0, message: 'Fetching video information...' })
      const videoInfo = await window.api.youtube.getInfo(youtubeUrl)
      
      // Step 2: Download video
      setStatus({ stage: 'downloading', progress: 10, message: `Downloading: ${videoInfo.title}` })
      
      window.api.youtube.onDownloadProgress((progress) => {
        setStatus({ stage: 'downloading', progress: 10 + (progress * 0.4), message: `Downloading: ${Math.round(progress)}%` })
      })
      
      const downloadedPath = await window.api.youtube.download(youtubeUrl)
      setVideoPath(downloadedPath)
      
      // Step 3: AI Analysis
      setStatus({ stage: 'analyzing', progress: 50, message: 'Analyzing video with AI...' })
      
      let analysisResult: ClipData[]
      let transcriptText = options.transcript
      
      if (!transcriptText) {
        // No manual transcript - use Whisper if API key available
        const openaiApiKey = localStorage.getItem('clipper-settings')
          ? JSON.parse(localStorage.getItem('clipper-settings')!).state?.settings?.openaiApiKey
          : ''
        
        if (openaiApiKey) {
          try {
            setStatus({ stage: 'analyzing', progress: 52, message: 'Extracting audio for transcription...' })
            
            // Extract audio from video (using YouTube service's extractAudio or FFmpeg)
            // For now, we'll skip audio extraction as it needs to be exposed via IPC
            // User will need to provide transcript manually or we implement audio extraction IPC
            
            setStatus({ 
              stage: 'error',
              progress: 0,
              message: 'Auto-transcription ready',
              error: 'Please add audio extraction first, or paste transcript manually for now'
            })
            return
          } catch (error: any) {
            setStatus({
              stage: 'error',
              progress: 0,
              message: 'Transcription failed',
              error: error.message
            })
            return
          }
        } else {
          // No transcript and no OpenAI key
          setStatus({
            stage: 'error',
            progress: 0,
            message: 'Transcript required',
            error: 'Please paste transcript or set OpenAI API key for auto-transcription'
          })
          return
        }
      }
      
      // Analyze with AI (apiKey passed in main process from settings)
      analysisResult = await window.api.ai.analyze(transcriptText, {
        genre: options.genre,
        clipDuration: options.clipDuration,
        clipCount: options.clipCount,
        customPrompt: options.customPrompt,
        apiKey: options.apiKey
      })
      
      setClips(analysisResult)
      
      // Step 4: Generate thumbnails
      setStatus({ stage: 'generating', progress: 70, message: 'Generating clip previews...' })
      const timestamps = analysisResult.map(clip => clip.startTime)
      
      if (timestamps.length > 0) {
        const thumbnails = await window.api.ffmpeg.generateThumbnails(downloadedPath, timestamps)
        
        // Update clips with thumbnail paths
        const updatedClips = analysisResult.map((clip, index) => ({
          ...clip,
          thumbnailPath: thumbnails[index]
        }))
        
        setClips(updatedClips)
      }
      
      setStatus({ stage: 'complete', progress: 100, message: `Found ${analysisResult.length} viral clips!` })
    } catch (error: any) {
      setStatus({ 
        stage: 'error', 
        progress: 0, 
        message: 'Processing failed', 
        error: error.message 
      })
    }
  }, [])

  const generateClip = useCallback(async (clip: ClipData, index: number) => {
    try {
      if (!videoPath) throw new Error('Video not downloaded')
      
      console.log('Generating clip preview:', clip.suggestedTitle)
      
      // Create filename from AI-suggested title
      // Sanitize filename: remove special chars, limit length
      let sanitizedTitle = clip.suggestedTitle
        .replace(/[<>:"/\\|?*]/g, '') // Remove invalid chars
        .replace(/\s+/g, '_') // Replace spaces with underscore
        .trim()
        .substring(0, 50) // Limit length
      
      // Fallback if sanitized title is empty
      if (!sanitizedTitle || sanitizedTitle.length === 0) {
        sanitizedTitle = `Clip_${index + 1}`
      }
      
      const timestamp = Date.now() // Use timestamp number directly
      const previewFilename = `preview_${sanitizedTitle}_${timestamp}.mp4`
      
      // Generate to TEMP folder first for preview
      const tempPath = `temp/${previewFilename}`
      
      console.log('Preview path:', tempPath)
      
      window.api.ffmpeg.onClipProgress((progress) => {
        setStatus({ 
          stage: 'generating', 
          progress: 70 + (progress * 0.3), 
          message: `Creating preview: ${clip.suggestedTitle.substring(0, 30)}... ${Math.round(progress)}%` 
        })
      })
      
      const previewPath = await window.api.ffmpeg.createClip(videoPath, {
        startTime: clip.startTime,
        duration: clip.endTime - clip.startTime,
        outputPath: tempPath,
        viralHook: clip.viralHook,
        cropPosition: settings.cropPosition
      })
      
      // Update clip with preview path (not final output yet)
      setClips(prev => prev.map((c, i) => 
        i === index ? { ...c, previewPath, isKept: false } : c
      ))
      
      return previewPath
    } catch (error: any) {
      console.error('Generate clip error:', error)
      throw new Error(`Failed to generate clip: ${error.message}`)
    }
  }, [videoPath, settings.cropPosition])

  const keepClip = useCallback(async (clip: ClipData, index: number) => {
    try {
      if (!clip.previewPath) throw new Error('No preview to keep')

      console.log('Keeping clip:', clip.suggestedTitle)

      // Move from temp to final output location
      const sanitizedTitle = clip.suggestedTitle
        .replace(/[<>:"/\\|?*]/g, '')
        .replace(/\s+/g, '_')
        .trim()
        .substring(0, 50) || `Clip_${index + 1}`
      
      const timestamp = Date.now()
      const outputFilename = `${sanitizedTitle}_${timestamp}.mp4`
      
      const settingsData = localStorage.getItem('clipper-settings')
      const outputDir = settingsData
        ? JSON.parse(settingsData).state?.settings?.outputDirectory || ''
        : ''
      
      const finalPath = outputDir 
        ? `${outputDir}/${outputFilename}`.replace(/\\/g, '/')
        : `output/${outputFilename}`

      // Use IPC to move file from temp to final
      await window.api.dialog.moveFile(clip.previewPath, finalPath)
      
      // Update clip status
      setClips(prev => prev.map((c, i) => 
        i === index ? { ...c, outputPath: finalPath, isKept: true } : c
      ))

      console.log('Clip saved to:', finalPath)
    } catch (error: any) {
      throw new Error(`Failed to keep clip: ${error.message}`)
    }
  }, [])

  const deleteClip = useCallback(async (clip: ClipData, index: number) => {
    try {
      if (!clip.previewPath) return

      console.log('Deleting preview:', clip.suggestedTitle)

      // Delete temp file
      await window.api.dialog.deleteFile(clip.previewPath)
      
      // Update clip status
      setClips(prev => prev.map((c, i) => 
        i === index ? { ...c, previewPath: undefined, isKept: false } : c
      ))

      console.log('Preview deleted')
    } catch (error: any) {
      console.error('Delete error:', error)
    }
  }, [])

  const reset = useCallback(() => {
    setStatus({ stage: 'idle', progress: 0, message: '' })
    setClips([])
    setVideoPath('')
  }, [])

  return {
    status,
    clips,
    processVideo,
    generateClip,
    keepClip,
    deleteClip,
    reset
  }
}
