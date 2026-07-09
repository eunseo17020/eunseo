import { useState } from 'react'
import StartScreen from './components/StartScreen.jsx'
import QuizScreen from './components/QuizScreen.jsx'
import ResultScreen from './components/ResultScreen.jsx'
import SafetyScreen from './components/SafetyScreen.jsx'
import HistoryScreen from './components/HistoryScreen.jsx'
import { loadHistory, saveResult, clearHistory } from './lib/storage.js'

export default function App() {
  const [screen, setScreen] = useState('start') // start | quiz | safety | result | history
  const [result, setResult] = useState(null) // { winner, risk, ... }
  const [history, setHistory] = useState(() => loadHistory())

  function startQuiz() {
    setResult(null)
    setScreen('quiz')
  }

  function handleComplete(res) {
    setResult(res)
    // 결과는 항상 기록에 저장
    const updated = saveResult(res.winner.id)
    setHistory(updated)
    // 위험 신호가 감지되면 안전 안내 화면 우선 노출
    setScreen(res.risk ? 'safety' : 'result')
  }

  function goHistory() {
    setHistory(loadHistory())
    setScreen('history')
  }

  function handleClearHistory() {
    clearHistory()
    setHistory([])
  }

  return (
    <div className="min-h-full bg-flow">
      <div className="mx-auto max-w-lg min-h-screen bg-white/30 backdrop-blur-sm">
        {screen === 'start' && (
          <StartScreen
            onStart={startQuiz}
            onHistory={goHistory}
            hasHistory={history.length > 0}
          />
        )}

        {screen === 'quiz' && (
          <QuizScreen onComplete={handleComplete} onExit={() => setScreen('start')} />
        )}

        {screen === 'safety' && (
          <SafetyScreen
            onContinue={() => setScreen('result')}
            onHome={() => setScreen('start')}
          />
        )}

        {screen === 'result' && result && (
          <ResultScreen
            emotion={result.winner}
            onRestart={startQuiz}
            onHome={() => setScreen('start')}
            onHistory={goHistory}
          />
        )}

        {screen === 'history' && (
          <HistoryScreen
            history={history}
            onHome={() => setScreen('start')}
            onClear={handleClearHistory}
          />
        )}
      </div>
    </div>
  )
}
