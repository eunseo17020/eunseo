// moodi · 저장 계층
// 로그인 상태면 Supabase DB, 게스트면 브라우저 localStorage 사용.
//
// 조회 함수는 모두 { data, error } 를 반환해요.
// → 화면에서 "데이터가 없음"과 "불러오기 실패"를 구분해서 보여주기 위해서예요.
import { supabase } from './supabase.js'

const KEY = 'moodi.history.v1'
const DIARY_KEY = 'moodi.diary.v1'

const ok = (data) => ({ data, error: null })
const fail = (error) => ({ data: [], error })

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
  if (!supabase) return ok([])
  const { data, error } = await supabase
    .from('emotion_logs')
    .select('emotion_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  if (error) {
    console.error('감정 기록 불러오기 실패:', error.message)
    return fail(error)
  }
  return ok(data.map((r) => ({ emotionId: r.emotion_id, date: r.created_at })))
}

// 성공하면 true, 실패하면 false
export async function insertRemoteResult(userId, emotionId) {
  if (!supabase) return false
  const { error } = await supabase
    .from('emotion_logs')
    .insert({ user_id: userId, emotion_id: emotionId })
  if (error) {
    console.error('감정 기록 저장 실패:', error.message)
    return false
  }
  return true
}

export async function clearRemoteHistory(userId) {
  if (!supabase) return false
  const { error } = await supabase.from('emotion_logs').delete().eq('user_id', userId)
  if (error) {
    console.error('감정 기록 삭제 실패:', error.message)
    return false
  }
  return true
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
    return null // 저장 실패(용량 초과 등) → 화면에서 실패로 처리
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
  if (!supabase) return ok([])
  const { data, error } = await supabase
    .from('diary_entries')
    .select('id, emotion_id, content, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('일기 불러오기 실패:', error.message)
    return fail(error)
  }
  return ok(
    data.map((r) => ({
      id: r.id,
      emotionId: r.emotion_id,
      content: r.content,
      date: r.created_at,
    }))
  )
}

// 성공하면 저장된 일기, 실패하면 null
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
  if (!supabase) return false
  const { error } = await supabase.from('diary_entries').delete().eq('id', id)
  if (error) {
    console.error('일기 삭제 실패:', error.message)
    return false
  }
  return true
}

// ── 익명 게시판 (Supabase 필요) ──────────────────────────
// ⚠️ 익명성: user_id 는 절대 조회하지 않아요.
//    DB에서도 user_id 컬럼 조회 권한을 막아두었어요 (schema_v4_security.sql).
//    user_id 는 서버가 auth.uid() 기본값으로 채우므로 클라이언트가 보내지 않아요.
export async function fetchPosts() {
  if (!supabase) return ok([])
  const { data, error } = await supabase
    .from('posts')
    .select('id, nickname, emotion_id, content, created_at, post_likes(count)')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) {
    console.error('게시글 불러오기 실패:', error.message)
    return fail(error)
  }
  return ok(
    data.map((p) => ({
      id: p.id,
      nickname: p.nickname,
      emotionId: p.emotion_id,
      content: p.content,
      date: p.created_at,
      likes: p.post_likes?.[0]?.count ?? 0,
    }))
  )
}

// 내가 쓴 글 id (삭제 버튼 표시용)
// 1순위: SECURITY DEFINER 함수 (익명성 보호가 켜진 상태)
// 2순위: 직접 조회 (보안 마이그레이션 실행 전 상태) → 둘 다 지원해서 언제든 동작
export async function fetchMyPostIds(userId) {
  if (!supabase) return new Set()
  const { data, error } = await supabase.rpc('my_post_ids')
  if (!error) return new Set(data ?? [])

  const fallback = await supabase.from('posts').select('id').eq('user_id', userId)
  if (fallback.error) {
    console.error('내 글 목록 조회 실패:', fallback.error.message)
    return new Set()
  }
  return new Set(fallback.data.map((r) => r.id))
}

// 내가 공감한 글 id (위와 동일한 2단계 방식)
export async function fetchMyLikes(userId) {
  if (!supabase) return new Set()
  const { data, error } = await supabase.rpc('my_liked_post_ids')
  if (!error) return new Set(data ?? [])

  const fallback = await supabase.from('post_likes').select('post_id').eq('user_id', userId)
  if (fallback.error) {
    console.error('내 공감 목록 조회 실패:', fallback.error.message)
    return new Set()
  }
  return new Set(fallback.data.map((r) => r.post_id))
}

// 성공하면 작성된 글, 실패하면 null
// user_id 를 명시적으로 보내요 — 보안 마이그레이션(schema_v5.sql) 실행 전에도 동작하게.
// 위조 걱정은 없어요: RLS 의 with check (auth.uid() = user_id) 가 남의 id 사용을 막아요.
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
  return {
    id: data.id,
    nickname: data.nickname,
    emotionId: data.emotion_id,
    content: data.content,
    date: data.created_at,
    likes: 0,
  }
}

// 본인 글만 삭제됩니다 (RLS 가 보장)
export async function deletePost(id) {
  if (!supabase) return false
  const { error } = await supabase.from('posts').delete().eq('id', id)
  if (error) {
    console.error('게시글 삭제 실패:', error.message)
    return false
  }
  return true
}

export async function likePost(userId, postId) {
  if (!supabase) return false
  const { error } = await supabase
    .from('post_likes')
    .insert({ user_id: userId, post_id: postId })
  if (error && !error.message.includes('duplicate')) {
    console.error('공감 실패:', error.message)
    return false
  }
  return true
}

// 본인 공감만 취소됩니다 (RLS 가 보장)
export async function unlikePost(postId) {
  if (!supabase) return false
  const { error } = await supabase.from('post_likes').delete().eq('post_id', postId)
  if (error) {
    console.error('공감 취소 실패:', error.message)
    return false
  }
  return true
}
