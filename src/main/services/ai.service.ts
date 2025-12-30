// AI Service using Google Gemini API
// Analyzes transcripts and scores clip moments

import { GoogleGenerativeAI } from '@google/generative-ai'

export interface ClipSegment {
  startTime: number
  endTime: number
  score: number
  reason: string
  suggestedTitle: string
  viralHook: string
}

export interface AnalysisOptions {
  genre: string
  clipDuration: number
  clipCount: number
  customPrompt?: string
  apiKey?: string  // Optional for type compatibility
}

export class AIService {
  private genAI: GoogleGenerativeAI
  private model: any

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey)
    // Use gemini-1.5-flash-latest for free tier (gemini-pro is deprecated)
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
  }

  /**
   * Analyze video transcript and find viral moments
   */
  async analyzeTranscript(
    transcript: string,
    options: AnalysisOptions
  ): Promise<ClipSegment[]> {
    const prompt = this.buildPrompt(transcript, options)

    try {
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      // Log response for debugging
      console.log('AI Response:', text)

      // Try to parse JSON response
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        try {
          const rawSegments = JSON.parse(jsonMatch[0])
          console.log('Parsed segments:', rawSegments)
          
          // Map and validate segments - AI might return snake_case or camelCase
          const validSegments = rawSegments
            .map((seg: any, index: number) => {
              // Handle both snake_case and camelCase field names
              const startTime = seg.startTime ?? seg.start_time
              const endTime = seg.endTime ?? seg.end_time
              const score = seg.score
              const reason = seg.reason
              const suggestedTitle = seg.suggestedTitle ?? seg.suggested_title
              const viralHook = seg.viralHook ?? seg.viral_hook
              
              // Convert to numbers if strings
              const start = typeof startTime === 'string' ? parseFloat(startTime) : startTime
              const end = typeof endTime === 'string' ? parseFloat(endTime) : endTime
              
              // Validate
              if (typeof start !== 'number' || typeof end !== 'number' || isNaN(start) || isNaN(end)) {
                console.warn(`Segment ${index} has invalid timestamps:`, seg)
                return null
              }
              
              return {
                startTime: start,
                endTime: end,
                score: score || 0,
                reason: reason || '',
                suggestedTitle: suggestedTitle || `Clip ${index + 1}`,
                viralHook: viralHook || 'Watch this!'
              }
            })
            .filter((seg: any) => seg !== null)
            .slice(0, options.clipCount)
          
          if (validSegments.length === 0) {
            console.error('All segments failed validation. Raw data:', rawSegments)
            throw new Error('No valid segments found in AI response')
          }
          
          console.log('Valid segments:', validSegments)
          return validSegments
        } catch (parseError) {
          console.error('JSON Parse Error:', parseError)
          throw new Error(`Failed to parse AI response: ${parseError}`)
        }
      }

      throw new Error('No JSON array found in AI response')
    } catch (error) {
      throw new Error(`AI analysis failed: ${error}`)
    }
  }

  /**
   * Build AI prompt based on genre and options
   */
  private buildPrompt(transcript: string, options: AnalysisOptions): string {
    const genrePrompts: Record<string, string> = {
      gaming: `Find moments with:
- Epic kills or plays
- Funny reactions or rage moments  
- Clutch situations
- Unexpected wins
Score based on excitement level and viral potential.`,
      
      podcast: `Find moments with:
- Controversial or hot takes
- Emotional storytelling moments
- Surprising revelations
- Quotable wisdom
Score based on engagement and shareability.`,
      
      education: `Find moments with:
- Key information or insights
- Clear explanations of complex topics
- Memorable examples or demonstrations
- Actionable advice
Score based on educational value and clarity.`,
      
      funny: `Find moments with:
- Comedy or hilarious reactions
- Unexpected funny situations
- Witty remarks or jokes
- Physical comedy or fails
Score based on humor and entertainment value.`,
      
      motivational: `Find moments with:
- Inspiring quotes or messages
- Success stories or transformations
- Emotional powerful moments
- Call-to-action or challenges
Score based on inspirational impact.`,
      
      auto: `Analyze the content and find the most engaging moments that are likely to go viral.
Consider emotional peaks, surprising elements, valuable insights, or entertaining content.`
    }

    const genreInstruction = genrePrompts[options.genre] || genrePrompts.auto

    return `Analyze this video transcript and find the top ${options.clipCount} DIFFERENT moments for creating ${options.clipDuration}-second viral clips.

CRITICAL REQUIREMENTS:
1. Each clip MUST have DIFFERENT start_time and end_time
2. Clips should NOT overlap with each other
3. Each clip should be EXACTLY ${options.clipDuration} seconds long
4. Find the BEST ${options.clipCount} UNIQUE moments throughout the video

TRANSCRIPT:
${transcript}

CONTENT TYPE: ${options.genre.toUpperCase()}

ANALYSIS CRITERIA:
${genreInstruction}

${options.customPrompt ? `\nSPECIAL FOCUS:\n${options.customPrompt}` : ''}

IMPORTANT: Generate all titles and hooks in INDONESIAN language (Bahasa Indonesia).

For each moment, provide:
- start_time: timestamp in seconds where the moment begins (MUST BE DIFFERENT for each clip)
- end_time: start_time + ${options.clipDuration} (exactly ${options.clipDuration} seconds duration)
- score: 0-100 rating of viral potential
- reason: brief explanation why this moment is viral-worthy (in Indonesian)
- suggested_title: catchy title for this clip in INDONESIAN (max 50 chars)
- viral_hook: engaging opening text in INDONESIAN to show in first 2 seconds (max 5 words)

EXAMPLE FORMAT (with DIFFERENT timestamps, in Indonesian):
[
  {
    "startTime": 10,
    "endTime": ${10 + options.clipDuration},
    "score": 95,
    "reason": "Momen gaming epik dengan twist yang tidak terduga",
    "suggestedTitle": "CLUTCH GILA Yang Ga Disangka Siapapun",
    "viralHook": "Tunggu sampai akhir"
  },
  {
    "startTime": 145,
    "endTime": ${145 + options.clipDuration},
    "score": 92,
    "reason": "Reaksi lucu terhadap kejadian in-game",
    "suggestedTitle": "Reaksinya PRICELESS Banget",
    "viralHook": "Ga mungkin dia lakuin ini"
  },
  {
    "startTime": 320,
    "endTime": ${320 + options.clipDuration},
    "score": 88,
    "reason": "Skill bermain yang menunjukkan bakat",
    "suggestedTitle": "Pro Player Hancurkan Tim Musuh",
    "viralHook": "Ini gila sih"
  }
]

IMPORTANT: 
- Return EXACTLY ${options.clipCount} clips
- Each clip MUST start at a DIFFERENT timestamp
- NO overlapping clips
- Return ONLY valid JSON array, no other text
- Ensure all timestamps are numbers, not strings`
  }

  /**
   * Generate viral hooks for clips
   */
  async generateViralHook(clipContent: string): Promise<string> {
    const prompt = `Create a short, attention-grabbing hook (max 5 words) for this video clip content:

${clipContent}

Return only the hook text, nothing else.`

    try {
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      return response.text().trim()
    } catch (error) {
      throw new Error(`Hook generation failed: ${error}`)
    }
  }

  /**
   * Analyze video frames for visual content
   */
  async analyzeFrames(_imageData: string[]): Promise<any> {
    // TODO: Implement with Gemini Vision API
    // This would analyze actual video frames for visual interest
    throw new Error('Frame analysis not yet implemented')
  }
}
