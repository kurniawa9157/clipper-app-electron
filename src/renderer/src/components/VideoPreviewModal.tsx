import { useState, useRef, useEffect } from 'react'
import { FaPlay, FaPause, FaCheck, FaTimes, FaVolumeMute, FaVolumeUp } from 'react-icons/fa'

interface VideoPreviewModalProps {
  videoPath: string
  clipTitle: string
  onKeep: () => void
  onDelete: () => void
  onClose: () => void
}

export function VideoPreviewModal({ videoPath, clipTitle, onKeep, onDelete, onClose }: VideoPreviewModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => setCurrentTime(video.currentTime)
    const handleLoadedMetadata = () => setDuration(video.duration)
    const handleEnded = () => setIsPlaying(false)

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('ended', handleEnded)
    }
  }, [])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play()
    }
    setIsPlaying(!isPlaying)
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    
    video.muted = !video.muted
    setIsMuted(!video.muted)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    if (!video) return
    
    const time = parseFloat(e.target.value)
    video.currentTime = time
    setCurrentTime(time)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleKeep = () => {
    onKeep()
    onClose()
  }

  const handleDelete = () => {
    onDelete()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="card-glass p-6 max-w-4xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold gradient-text">🎬 Preview Clip</h3>
          <button onClick={onClose} className="btn-secondary p-2">
            <FaTimes />
          </button>
        </div>

        <p className="text-sm text-gray-400 mb-4">{clipTitle}</p>

        {/* Video Player */}
        <div className="relative bg-black rounded-lg overflow-hidden mb-4">
          <video
            ref={videoRef}
            src={videoPath}
            className="w-full aspect-[9/16] max-h-[60vh] mx-auto object-contain"
            onClick={togglePlay}
          />
          
          {/* Play overlay */}
          {!isPlaying && (
            <div 
              className="absolute inset-0 flex items-center justify-center cursor-pointer"
              onClick={togglePlay}
            >
              <div className="bg-black/50 rounded-full p-6">
                <FaPlay size={48} className="text-white" />
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="mb-6">
          {/* Timeline */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs text-gray-400 w-12">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1"
            />
            <span className="text-xs text-gray-400 w-12">{formatTime(duration)}</span>
          </div>

          {/* Play/Pause & Mute */}
          <div className="flex items-center gap-3">
            <button 
              onClick={togglePlay}
              className="btn-secondary px-4 py-2 flex items-center gap-2"
            >
              {isPlaying ? <FaPause /> : <FaPlay />}
              {isPlaying ? 'Pause' : 'Play'}
            </button>

            <button 
              onClick={toggleMute}
              className="btn-secondary p-2"
            >
              {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button 
            onClick={handleKeep}
            className="btn-primary flex-1 flex items-center justify-center gap-2 py-3"
          >
            <FaCheck />
            ✅ SIMPAN (Bagus!)
          </button>
          
          <button 
            onClick={handleDelete}
            className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-colors"
          >
            <FaTimes />
            ❌ HAPUS (Tidak Oke)
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-3">
          Preview dulu sebelum save - pastikan kualitas sudah bagus!
        </p>
      </div>
    </div>
  )
}
