// FeelMe · 감정 기록 저장
// 로그인 상태면 Supabase DB(emotion_logs), 게스트면 브라우저 localStorage 사용.
import { supabase } from './supabase.js'

const KEY = 'feelme.history.v1'

// ── 로컬(게스트) ──────────────────────────────────────────
export function loadLocalHistory() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveLocalResult(emotionId) {
  try {
    const history = loadLocalHistory()
    history.push({ emotionId, date: new Date().toISOString() })
    localStorage.setItem(KEY, JSON.stringify(history.slice(-200)))
    return history
  } catch {
    return loadLocalHistory()
  }
}

export function clearLocalHistory() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* noop */
  }
}

// ── 원격(로그인 사용자) ───────────────────────────────────
export async function fetchRemoteHistory(userId) {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('emotion_logs')
    .select('emotion_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  if (error) {
    console.error('감정 기록 불러오기 실패:', error.message)
    return []
  }
  return data.map((r) => ({ emotionId: r.emotion_id, date: r.created_at }))
}

export async function insertRemoteResult(userId, emotionId) {
  if (!supabase) return
  const { error } = await supabase
    .from('emotion_logs')
    .insert({ user_id: userId, emotion_id: emotionId })
  if (error) console.error('감정 기록 저장 실패:', error.message)
}

export async function clearRemoteHistory(userId) {
  if (!supabase) return
  const { error } = await supabase
    .from('emotion_logs')
    .delete()
    .eq('user_id', userId)
  if (error) console.error('감정 기록 삭제 실패:', error.message)
}
