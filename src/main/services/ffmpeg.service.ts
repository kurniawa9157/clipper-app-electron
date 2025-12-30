// FFmpeg Service for video processing
// Handles clip extraction, filters, and rendering

import ffmpeg from 'fluent-ffmpeg'
import * as path from 'path'

export interface ClipOptions {
  startTime: number
  duration: number
  outputPath: string
  filters?: string[]
}

export interface SubtitleOptions {
  srtPath: string
  fontFamily?: string
  fontSize?: number
  fontColor?: string
  outlineColor?: string
  outlineWidth?: number
}

export class FFmpegService {
  private outputDir: string
  private ffmpegPath: string
  private ffprobePath: string

  constructor() {
    // Use bundled binaries from resources folder
    const isDev = process.env.NODE_ENV === 'development'
    const resourcesPath = isDev 
      ? require('path').join(process.cwd(), 'resources')
      : require('path').join(process.resourcesPath)
    
    this.ffmpegPath = require('path').join(resourcesPath, 'binaries', 'ffmpeg.exe')
    this.ffprobePath = require('path').join(resourcesPath, 'binaries', 'ffprobe.exe')
    
    // Set FFmpeg paths
    ffmpeg.setFfmpegPath(this.ffmpegPath)
    ffmpeg.setFfprobePath(this.ffprobePath)
    
    this.outputDir = require('path').join(process.cwd(), 'output')
    if (!require('fs').existsSync(this.outputDir)) {
      require('fs').mkdirSync(this.outputDir, { recursive: true })
    }
  }

  /**
   * Extract clip from video with anti-reupload protection
   */
  async createClip(
    videoPath: string,
    clipOptions: ClipOptions,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      // Get video metadata first to calculate crop
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          reject(err)
          return
        }

        const videoStream = metadata.streams.find(s => s.codec_type === 'video')
        if (!videoStream || !videoStream.width || !videoStream.height) {
          reject(new Error('Could not determine video dimensions'))
          return
        }

        const inputWidth = videoStream.width
        const inputHeight = videoStream.height

        // Calculate 9:16 crop (vertical format)
        const cropFilter = this.getCropFilter(inputWidth, inputHeight)
        
        // Anti-copyright filters (simplified for stability)
        const antiCopyrightFilters = [
          cropFilter,
          // Slight speed change (0.98x - 1.02x) - subtle but effective
          `setpts=${(0.98 + Math.random() * 0.04).toFixed(3)}*PTS`
        ]
        
        // Combine with user filters if provided
        const filters = clipOptions.filters || []
        const allFilters = [...antiCopyrightFilters, ...filters]

        console.log('Creating clip with output path:', clipOptions.outputPath)

        let command = ffmpeg(videoPath)
          .setStartTime(clipOptions.startTime)
          .setDuration(clipOptions.duration)
          .videoFilters(allFilters)
          .output(clipOptions.outputPath)
          .on('progress', (progress) => {
            if (onProgress && progress.percent) {
              onProgress(progress.percent)
            }
          })
          .on('end', () => {
            resolve(clipOptions.outputPath)
          })
          .on('error', (err) => {
            reject(new Error(`FFmpeg error: ${err.message}`))
          })

        command.run()
      })
    })
  }

  /**
   * Crop video to 9:16 (vertical format)
   */
  getCropFilter(inputWidth: number, inputHeight: number, centerX?: number, centerY?: number): string {
    const targetAspect = 9 / 16
    const inputAspect = inputWidth / inputHeight

    let cropWidth: number
    let cropHeight: number

    if (inputAspect > targetAspect) {
      // Video is too wide
      cropHeight = inputHeight
      cropWidth = cropHeight * targetAspect
    } else {
      // Video is too tall
      cropWidth = inputWidth
      cropHeight = cropWidth / targetAspect
    }

    const x = centerX ?? (inputWidth - cropWidth) / 2
    const y = centerY ?? (inputHeight - cropHeight) / 2

    return `crop=${Math.floor(cropWidth)}:${Math.floor(cropHeight)}:${Math.floor(x)}:${Math.floor(y)}`
  }

  /**
   * Apply anti-copyright filters
   */
  getAntiCopyrightFilters(): string[] {
    return [
      'eq=brightness=0.05', // Slight brightness increase
      'setpts=0.95*PTS', // Speed up by 5%
      // 'hflip', // Horizontal flip (optional, can be uncommented)
    ]
  }

  /**
   * Add subtitles to video
   */
  async addSubtitles(
    videoPath: string,
    subtitleOptions: SubtitleOptions,
    outputPath: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const fontFamily = subtitleOptions.fontFamily || 'Arial'
      const fontSize = subtitleOptions.fontSize || 24
      const fontColor = subtitleOptions.fontColor || 'white'
      const outlineColor = subtitleOptions.outlineColor || 'black'
      const outlineWidth = subtitleOptions.outlineWidth || 2

      // Escape paths for FFmpeg
      const srtPath = subtitleOptions.srtPath.replace(/\\/g, '/')
      const escapedSrtPath = srtPath.replace(/:/g, '\\\\:')

      const subtitleFilter = `subtitles=${escapedSrtPath}:force_style='FontName=${fontFamily},FontSize=${fontSize},PrimaryColour=&H${this.colorToHex(fontColor)},OutlineColour=&H${this.colorToHex(outlineColor)},Outline=${outlineWidth}'`

      ffmpeg(videoPath)
        .videoFilters(subtitleFilter)
        .output(outputPath)
        .on('end', () => {
          resolve(outputPath)
        })
        .on('error', (err) => {
          reject(new Error(`Subtitle addition failed: ${err.message}`))
        })
        .run()
    })
  }

  /**
   * Extract audio from video
   */
  async extractAudio(videoPath: string, outputPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .noVideo()
        .audioCodec('libmp3lame')
        .output(outputPath)
        .on('end', () => {
          resolve(outputPath)
        })
        .on('error', (err) => {
          reject(new Error(`Audio extraction failed: ${err.message}`))
        })
        .run()
    })
  }

  /**
   * Generate thumbnails from video
   */
  async generateThumbnails(
    videoPath: string,
    timestamps: number[],
    outputDir: string
  ): Promise<string[]> {
    const thumbnails: string[] = []

    for (let i = 0; i < timestamps.length; i++) {
      const timestamp = timestamps[i]
      const outputPath = path.join(outputDir, `thumb_${i}.jpg`)

      await new Promise<void>((resolve, reject) => {
        ffmpeg(videoPath)
          .screenshots({
            timestamps: [timestamp],
            filename: `thumb_${i}.jpg`,
            folder: outputDir,
            size: '1080x1920'
          })
          .on('end', () => {
            thumbnails.push(outputPath)
            resolve()
          })
          .on('error', (err) => {
            reject(err)
          })
      })
    }

    return thumbnails
  }

  /**
   * Apply background blur for horizontal videos
   */
  getBackgroundBlurFilter(_inputWidth: number, _inputHeight: number): string {
    // Create blurred background + centered video on top
    return `[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=20:20[bg];[0:v]scale=1080:-2[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2`
  }

  /**
   * Convert color name to FFmpeg hex format
   */
  private colorToHex(color: string): string {
    const colorMap: Record<string, string> = {
      white: 'FFFFFF',
      black: '000000',
      red: '0000FF',
      yellow: '00FFFF',
      cyan: 'FFFF00',
      magenta: 'FF00FF'
    }

    return colorMap[color.toLowerCase()] || 'FFFFFF'
  }

  /**
   * Get video metadata
   */
  async getMetadata(videoPath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          reject(err)
        } else {
          resolve(metadata)
        }
      })
    })
  }
}
