import { useState } from 'react'
import { FaSave, FaKey, FaFolder, FaCog, FaTimes } from 'react-icons/fa'
import { useSettingsStore } from '../store/settingsStore'

interface SettingsPageProps {
  onClose: () => void
}

export function SettingsPage({ onClose }: SettingsPageProps) {
  const { settings, updateSettings } = useSettingsStore()
  const [apiKey, setApiKey] = useState(settings.geminiApiKey)
  const [openaiKey, setOpenaiKey] = useState(settings.openaiApiKey)
  const [outputDir, setOutputDir] = useState(settings.outputDirectory)
  const [defaultGenre, setDefaultGenre] = useState(settings.defaultGenre)
  const [defaultDuration, setDefaultDuration] = useState(settings.defaultClipDuration)
  const [defaultCount, setDefaultCount] = useState(settings.defaultClipCount)
  const [cropPosition, setCropPosition] = useState(settings.cropPosition)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSave = () => {
    updateSettings({
      geminiApiKey: apiKey,
      openaiApiKey: openaiKey,
      outputDirectory: outputDir,
      defaultGenre,
      defaultClipDuration: defaultDuration,
      defaultClipCount: defaultCount,
      cropPosition
    })
    
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  const handleSelectFolder = async () => {
    const folder = await window.api.dialog.selectFolder()
    if (folder) {
      setOutputDir(folder)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="card-glass p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-thin">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FaCog className="text-3xl gradient-text" />
            <h2 className="text-2xl font-bold">Settings</h2>
          </div>
          <button 
            onClick={onClose}
            className="btn-secondary p-2"
          >
            <FaTimes />
          </button>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <p className="text-green-400">✅ Settings saved successfully!</p>
          </div>
        )}

        {/* API Key Section */}
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <FaKey className="text-cyan-400" />
            Google Gemini API Key
          </h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              API Key *
            </label>
            <input
              type="password"
              className="input-field font-mono text-sm"
              placeholder="AIza..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-2">
              Get your free API key from{' '}
              <a 
                href="https://makersuite.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-cyan-400 hover:underline"
              >
                Google AI Studio
              </a>
            </p>
          </div>

          <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
            <h4 className="text-sm font-bold mb-2">ℹ️ Why do I need this?</h4>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• AI analysis requires Google Gemini API</li>
              <li>• Free tier includes 60 requests/minute</li>
              <li>• Your key is stored securely on your device</li>
              <li>• Never shared or uploaded anywhere</li>
            </ul>
          </div>
        </div>

        {/* Output Directory */}
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <FaFolder className="text-purple-400" />
            Output Settings
          </h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Output Directory
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                className="input-field flex-1"
                placeholder="Default: Downloads folder"
                value={outputDir}
                onChange={(e) => setOutputDir(e.target.value)}
              />
              <button 
                onClick={handleSelectFolder}
                className="btn-secondary px-4"
              >
                Browse
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Leave empty to use default downloads folder
            </p>
          </div>
        </div>

        {/* Crop Position */}
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-4">🎯 Smart Crop</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Crop Position
            </label>
            <select
              className="input-field bg-gray-800 text-white"
              value={cropPosition}
              onChange={(e) => setCropPosition(e.target.value as any)}
            >
              <option value="auto">🤖 Smart Auto-Detect (Recommended)</option>
              <option value="center">📍 Center (Manual)</option>
              <option value="left">👈 Left (Manual)</option>
              <option value="right">👉 Right (Manual)</option>
            </select>
          </div>

          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <h4 className="text-sm font-bold mb-2">ℹ️ How it works</h4>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• <strong>Auto:</strong> AI detects where the action is (face, movement)</li>
              <li>• <strong>Center:</strong> Always crop center of video</li>
              <li>• <strong>Left/Right:</strong> Manual position if speaker is on side</li>
            </ul>
          </div>
        </div>

        {/* Default Values */}
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-4">Default Values</h3>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Default Genre */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Default Genre
              </label>
              <select
                className="input-field"
                value={defaultGenre}
                onChange={(e) => setDefaultGenre(e.target.value)}
              >
                <option value="auto">Auto</option>
                <option value="gaming">Gaming</option>
                <option value="podcast">Podcast</option>
                <option value="education">Education</option>
                <option value="funny">Funny</option>
                <option value="motivational">Motivational</option>
              </select>
            </div>

            {/* Default Duration */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Default Duration
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="30"
                  max="120"
                  className="input-field"
                  value={defaultDuration}
                  onChange={(e) => setDefaultDuration(Number(e.target.value))}
                />
                <span className="text-sm text-gray-400">seconds</span>
              </div>
            </div>

            {/* Default Count */}
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">
                Default Clip Count
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="50"
                  className="input-field"
                  value={defaultCount}
                  onChange={(e) => setDefaultCount(Number(e.target.value))}
                />
                <span className="text-sm text-gray-400">clips</span>
              </div>
            </div>
          </div>
        </div>

        {/* OpenAI API Key Section */}
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <FaKey className="text-purple-400" />
            OpenAI API Key (For Auto-Transcription)
          </h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              OpenAI API Key (Optional)
            </label>
            <input
              type="password"
              className="input-field font-mono text-sm"
              placeholder="sk-proj-..."
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-2">
              Get your API key from{' '}
              <a 
                href="https://platform.openai.com/api-keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-purple-400 hover:underline"
              >
                OpenAI Platform
              </a>
            </p>
          </div>

          <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <h4 className="text-sm font-bold mb-2">ℹ️ Auto-Transcription</h4>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Optional: Only needed for auto-transcription</li>
              <li>• Without: You manually paste transcript</li>
              <li>• With: Automatic Whisper AI transcription</li>
              <li>• Cost: ~$0.006 per minute of audio</li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button 
            onClick={handleSave}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <FaSave />
            Save Settings
          </button>
          <button 
            onClick={onClose}
            className="btn-secondary px-6"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
