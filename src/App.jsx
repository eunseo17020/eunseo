import { useState, useEffect } from 'react'
import StartScreen from './components/StartScreen.jsx'
import QuizScreen from './components/QuizScreen.jsx'
import ResultScreen from './components/ResultScreen.jsx'
import SafetyScreen from './components/SafetyScreen.jsx'
import HistoryScreen from './components/HistoryScreen.jsx'
import AuthScreen from './components/AuthScreen.jsx'
import DiaryScreen from './components/DiaryScreen.jsx'
import BoardScreen from './components/BoardScreen.jsx'
import { useAuth } from './lib/AuthContext.jsx'
import {
  loadLocalHistory,
  saveLocalResult,
  clearLocalHistory,
  fetchRemoteHistory,
  insertRemoteResult,
  clearRemoteHistory,
} from './lib/storage.js'

export default function App() {
  const { user, loading: authLoading } = useAuth()
  // start | quiz | safety | result | history | auth | diary | board
  const [screen, setScreen] = useState('start')
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [historyError, setHistoryError] = useState(false)

  // 로그인 상태가 바뀌면 기록을 다시 불러옴 (로그인=DB, 게스트=로컬)
  useEffect(() => {
    let cancelled = false
    async function load() {
      if (user) {
        const { data, error } = await fetchRemoteHistory(user.id)
        if (cancelled) return
        setHistory(data)
        setHistoryError(Boolean(error))
      } else {
        setHistory(loadLocalHistory())
        setHistoryError(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [user])

  function startQuiz() {
    setResult(null)
    setScreen('quiz')
  }

  async function handleComplete(res) {
    setResult(res)
    if (user) {
      await insertRemoteResult(user.id, res.winner.id)
      const { data, error } = await fetchRemoteHistory(user.id)
      setHistory(data)
      setHistoryError(Boolean(error))
    } else {
      setHistory(saveLocalResult(res.winner.id))
    }
    // 위험 신호가 감지되면 안전 안내 화면 우선 노출
    setScreen(res.risk ? 'safety' : 'result')
  }

  async function goHistory() {
    if (user) {
      const { data, error } = await fetchRemoteHistory(user.id)
      setHistory(data)
      setHistoryError(Boolean(error))
    } else {
      setHistory(loadLocalHistory())
      setHistoryError(false)
    }
    setScreen('history')
  }

  async function handleClearHistory() {
    if (user) {
      await clearRemoteHistory(user.id)
    } else {
      clearLocalHistory()
    }
    setHistory([])
  }

  const latestEmotion = result?.winner ?? null

  // 로그인 상태를 확인하는 동안 잠깐 스플래시 (로그인 버튼이 깜빡이는 것 방지)
  if (authLoading) {
    return (
      <div className="min-h-full bg-flow">
        <div className="mx-auto max-w-lg min-h-screen bg-white/30 backdrop-blur-sm flex flex-col items-center justify-center">
          <div className="text-6xl anim-bob">🧭</div>
          <p className="mt-4 text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-purple-500">
            moodi
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-flow">
      <div className="mx-auto max-w-lg min-h-screen bg-white/30 backdrop-blur-sm">
        {screen === 'start' && (
          <StartScreen
            onStart={startQuiz}
            onHistory={goHistory}
            onAuth={() => setScreen('auth')}
            onDiary={() => setScreen('diary')}
            onBoard={() => setScreen('board')}
            hasHistory={history.length > 0}
          />
        )}

        {screen === 'auth' && (
          <AuthScreen onDone={() => setScreen('start')} onBack={() => setScreen('start')} />
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
            onDiary={() => setScreen('diary')}
            onBoard={() => setScreen('board')}
          />
        )}

        {screen === 'history' && (
          <HistoryScreen
            history={history}
            hasError={historyError}
            onRetry={goHistory}
            onHome={() => setScreen('start')}
            onClear={handleClearHistory}
          />
        )}

        {screen === 'diary' && (
          <DiaryScreen onHome={() => setScreen('start')} todayEmotion={latestEmotion} />
        )}

        {screen === 'board' && (
          <BoardScreen
            onHome={() => setScreen('start')}
            onAuth={() => setScreen('auth')}
            latestEmotion={latestEmotion}
          />
        )}
      </div>
    </div>
  )
}
