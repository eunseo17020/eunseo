import { useState, useMemo } from 'react'
import { SCALE } from '../lib/quiz.js'
import {
  buildPhase1,
  scorePhase1,
  candidateEmotions,
  buildPhase2,
  scoreFinal,
  detectRisk,
} from '../lib/quiz.js'

const TOTAL = 15
const PHASE1_COUNT = 6

export default function QuizScreen({ onComplete, onExit }) {
  // 1단계 문항은 최초 1회만 생성
  const phase1 = useMemo(() => buildPhase1(), [])

  const [phase, setPhase] = useState(1)
  const [phase2, setPhase2] = useState([])
  const [index, setIndex] = useState(0) // 현재 phase 안에서의 인덱스
  const [answers, setAnswers] = useState([]) // 전체 누적 답변
  const [phase1GroupScore, setPhase1GroupScore] = useState({}) // 1단계 그룹 점수
  const [leaving, setLeaving] = useState(false)

  const questions = phase === 1 ? phase1 : phase2
  const current = questions[index]
  const answeredCount = answers.length
  const progress = Math.round((answeredCount / TOTAL) * 100)

  function handleAnswer(value) {
    const nextAnswers = [...answers, { question: current, value }]
    setAnswers(nextAnswers)

    // 1단계 마지막 문항이면 → 2단계 문항 생성
    if (phase === 1 && index === PHASE1_COUNT - 1) {
      const { groupScore, ranked } = scorePhase1(nextAnswers)
      const candidates = candidateEmotions(ranked)
      const usedTexts = new Set(nextAnswers.map((a) => a.question.text))
      const p2 = buildPhase2(candidates, usedTexts, TOTAL - PHASE1_COUNT)
      // 그룹 점수를 2단계로 전달하기 위해 window 없이 state에 저장
      setPhase2(p2)
      setPhase1GroupScore(groupScore)
      transition(() => {
        setPhase(2)
        setIndex(0)
      })
      return
    }

    // 2단계 마지막 문항이면 → 결과 계산
    if (phase === 2 && index === phase2.length - 1) {
      finish(nextAnswers)
      return
    }

    transition(() => setIndex((i) => i + 1))
  }

  function finish(allAnswers) {
    const risk = detectRisk(allAnswers)
    const { winner, ranked } = scoreFinal(allAnswers, phase1GroupScore)
    onComplete({ winner, risk, ranked, answers: allAnswers })
  }

  function transition(fn) {
    setLeaving(true)
    setTimeout(() => {
      fn()
      setLeaving(false)
    }, 180)
  }

  if (!current) return null

  return (
    <div className="flex flex-col min-h-full px-6 py-6">
      {/* 상단바 */}
      <div className="flex items-center gap-3">
        <button
          onClick={onExit}
          className="text-slate-400 text-sm font-bold active:scale-90 transition"
          aria-label="그만두기"
        >
          ✕
        </button>
        <div className="flex-1 h-2.5 rounded-full bg-white/70 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs font-bold text-slate-400 tabular-nums w-10 text-right">
          {answeredCount}/{TOTAL}
        </span>
      </div>

      {/* 단계 안내 */}
      <p className="mt-6 text-center text-xs font-bold text-indigo-400">
        {phase === 1 ? 'STEP 1 · 마음의 결 살펴보기' : 'STEP 2 · 감정 자세히 들여다보기'}
      </p>

      {/* 질문 */}
      <div className="flex-1 flex items-center justify-center">
        <div
          key={`${phase}-${index}`}
          className={`w-full max-w-md text-center ${leaving ? '' : 'anim-float'}`}
        >
          <p className="text-2xl font-bold text-slate-700 leading-relaxed break-keep">
            {current.text}
          </p>
        </div>
      </div>

      {/* 4단계 답변 */}
      <div className="w-full max-w-md mx-auto space-y-2.5 pb-4">
        {SCALE.map((s) => (
          <button
            key={s.value}
            onClick={() => handleAnswer(s.value)}
            className="w-full py-4 rounded-2xl bg-white/80 border border-slate-200 text-slate-700 font-bold text-lg shadow-sm active:scale-95 transition-transform hover:border-indigo-300 hover:bg-white flex items-center justify-center gap-3"
          >
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: s.color }}
            />
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}
