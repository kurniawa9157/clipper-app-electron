import { FaPlay, FaDownload, FaStar, FaClock } from 'react-icons/fa'

interface ClipPreviewProps {
  clips: Array<{
    startTime: number
    endTime: number
    score: number
    reason: string
    suggestedTitle: string
    viralHook: string
    thumbnailPath?: string
    outputPath?: string
  }>
  onGenerateClip: (clip: any, index: number) => Promise<void>
}

export function ClipPreview({ clips, onGenerateClip }: ClipPreviewProps) {
  if (clips.length === 0) {
    return null
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="card-glass p-6 mt-6">
      <h2 className="text-2xl font-bold mb-4 gradient-text">
        🎬 Generated Clips ({clips.length})
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clips.map((clip, index) => (
          <div key={index} className="card-glass p-4 hover:bg-white/10 transition-colors">
            {/* Thumbnail */}
            <div className="relative bg-gray-800 rounded-lg overflow-hidden mb-3 aspect-video">
              {clip.thumbnailPath ? (
                <img 
                  src={clip.thumbnailPath} 
                  alt={clip.suggestedTitle}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error('Failed to load thumbnail:', clip.thumbnailPath)
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  <FaPlay size={32} />
                </div>
              )}
              
              {/* Score Badge */}
              <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded flex items-center gap-1">
                <FaStar className="text-yellow-400" size={12} />
                <span className="text-xs font-bold">{clip.score}</span>
              </div>
              
              {/* Duration */}
              <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs">
                {formatTime(clip.endTime - clip.startTime)}
              </div>
            </div>
            
            {/* Title & Hook */}
            <h3 className="font-bold text-sm mb-1 line-clamp-2">
              {clip.suggestedTitle}
            </h3>
            <p className="text-xs text-cyan-400 mb-2 line-clamp-1">
              💬 {clip.viralHook}
            </p>
            
            {/* Reason */}
            <p className="text-xs text-gray-400 mb-3 line-clamp-2">
              {clip.reason}
            </p>
            
            {/* Time Range */}
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
              <FaClock size={10} />
              <span>{formatTime(clip.startTime)} - {formatTime(clip.endTime)}</span>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              {clip.outputPath ? (
                <button className="btn-secondary text-xs flex-1 py-2">
                  <FaDownload className="inline mr-1" />
                  Exported
                </button>
              ) : (
                <button 
                  onClick={() => onGenerateClip(clip, index)}
                  className="btn-primary text-xs flex-1 py-2"
                >
                  <FaPlay className="inline mr-1" />
                  Generate
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
