// FFmpeg Service for video processing
// Handles clip extraction, filters, and rendering

import ffmpeg from 'fluent-ffmpeg'
import * as path from 'path'

export interface ClipOptions {
  startTime: number
  duration: number
  outputPath: string
  filters?: string[]
  viralHook?: string  // Optional viral hook text to overlay
  cropPosition?: 'auto' | 'left' | 'center' | 'right'  // Crop position preference
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
    return new Promise(async (resolve, reject) => {
      try {
        // Get video metadata first to calculate crop
        ffmpeg.ffprobe(videoPath, async (err, metadata) => {
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

          // Determine crop position
          let cropPosition: 'left' | 'center' | 'right' = 'center'
          
          if (clipOptions.cropPosition === 'auto') {
            // Smart auto-detection
            console.log('Running smart crop detection...')
            cropPosition = await this.detectCropPosition(videoPath)
          } else if (clipOptions.cropPosition) {
            // Manual position
            cropPosition = clipOptions.cropPosition as 'left' | 'center' | 'right'
            console.log('Using manual crop position:', cropPosition)
          }

          // Calculate 9:16 crop (vertical format) with smart positioning
          const cropFilter = this.getCropFilter(inputWidth, inputHeight, cropPosition)
          
          // Anti-copyright filters (simplified for stability)
          const antiCopyrightFilters = [
            cropFilter,
            // Slight speed change (0.98x - 1.02x) - subtle but effective
            `setpts=${(0.98 + Math.random() * 0.04).toFixed(3)}*PTS`
          ]
          
          // Add viral hook overlay if provided
          if (clipOptions.viralHook) {
            const hookFilter = this.getViralHookFilter(clipOptions.viralHook)
            antiCopyrightFilters.push(hookFilter)
          }
          
          // Combine with user filters if provided
          const filters = clipOptions.filters || []
          const allFilters = [...antiCopyrightFilters, ...filters]

          console.log('Creating clip with output path:', clipOptions.outputPath)
          console.log('Crop position:', cropPosition)
          if (clipOptions.viralHook) {
            console.log('Adding viral hook:', clipOptions.viralHook)
          }

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
      } catch (error: any) {
        reject(error)
      }
    })
  }

  /**
   * Calculate 9:16 crop filter with smart positioning
   */
  getCropFilter(inputWidth: number, inputHeight: number, position: 'left' | 'center' | 'right' = 'center'): string {
    // Target 9:16 aspect ratio for vertical video
    const targetAspect = 9 / 16
    const inputAspect = inputWidth / inputHeight

    let cropWidth: number
    let cropHeight: number
    let xOffset: number
    let yOffset: number

    if (inputAspect > targetAspect) {
      // Video is wider than 9:16, crop width
      cropHeight = inputHeight
      cropWidth = Math.floor(inputHeight * targetAspect)
      yOffset = 0

      // Calculate x offset based on position
      switch (position) {
        case 'left':
          xOffset = 0
          break
        case 'right':
          xOffset = inputWidth - cropWidth
          break
        case 'center':
        default:
          xOffset = Math.floor((inputWidth - cropWidth) / 2)
          break
      }
    } else {
      // Video is taller than 9:16, crop height
      cropWidth = inputWidth
      cropHeight = Math.floor(inputWidth / targetAspect)
      xOffset = 0
      yOffset = Math.floor((inputHeight - cropHeight) / 2)
    }

    return `crop=${cropWidth}:${cropHeight}:${xOffset}:${yOffset}`
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
   * Create viral hook text overlay filter
   * Displays AI-generated hook text at top of video with fade-in animation
   */
  getViralHookFilter(hookText: string): string {
    // Escape special characters for FFmpeg
    const escapedText = hookText
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/:/g, '\\:')
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
    
    // Viral hook overlay with eye-catching styling
    return `drawtext=` +
      `text='${escapedText}':` +
      `fontfile=/Windows/Fonts/arialbd.ttf:` + // Bold Arial
      `fontsize=60:` +
      `fontcolor=white:` +
      `borderw=4:` +
      `bordercolor=black:` +
      `x=(w-text_w)/2:` + // Centered horizontally
      `y=80:` + // 80px from top
      `shadowcolor=black@0.8:` +
      `shadowx=3:` +
      `shadowy=3:` +
      `enable='between(t,0,2)':` + // Show for first 2 seconds
      `alpha='if(lt(t,0.3),t/0.3,if(lt(t,1.7),1,(2-t)/0.3))'` // Fade in/out animation
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
   * Smart crop detection - analyzes video to find best crop position
   * Uses FFmpeg cropdetect filter to detect active content area
   */
  async detectCropPosition(videoPath: string): Promise<'left' | 'center' | 'right'> {
    return new Promise((resolve) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          console.warn('Cropdetect failed, using center:', err.message)
          resolve('center')
          return
        }

        const videoStream = metadata.streams.find(s => s.codec_type === 'video')
        if (!videoStream || !videoStream.width) {
          resolve('center')
          return
        }

        const width = videoStream.width
        const duration = metadata.format?.duration || 10
        const sampleTime = Math.min(duration * 0.3, 5) // Sample first 30% or 5 seconds

        let cropData = ''
        
        // Run cropdetect filter to analyze video
        ffmpeg(videoPath)
          .outputOptions([
            '-vf', 'cropdetect=24:2',  // Detect crop area
            '-t', sampleTime.toString(),  // Sample duration
            '-f', 'null'  // No output file
          ])
          .output('-')
          .on('stderr', (line) => {
            cropData += line
          })
          .on('end', () => {
            // Parse cropdetect output to find x position
            const cropMatches = cropData.match(/crop=(\d+):(\d+):(\d+):(\d+)/g)
            
            if (cropMatches && cropMatches.length > 0) {
              // Get most common crop position from samples
              const xPositions: number[] = []
              
              cropMatches.forEach(match => {
                const parts = match.match(/(\d+)/g)
                if (parts && parts.length >= 3) {
                  xPositions.push(parseInt(parts[2])) // x position
                }
              })

              if (xPositions.length > 0) {
                // Calculate average x position
                const avgX = xPositions.reduce((a, b) => a + b, 0) / xPositions.length
                const relativePos = avgX / width

                // Determine position based on where content is
                if (relativePos < 0.25) {
                  console.log('Smart crop: detected LEFT position')
                  resolve('left')
                } else if (relativePos > 0.75) {
                  console.log('Smart crop: detected RIGHT position')
                  resolve('right')
                } else {
                  console.log('Smart crop: detected CENTER position')
                  resolve('center')
                }
                return
              }
            }

            // Fallback to center if detection inconclusive
            console.log('Smart crop: using CENTER (fallback)')
            resolve('center')
          })
          .on('error', (err) => {
            console.warn('Cropdetect error, using center:', err.message)
            resolve('center')
          })
          .run()
      })
    })
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
