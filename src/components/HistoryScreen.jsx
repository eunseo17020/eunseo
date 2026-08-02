import { useMemo } from 'react'
import { EMOTION_BY_ID } from '../data/emotions.js'

export default function HistoryScreen({ history, onHome, onClear, hasError = false, onRetry }) {
  // 감정별 집계
  const stats = useMemo(() => {
    const counts = {}
    history.forEach((h) => {
      counts[h.emotionId] = (counts[h.emotionId] || 0) + 1
    })
    const total = history.length || 1
    return Object.entries(counts)
      .map(([id, count]) => ({
        emotion: EMOTION_BY_ID[id],
        count,
        percent: Math.round((count / total) * 100),
      }))
      .filter((s) => s.emotion)
      .sort((a, b) => b.count - a.count)
  }, [history])

  const recent = useMemo(() => [...history].reverse().slice(0, 12), [history])
  const maxCount = stats.length ? stats[0].count : 1

  return (
    <div className="flex flex-col min-h-full px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-700">📊 내 감정 기록</h1>
        <button
          onClick={onHome}
          className="text-slate-400 text-sm font-bold active:scale-90 transition"
        >
          닫기 ✕
        </button>
      </div>

      {hasError ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400">
          <div className="text-5xl mb-3">📡</div>
          <p className="mb-4">
            기록을 불러오지 못했어요.
            <br />
            인터넷 연결을 확인해 주세요.
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-5 py-2.5 rounded-xl bg-white/80 border border-slate-200 text-slate-600 font-bold active:scale-95 transition"
            >
              다시 시도
            </button>
          )}
        </div>
      ) : history.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400">
          <div className="text-5xl mb-3">🌱</div>
          <p>아직 기록이 없어요.
            <br />감정을 알아보면 여기에 쌓여요.</p>
        </div>
      ) : (
        <>
          {/* 감정 그래프 */}
          <div className="anim-float mt-6 rounded-2xl bg-white/80 border border-white shadow-sm p-5">
            <p className="text-xs font-bold text-indigo-400 mb-4">
              지금까지 {history.length}번의 마음
            </p>
            <div className="space-y-3">
              {stats.slice(0, 8).map(({ emotion, count, percent }) => (
                <div key={emotion.id} className="flex items-center gap-3">
                  <span className="text-xl w-6 text-center shrink-0">{emotion.emoji}</span>
                  <span className="text-sm font-bold text-slate-600 w-16 shrink-0 truncate">
                    {emotion.name}
                  </span>
                  <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(8, (count / maxCount) * 100)}%`,
                        backgroundColor: emotion.color,
                      }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-400 w-8 text-right tabular-nums">
                    {percent}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 최근 기록 */}
          <div className="anim-float mt-4 rounded-2xl bg-white/80 border border-white shadow-sm p-5">
            <p className="text-xs font-bold text-indigo-400 mb-3">최근 기록</p>
            <div className="flex flex-wrap gap-2">
              {recent.map((h, i) => {
                const e = EMOTION_BY_ID[h.emotionId]
                if (!e) return null
                const d = new Date(h.date)
                return (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm"
                    style={{ backgroundColor: `${e.color}1f`, color: e.color }}
                  >
                    <span>{e.emoji}</span>
                    <span className="font-bold">{e.name}</span>
                    <span className="text-[10px] opacity-70">
                      {d.getMonth() + 1}/{d.getDate()}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <button
            onClick={onClear}
            className="mt-6 mx-auto text-xs text-slate-400 font-bold underline active:scale-95 transition"
          >
            기록 모두 지우기
          </button>
        </>
      )}

      <div className="mt-auto pt-8">
        <button
          onClick={onHome}
          className="w-full max-w-md mx-auto block py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-lg font-bold shadow-lg shadow-indigo-200 active:scale-95 transition-transform"
        >
          처음으로 🏠
        </button>
      </div>
    </div>
  )
}
