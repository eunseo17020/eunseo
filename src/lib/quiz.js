// moodi · 2단계 설문 엔진
// 1단계(6문항): 6개 그룹에서 각 1문항 랜덤 출제 → 상위 그룹 좁히기
// 2단계(9문항): 상위 그룹 내 감정들에서 랜덤 출제 → 최종 감정 결정
// 답변 4단계 척도: 전혀 아니다(0) / 아니다(1) / 그렇다(2) / 매우 그렇다(3)

import { EMOTIONS, GROUPS, EMOTION_BY_ID } from '../data/emotions.js'

export const SCALE = [
  { label: '전혀 아니다', value: 0, color: '#c9cdd6' },
  { label: '아니다', value: 1, color: '#9aa6c9' },
  { label: '그렇다', value: 2, color: '#7d8cff' },
  { label: '매우 그렇다', value: 3, color: '#5b57e0' },
]

export const RISK_THRESHOLD = 2 // '그렇다' 이상이면 위험 신호로 간주

const shuffle = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

// 그룹 → 소속 감정 목록
export const emotionsInGroup = (groupId) =>
  EMOTIONS.filter((e) => e.groups.includes(groupId))

// 하나의 문항 객체 만들기
const makeQuestion = (emotion, questionObj) => ({
  emotionId: emotion.id,
  groups: emotion.groups,
  text: questionObj.t,
  risk: !!questionObj.risk,
})

// ── 1단계 문항 생성: 각 그룹당 1문항 ──────────────────────
export function buildPhase1() {
  return shuffle(
    Object.keys(GROUPS).map((groupId) => {
      const pool = emotionsInGroup(groupId)
      const emotion = pick(pool)
      const question = pick(emotion.questions)
      return { ...makeQuestion(emotion, question), groupId }
    })
  )
}

// ── 1단계 답변 채점 → 상위 그룹 선정 ──────────────────────
// answers: [{ question, value }]
export function scorePhase1(answers) {
  const groupScore = {}
  Object.keys(GROUPS).forEach((g) => (groupScore[g] = 0))
  answers.forEach(({ question, value }) => {
    groupScore[question.groupId] += value
  })
  // 점수 내림차순 정렬, 동점이면 랜덤성 부여
  const ranked = Object.entries(groupScore)
    .map(([g, s]) => ({ group: g, score: s, jitter: Math.random() }))
    .sort((a, b) => b.score - a.score || b.jitter - a.jitter)
  return { groupScore, ranked }
}

// 상위 그룹에서 후보 감정 모으기 (상위 2개 그룹 사용해 폭 확보)
export function candidateEmotions(ranked) {
  const top = ranked.slice(0, 2).map((r) => r.group)
  // 상위 그룹 점수가 0이면(=모두 아니다) 그래도 최상위 그룹은 유지
  const ids = new Set()
  top.forEach((g) => emotionsInGroup(g).forEach((e) => ids.add(e.id)))
  return [...ids].map((id) => EMOTION_BY_ID[id])
}

// ── 2단계 문항 생성: 후보 감정에서 9문항 ──────────────────
export function buildPhase2(candidates, usedTexts = new Set(), count = 9) {
  // 후보 감정마다 골고루 배분. 후보가 많으면 각 1문항씩, 적으면 여러 문항.
  const perEmotion = {}
  candidates.forEach((e) => {
    perEmotion[e.id] = shuffle(e.questions.filter((q) => !usedTexts.has(q.t)))
  })
  const result = []
  // 라운드로빈으로 감정을 돌며 하나씩 뽑기
  const order = shuffle(candidates)
  let idx = 0
  while (result.length < count) {
    const emotion = order[idx % order.length]
    const pool = perEmotion[emotion.id]
    if (pool && pool.length) {
      const question = pool.shift()
      result.push(makeQuestion(emotion, question))
    }
    idx++
    // 모든 풀이 비었으면 종료 (문항 부족 방지)
    if (idx > order.length * 20) break
  }
  return shuffle(result)
}

// ── 2단계 답변 채점 → 최종 감정 결정 ──────────────────────
// phase1Score: 1단계 그룹 점수를 소속 감정에 소량 가중
export function scoreFinal(phase2Answers, phase1GroupScore = {}) {
  const emoScore = {}
  phase2Answers.forEach(({ question, value }) => {
    emoScore[question.emotionId] = (emoScore[question.emotionId] || 0) + value
  })
  // 1단계 그룹 점수를 소속 후보 감정에 0.3배 가중 (그룹 신호 반영)
  Object.keys(emoScore).forEach((emoId) => {
    const emotion = EMOTION_BY_ID[emoId]
    const bonus = emotion.groups.reduce(
      (sum, g) => sum + (phase1GroupScore[g] || 0),
      0
    )
    emoScore[emoId] += bonus * 0.3
  })
  const ranked = Object.entries(emoScore)
    .map(([id, s]) => ({ id, score: s, jitter: Math.random() }))
    .sort((a, b) => b.score - a.score || b.jitter - a.jitter)

  const winnerId = ranked.length ? ranked[0].id : EMOTIONS[0].id
  return { winner: EMOTION_BY_ID[winnerId], emoScore, ranked }
}

// 위험 신호 감지: risk 문항에 임계값 이상 응답했는가
export function detectRisk(allAnswers) {
  return allAnswers.some(
    ({ question, value }) => question.risk && value >= RISK_THRESHOLD
  )
}

export function randomQuote(quotes) {
  return pick(quotes)
}
