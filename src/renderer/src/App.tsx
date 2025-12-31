import { useState } from 'react'
import { FaYoutube, FaUpload, FaCog, FaPlayCircle, FaCogs } from 'react-icons/fa'
import { useClipperService } from './hooks/useClipperService'
import { ClipPreview } from './components/ClipPreview'
import { ProcessingQueue } from './components/ProcessingQueue'
import { SettingsPage } from './components/SettingsPage'
import { useSettingsStore } from './store/settingsStore'
import './assets/main.css'

function App() {
  const { settings } = useSettingsStore()
  const [showSettings, setShowSettings] = useState(false)
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [transcript, setTranscript] = useState('')
  const [genre, setGenre] = useState(settings.defaultGenre)
  const [customPrompt, setCustomPrompt] = useState('')
  const [clipDuration, setClipDuration] = useState(settings.defaultClipDuration)
  const [clipCount, setClipCount] = useState(settings.defaultClipCount)

  const { status, clips, processVideo, generateClip, keepClip, deleteClip, reset } = useClipperService()

  const handleStartClipping = async () => {
    if (!youtubeUrl) {
      alert('Please enter a YouTube URL')
      return
    }

    // Check for API key
    if (!settings.geminiApiKey) {
      alert('Please set your Gemini API key in Settings first!')
      setShowSettings(true)
      return
    }

    // Reset previous results
    reset()

    // Start processing
    await processVideo(youtubeUrl, {
      genre,
      clipDuration,
      clipCount,
      customPrompt: customPrompt || undefined,
      transcript: transcript || undefined,
      apiKey: settings.geminiApiKey  // Pass API key from settings
    })
  }

  const handleGenerateClip = async (clip: any, index: number) => {
    try {
      await generateClip(clip, index)
    } catch (error: any) {
      alert(`Failed to generate preview: ${error.message}`)
    }
  }

  const handleKeepClip = async (clip: any, index: number) => {
    try {
      await keepClip(clip, index)
    } catch (error: any) {
      alert(`Failed to save clip: ${error.message}`)
    }
  }

  const handleDeleteClip = async (clip: any, index: number) => {
    try {
      await deleteClip(clip, index)
    } catch (error: any) {
      alert(`Failed to delete preview: ${error.message}`)
    }
  }

  const isProcessing = ['downloading', 'analyzing', 'generating'].includes(status.stage)

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1" />
          <h1 className="text-4xl font-bold gradient-text text-center">
            ViralCraft Studio
          </h1>
          <div className="flex-1 flex justify-end">
            <button
              onClick={() => setShowSettings(true)}
              className="btn-secondary px-4 py-2 flex items-center gap-2"
              title="Settings"
            >
              <FaCogs /> Settings
            </button>
          </div>
        </div>
        <p className="text-gray-400 text-center">
          AI-Powered YouTube Clipper - Create Viral Clips Automatically
        </p>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto">
        <div className="card-glass p-8">
          {/* Tab Switcher */}
          <div className="flex gap-4 mb-6">
            <button className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary-500/20 text-primary-300 border border-primary-500/50">
              <FaYoutube /> YouTube Link
            </button>
            <button className="flex items-center gap-2 px-6 py-3 rounded-lg hover:bg-white/5 transition-colors opacity-50 cursor-not-allowed">
              <FaUpload /> Upload File (Coming Soon)
            </button>
          </div>

          {/* URL Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              1. URL Video YouTube
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="https://youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              disabled={isProcessing}
            />
          </div>

          {/* Transcript Input (Optional) */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              2. Transkip Video (Optional)
            </label>
            <div className="text-xs text-gray-400 mb-2">
              [MODE CEPAT] Tempel transkip di sini untuk SKIP proses scanning full video. Jika kosong, AI akan mendengarkan seluruh isi video (lebih lama)
            </div>
            <textarea
              className="input-field h-24 resize-none"
              placeholder="Contoh: Hari ini kami akan membahas tentang pentingnya investasi sejak dini..."
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              disabled={isProcessing}
            />
          </div>

          {/* Genre Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              📍 Pilih Genre Konten (Optional)
            </label>
            <select
              className="input-field bg-gray-800 text-white"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              disabled={isProcessing}
            >
              <option value="auto">Auto (Rekomendasi AI)</option>
              <option value="gaming">Gaming</option>
              <option value="podcast">Podcast</option>
              <option value="education">Education</option>
              <option value="funny">Funny/Comedy</option>
              <option value="motivational">Motivational</option>
            </select>
          </div>

          {/* Custom Prompt */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              🔎 Prioritaskan Momen Spesifik (Optional)
            </label>
            <div className="text-xs text-gray-400 mb-2">
              Contoh: Cari bagian saat pembicara membahas tentang pentingnya investasi sejak dini
            </div>
            <input
              type="text"
              className="input-field"
              placeholder="Misal: cari scene yang menjelaskan cara menghemat uang..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              disabled={isProcessing}
            />
          </div>

          {/* Clip Settings Row */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Clip Duration */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Durasi Klip
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="30"
                  max="120"
                  value={clipDuration}
                  onChange={(e) => setClipDuration(Number(e.target.value))}
                  className="flex-1"
                  disabled={isProcessing}
                />
                <span className="text-sm font-mono bg-white/5 px-3 py-1 rounded">
                  {clipDuration} Detik
                </span>
              </div>
            </div>

            {/* Clip Count */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Jumlah Klip
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={clipCount}
                  onChange={(e) => setClipCount(Number(e.target.value))}
                  className="flex-1"
                  disabled={isProcessing}
                />
                <span className="text-sm font-mono bg-white/5 px-3 py-1 rounded">
                  {clipCount} Klip
                </span>
              </div>
            </div>
          </div>

          {/* Mode Output */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Mode Output
            </label>
            <select className="input-field bg-gray-800 text-white" disabled={isProcessing}>
              <option>Tik Tok / Movie</option>
              <option>Instagram Reels</option>
              <option>YouTube Shorts</option>
            </select>
          </div>

          {/* Studio Settings (Collapsed) */}
          <div className="mb-6">
            <button className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
              <FaCog /> Buka Pengaturan Tampilan & Branding Studio (Coming Soon)
            </button>
          </div>

          {/* Start Button */}
          <button
            onClick={handleStartClipping}
            disabled={isProcessing}
            className={`btn-primary w-full text-lg flex items-center justify-center gap-3 ${
              isProcessing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <FaPlayCircle size={24} />
            {isProcessing ? 'PROCESSING...' : 'MULAI NG-CLIP'}
          </button>
        </div>

        {/* Processing Status */}
        <ProcessingQueue status={status} />

        {/* Clip Preview */}
        <ClipPreview 
          clips={clips} 
          onGenerateClip={handleGenerateClip}
          onKeepClip={handleKeepClip}
          onDeleteClip={handleDeleteClip}
        />
      </div>

      {/* Settings Modal */}
      {showSettings && <SettingsPage onClose={() => setShowSettings(false)} />}
    </div>
  )
}

export default App
