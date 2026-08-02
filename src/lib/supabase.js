// moodi · Supabase 클라이언트
// 환경변수(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)가 설정돼 있으면 연결,
// 없으면 null → 앱은 게스트(로컬 저장) 모드로 정상 동작해요.
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey)
  : null
