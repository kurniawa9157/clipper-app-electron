interface ProcessingQueueProps {
  status: {
    stage: 'idle' | 'downloading' | 'analyzing' | 'generating' | 'complete' | 'error'
    progress: number
    message: string
    error?: string
  }
}

export function ProcessingQueue({ status }: ProcessingQueueProps) {
  if (status.stage === 'idle') {
    return null
  }

  const getStageEmoji = (stage: string) => {
    switch (stage) {
      case 'downloading': return '📥'
      case 'analyzing': return '🤖'
      case 'generating': return '🎬'
      case 'complete': return '✅'
      case 'error': return '❌'
      default: return '⏳'
    }
  }

  const getProgressColor = (stage: string) => {
    switch (stage) {
      case 'error': return 'bg-red-500'
      case 'complete': return 'bg-green-500'
      default: return 'bg-gradient-primary'
    }
  }

  return (
    <div className="card-glass p-6 mt-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{getStageEmoji(status.stage)}</span>
        <div className="flex-1">
          <h3 className="font-bold text-lg capitalize">{status.stage}</h3>
          <p className="text-sm text-gray-400">{status.message}</p>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getProgressColor(status.stage)} transition-all duration-300`}
          style={{ width: `${status.progress}%` }}
        />
      </div>
      
      <div className="text-right text-sm text-gray-400 mt-2">
        {Math.round(status.progress)}%
      </div>
      
      {status.error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{status.error}</p>
        </div>
      )}
    </div>
  )
}
