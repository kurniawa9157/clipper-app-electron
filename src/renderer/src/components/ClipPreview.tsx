import { FaPlay, FaEye, FaCheck } from 'react-icons/fa'
import { useState } from 'react'
import { VideoPreviewModal } from './VideoPreviewModal'

interface ClipData {
  startTime: number
  endTime: number
  score: number
  reason: string
  suggestedTitle: string
  viralHook: string
  thumbnailPath?: string
  outputPath?: string
  previewPath?: string
  isKept?: boolean
}

interface ClipPreviewProps {
  clips: ClipData[]
  onGenerateClip: (clip: ClipData, index: number) => Promise<void>
  onKeepClip?: (clip: ClipData, index: number) => Promise<void>
  onDeleteClip?: (clip: ClipData, index: number) => Promise<void>
}

export function ClipPreview({ clips, onGenerateClip, onKeepClip, onDeleteClip }: ClipPreviewProps) {
  const [previewClip, setPreviewClip] = useState<{ clip: ClipData; index: number } | null>(null)
  const [generating, setGenerating] = useState<number | null>(null)

  if (clips.length === 0) {
    return null
  }

  const handleGenerate = async (clip: ClipData, index: number) => {
    try {
      setGenerating(index)
      await onGenerateClip(clip, index)
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setGenerating(null)
    }
  }

  const handleKeep = async () => {
    if (!previewClip || !onKeepClip) return
    try {
      await onKeepClip(previewClip.clip, previewClip.index)
      alert('✅ Clip saved successfully!')
    } catch (error: any) {
      alert(`Error saving: ${error.message}`)
    }
  }

  const handleDelete = async () => {
    if (!previewClip || !onDeleteClip) return
    try {
      await onDeleteClip(previewClip.clip, previewClip.index)
    } catch (error: any) {
      console.error('Delete error:', error)
    }
  }

  return (
    <div className="mt-8">
      <div className="card-glass p-6">
        <h2 className="text-2xl font-bold mb-4 gradient-text">
          🎬 Viral Clips ({clips.length})
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clips.map((clip, index) => (
            <div key={index} className="card-glass p-4">
              {/* Thumbnail */}
              {clip.thumbnailPath && (
                <div className="relative mb-3 rounded-lg overflow-hidden bg-gray-800 aspect-[9/16]">
                  <img 
                    src={clip.thumbnailPath}
                    alt={`Clip ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Thumbnail load error:', clip.thumbnailPath)
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              )}
              
              {/* Info */}
              <div className="mb-3">
                <h3 className="font-bold text-sm mb-1">{clip.suggestedTitle}</h3>
                <p className="text-xs text-cyan-400 mb-2">🔥 {clip.viralHook}</p>
                <p className="text-xs text-gray-400 mb-2">{clip.reason}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{Math.floor(clip.startTime)}s - {Math.floor(clip.endTime)}s</span>
                  <span className="text-yellow-400">⭐ {clip.score}/100</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {/* Generate Preview Button */}
                {!clip.previewPath && !clip.isKept && (
                  <button
                    onClick={() => handleGenerate(clip, index)}
                    disabled={generating === index}
                    className={`btn-primary flex-1 text-sm py-2 flex items-center justify-center gap-2 ${
                      generating === index ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <FaPlay size={12} />
                    {generating === index ? 'Generating...' : 'Generate Preview'}
                  </button>
                )}

                {/* View Preview Button (when preview exists) */}
                {clip.previewPath && !clip.isKept && (
                  <button
                    onClick={() => setPreviewClip({ clip, index })}
                    className="btn-secondary flex-1 text-sm py-2 flex items-center justify-center gap-2"
                  >
                    <FaEye size={12} />
                    👁️ Preview & Decide
                  </button>
                )}

                {/* Kept Status */}
                {clip.isKept && clip.outputPath && (
                  <div className="flex-1 bg-green-500/20 border border-green-500/50 text-green-400 text-sm py-2 rounded-lg flex items-center justify-center gap-2">
                    <FaCheck size={12} />
                    ✅ Saved
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preview Modal */}
      {previewClip && previewClip.clip.previewPath && (
        <VideoPreviewModal
          videoPath={previewClip.clip.previewPath}
          clipTitle={previewClip.clip.suggestedTitle}
          onKeep={handleKeep}
          onDelete={handleDelete}
          onClose={() => setPreviewClip(null)}
        />
      )}
    </div>
  )
}
