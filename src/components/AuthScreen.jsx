import { useState } from 'react'
import { useAuth } from '../lib/AuthContext.jsx'

// 로그인 / 회원가입 화면 (이메일 + 비밀번호)
export default function AuthScreen({ onDone, onBack }) {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const isSignup = mode === 'signup'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')

    if (!email || !password) {
      setError('이메일과 비밀번호를 모두 입력해 주세요.')
      return
    }
    if (isSignup && password.length < 6) {
      setError('비밀번호는 6자 이상으로 만들어 주세요.')
      return
    }

    setBusy(true)
    try {
      if (isSignup) {
        const { data, error } = await signUp(email, password, name)
        if (error) {
          setError(translateError(error.message))
        } else if (data?.session) {
          onDone() // 바로 로그인됨 (이메일 확인 꺼져 있을 때)
        } else {
          setInfo('가입 확인 메일을 보냈어요. 메일함에서 링크를 눌러 인증한 뒤 로그인해 주세요.')
          setMode('login')
        }
      } else {
        const { error } = await signIn(email, password)
        if (error) setError(translateError(error.message))
        else onDone()
      }
    } catch {
      setError('문제가 생겼어요. 잠시 후 다시 시도해 주세요.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 py-12">
      <div className="anim-float w-full max-w-sm">
        <button
          onClick={onBack}
          className="text-slate-400 text-sm font-bold active:scale-90 transition mb-6"
        >
          ← 뒤로
        </button>

        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🧭</div>
          <h1 className="text-2xl font-black text-slate-700">
            {isSignup ? 'FeelMe 회원가입' : 'FeelMe 로그인'}
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            내 감정 기록을 계정에 안전하게 저장해요.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {isSignup && (
            <Field
              label="닉네임 (선택)"
              type="text"
              value={name}
              onChange={setName}
              placeholder="예: 은서"
            />
          )}
          <Field
            label="이메일"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            autoComplete="email"
          />
          <Field
            label="비밀번호"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="6자 이상"
            autoComplete={isSignup ? 'new-password' : 'current-password'}
          />

          {error && (
            <p className="text-sm text-rose-500 font-bold bg-rose-50 rounded-xl px-4 py-3">
              {error}
            </p>
          )}
          {info && (
            <p className="text-sm text-emerald-600 font-bold bg-emerald-50 rounded-xl px-4 py-3">
              {info}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-lg font-bold shadow-lg shadow-indigo-200 active:scale-95 transition-transform disabled:opacity-60"
          >
            {busy ? '잠시만요…' : isSignup ? '가입하기' : '로그인'}
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-slate-500">
          {isSignup ? '이미 계정이 있나요?' : '계정이 없나요?'}{' '}
          <button
            onClick={() => {
              setMode(isSignup ? 'login' : 'signup')
              setError('')
              setInfo('')
            }}
            className="font-bold text-indigo-500 underline active:scale-95 transition"
          >
            {isSignup ? '로그인' : '회원가입'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, ...props }) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-slate-500 ml-1">{label}</span>
      <input
        {...props}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-4 py-3.5 rounded-2xl bg-white/80 border border-slate-200 text-slate-700 font-medium outline-none focus:border-indigo-400 focus:bg-white transition"
      />
    </label>
  )
}

// Supabase 영어 에러를 친절한 한국어로
function translateError(msg = '') {
  const m = msg.toLowerCase()
  if (m.includes('invalid login')) return '이메일 또는 비밀번호가 올바르지 않아요.'
  if (m.includes('already registered') || m.includes('already exists'))
    return '이미 가입된 이메일이에요. 로그인해 주세요.'
  if (m.includes('email') && m.includes('invalid')) return '이메일 형식이 올바르지 않아요.'
  if (m.includes('password')) return '비밀번호는 6자 이상이어야 해요.'
  if (m.includes('rate limit')) return '요청이 너무 많아요. 잠시 후 다시 시도해 주세요.'
  return msg || '문제가 생겼어요. 다시 시도해 주세요.'
}
