import { useMemo } from 'react'
import { DAILY_QUOTES } from '../data/emotions.js'
import { randomQuote } from '../lib/quiz.js'

export default function StartScreen({ onStart, onHistory, hasHistory }) {
  const quote = useMemo(() => randomQuote(DAILY_QUOTES), [])

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 py-12 text-center">
      <div className="anim-float">
        <div className="text-7xl mb-4 anim-bob">🧭</div>
        <h1 className="text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-purple-500">
          FeelMe
        </h1>
        <p className="mt-3 text-slate-500 text-base leading-relaxed">
          지금 내 마음에 가장 가까운 감정을
          <br />
          함께 찾아볼까요?
        </p>
      </div>

      {/* 오늘의 한마디 */}
      <div className="anim-float mt-8 w-full max-w-sm rounded-2xl bg-white/70 backdrop-blur border border-white shadow-sm px-5 py-4">
        <p className="text-xs font-bold text-indigo-400 mb-1">오늘의 한마디</p>
        <p className="font-hand text-xl text-slate-700 leading-snug">“{quote}”</p>
      </div>

      <div className="anim-float mt-10 w-full max-w-sm space-y-3">
        <button
          onClick={onStart}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-lg font-bold shadow-lg shadow-indigo-200 active:scale-95 transition-transform"
        >
          감정 알아보기 시작 ✨
        </button>
        {hasHistory && (
          <button
            onClick={onHistory}
            className="w-full py-3.5 rounded-2xl bg-white/80 text-slate-600 font-bold border border-slate-200 active:scale-95 transition-transform"
          >
            📊 내 감정 기록 보기
          </button>
        )}
      </div>

      <p className="mt-8 text-xs text-slate-400 leading-relaxed max-w-xs">
        15개의 질문에 4단계로 답하면
        <br />
        30가지 감정 중 지금의 마음을 찾아드려요.
      </p>
    </div>
  )
}
