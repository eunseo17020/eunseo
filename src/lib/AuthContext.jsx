// FeelMe · 인증(로그인) 상태 관리
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from './supabase.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }
    // 현재 세션 확인
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })
    // 로그인/로그아웃 변화 감지
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const signUp = async (email, password, displayName) => {
    if (!supabase) return { error: { message: 'Supabase가 설정되지 않았어요.' } }
    return supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName || email.split('@')[0] } },
    })
  }

  const signIn = async (email, password) => {
    if (!supabase) return { error: { message: 'Supabase가 설정되지 않았어요.' } }
    return supabase.auth.signInWithPassword({ email, password })
  }

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut()
    setUser(null)
  }

  // 표시용 이름 (display_name → 이메일 앞부분)
  const displayName =
    user?.user_metadata?.display_name || user?.email?.split('@')[0] || ''

  return (
    <AuthContext.Provider
      value={{
        user,
        displayName,
        loading,
        configured: isSupabaseConfigured,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
