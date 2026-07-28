// moodi · 저장 계층
// 로그인 상태면 Supabase DB, 게스트면 브라우저 localStorage 사용.
import { supabase } from './supabase.js'

const KEY = 'moodi.history.v1'
const DIARY_KEY = 'moodi.diary.v1'

// ── 감정 기록: 로컬(게스트) ──────────────────────────────
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

// ── 감정 기록: 원격(로그인) ──────────────────────────────
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
  const { error } = await supabase.from('emotion_logs').delete().eq('user_id', userId)
  if (error) console.error('감정 기록 삭제 실패:', error.message)
}

// ── 감정 일기: 로컬(게스트) ──────────────────────────────
export function loadLocalDiary() {
  try {
    const raw = localStorage.getItem(DIARY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveLocalDiary(emotionId, content) {
  const list = loadLocalDiary()
  const entry = { id: `l_${Date.now()}`, emotionId, content, date: new Date().toISOString() }
  list.push(entry)
  try {
    localStorage.setItem(DIARY_KEY, JSON.stringify(list.slice(-300)))
  } catch {
    /* noop */
  }
  return entry
}

export function deleteLocalDiary(id) {
  const list = loadLocalDiary().filter((e) => e.id !== id)
  try {
    localStorage.setItem(DIARY_KEY, JSON.stringify(list))
  } catch {
    /* noop */
  }
  return list
}

// ── 감정 일기: 원격(로그인) ──────────────────────────────
export async function fetchRemoteDiary(userId) {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('diary_entries')
    .select('id, emotion_id, content, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('일기 불러오기 실패:', error.message)
    return []
  }
  return data.map((r) => ({ id: r.id, emotionId: r.emotion_id, content: r.content, date: r.created_at }))
}

export async function insertRemoteDiary(userId, emotionId, content) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('diary_entries')
    .insert({ user_id: userId, emotion_id: emotionId, content })
    .select('id, emotion_id, content, created_at')
    .single()
  if (error) {
    console.error('일기 저장 실패:', error.message)
    return null
  }
  return { id: data.id, emotionId: data.emotion_id, content: data.content, date: data.created_at }
}

export async function deleteRemoteDiary(id) {
  if (!supabase) return
  const { error } = await supabase.from('diary_entries').delete().eq('id', id)
  if (error) console.error('일기 삭제 실패:', error.message)
}

// ── 익명 게시판 (Supabase 필요) ──────────────────────────
export async function fetchPosts() {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('posts')
    .select('id, nickname, emotion_id, content, created_at, post_likes(count)')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) {
    console.error('게시글 불러오기 실패:', error.message)
    return []
  }
  return data.map((p) => ({
    id: p.id,
    nickname: p.nickname,
    emotionId: p.emotion_id,
    content: p.content,
    date: p.created_at,
    likes: p.post_likes?.[0]?.count ?? 0,
  }))
}

// 내가 쓴 글 id 목록 (삭제 버튼 표시용 — 익명성 위해 user_id는 본문에 노출 안 함)
export async function fetchMyPostIds(userId) {
  if (!supabase) return new Set()
  const { data, error } = await supabase.from('posts').select('id').eq('user_id', userId)
  if (error) return new Set()
  return new Set(data.map((r) => r.id))
}

// 내가 공감한 글 id 목록
export async function fetchMyLikes(userId) {
  if (!supabase) return new Set()
  const { data, error } = await supabase.from('post_likes').select('post_id').eq('user_id', userId)
  if (error) return new Set()
  return new Set(data.map((r) => r.post_id))
}

export async function createPost(userId, { content, emotionId, nickname }) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('posts')
    .insert({ user_id: userId, content, emotion_id: emotionId ?? null, nickname })
    .select('id, nickname, emotion_id, content, created_at')
    .single()
  if (error) {
    console.error('게시글 작성 실패:', error.message)
    return null
  }
  return { id: data.id, nickname: data.nickname, emotionId: data.emotion_id, content: data.content, date: data.created_at, likes: 0 }
}

export async function deletePost(id) {
  if (!supabase) return
  const { error } = await supabase.from('posts').delete().eq('id', id)
  if (error) console.error('게시글 삭제 실패:', error.message)
}

export async function likePost(userId, postId) {
  if (!supabase) return
  const { error } = await supabase.from('post_likes').insert({ user_id: userId, post_id: postId })
  if (error && !error.message.includes('duplicate')) console.error('공감 실패:', error.message)
}

export async function unlikePost(userId, postId) {
  if (!supabase) return
  const { error } = await supabase
    .from('post_likes')
    .delete()
    .eq('user_id', userId)
    .eq('post_id', postId)
  if (error) console.error('공감 취소 실패:', error.message)
}
