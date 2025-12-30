// YouTube Download Service
// Uses yt-dlp for video downloading

import { exec } from 'child_process'
import { promisify } from 'util'
import * as path from 'path'
import * as fs from 'fs'

const execAsync = promisify(exec)

export interface VideoInfo {
  id: string
  title: string
  duration: number
  thumbnail: string
  channel: string
}

export class YouTubeService {
  private ytDlpPath: string
  private outputDir: string

  constructor() {
    // Use bundled binary from resources folder
    const isDev = process.env.NODE_ENV === 'development'
    const resourcesPath = isDev 
      ? path.join(process.cwd(), 'resources')
      : path.join(process.resourcesPath)
    
    this.ytDlpPath = path.join(resourcesPath, 'binaries', 'yt-dlp.exe')
    this.outputDir = path.join(process.cwd(), 'downloads')
    
    // Create downloads directory if not exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true })
    }
  }

  /**
   * Get video information without downloading
   */
  async getVideoInfo(url: string): Promise<VideoInfo> {
    try {
      const command = `"${this.ytDlpPath}" --dump-json "${url}"`
      const { stdout } = await execAsync(command)
      const data = JSON.parse(stdout)

      return {
        id: data.id,
        title: data.title,
        duration: data.duration,
        thumbnail: data.thumbnail,
        channel: data.uploader
      }
    } catch (error) {
      throw new Error(`Failed to get video info: ${error}`)
    }
  }

  /**
   * Download video from YouTube
   */
  async downloadVideo(
    url: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const outputPath = path.join(this.outputDir, '%(id)s.%(ext)s')
      const command = `"${this.ytDlpPath}" -f "best[ext=mp4]" -o "${outputPath}" "${url}"`

      const process = exec(command)

      process.stdout?.on('data', (data) => {
        // Parse progress from yt-dlp output
        const match = data.match(/(\d+\.\d+)%/)
        if (match && onProgress) {
          onProgress(parseFloat(match[1]))
        }
      })

      process.on('exit', (code) => {
        if (code === 0) {
          // Find the downloaded file
          const files = fs.readdirSync(this.outputDir)
          const videoFile = files.find((f) => f.endsWith('.mp4'))
          if (videoFile) {
            resolve(path.join(this.outputDir, videoFile))
          } else {
            reject(new Error('Video file not found after download'))
          }
        } else {
          reject(new Error(`Download failed with code ${code}`))
        }
      })

      process.on('error', (error) => {
        reject(error)
      })
    })
  }

  /**
   * Download thumbnail
   */
  async downloadThumbnail(url: string): Promise<string> {
    try {
      const info = await this.getVideoInfo(url)
      const thumbnailPath = path.join(this.outputDir, `${info.id}_thumb.jpg`)

      // Download thumbnail using curl or wget
      await execAsync(`curl -o "${thumbnailPath}" "${info.thumbnail}"`)

      return thumbnailPath
    } catch (error) {
      throw new Error(`Failed to download thumbnail: ${error}`)
    }
  }

  /**
   * Extract audio from video for transcription
   */
  async extractAudio(videoPath: string): Promise<string> {
    const audioPath = videoPath.replace(/\.\w+$/, '.mp3')
    const command = `"${this.ytDlpPath.replace('yt-dlp.exe', 'ffmpeg.exe')}" -i "${videoPath}" -vn -acodec mp3 "${audioPath}"`

    try {
      await execAsync(command)
      return audioPath
    } catch (error) {
      throw new Error(`Failed to extract audio: ${error}`)
    }
  }
}
