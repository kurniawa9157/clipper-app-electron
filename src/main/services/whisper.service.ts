// Whisper Transcription Service
// Uses OpenAI Whisper API for audio transcription

import axios from 'axios'
import * as fs from 'fs'
import FormData from 'form-data'

export class WhisperService {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  /**
   * Transcribe audio file using Whisper API
   */
  async transcribe(audioPath: string): Promise<string> {
    try {
      // Check if file exists
      if (!fs.existsSync(audioPath)) {
        throw new Error(`Audio file not found: ${audioPath}`)
      }

      const formData = new FormData()
      formData.append('file', fs.createReadStream(audioPath))
      formData.append('model', 'whisper-1')
      formData.append('response_format', 'text')

      const response = await axios.post(
        'https://api.openai.com/v1/audio/transcriptions',
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'Authorization': `Bearer ${this.apiKey}`
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity
        }
      )

      return response.data
    } catch (error: any) {
      if (error.response) {
        throw new Error(`Whisper API error: ${error.response.data.error?.message || error.message}`)
      }
      throw new Error(`Transcription failed: ${error.message}`)
    }
  }

  /**
   * Transcribe with timestamps (for subtitle generation)
   */
  async transcribeWithTimestamps(audioPath: string): Promise<any> {
    try {
      if (!fs.existsSync(audioPath)) {
        throw new Error(`Audio file not found: ${audioPath}`)
      }

      const formData = new FormData()
      formData.append('file', fs.createReadStream(audioPath))
      formData.append('model', 'whisper-1')
      formData.append('response_format', 'verbose_json')
      formData.append('timestamp_granularities[]', 'word')

      const response = await axios.post(
        'https://api.openai.com/v1/audio/transcriptions',
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'Authorization': `Bearer ${this.apiKey}`
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity
        }
      )

      return response.data
    } catch (error: any) {
      if (error.response) {
        throw new Error(`Whisper API error: ${error.response.data.error?.message || error.message}`)
      }
      throw new Error(`Transcription failed: ${error.message}`)
    }
  }
}
