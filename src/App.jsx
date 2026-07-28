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
  const { user } = useAuth()
  // start | quiz | safety | result | history | auth | diary | board
  const [screen, setScreen] = useState('start')
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])

  // 로그인 상태가 바뀌면 기록을 다시 불러옴 (로그인=DB, 게스트=로컬)
  useEffect(() => {
    let cancelled = false
    async function load() {
      if (user) {
        const h = await fetchRemoteHistory(user.id)
        if (!cancelled) setHistory(h)
      } else {
        setHistory(loadLocalHistory())
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
      setHistory(await fetchRemoteHistory(user.id))
    } else {
      setHistory(saveLocalResult(res.winner.id))
    }
    // 위험 신호가 감지되면 안전 안내 화면 우선 노출
    setScreen(res.risk ? 'safety' : 'result')
  }

  async function goHistory() {
    if (user) setHistory(await fetchRemoteHistory(user.id))
    else setHistory(loadLocalHistory())
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
