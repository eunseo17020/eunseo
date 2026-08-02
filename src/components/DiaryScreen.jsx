import { useState, useEffect } from 'react'
import { EMOTION_BY_ID } from '../data/emotions.js'
import { useAuth } from '../lib/AuthContext.jsx'
import Disclaimer from './Disclaimer.jsx'
import {
  loadLocalDiary,
  saveLocalDiary,
  deleteLocalDiary,
  fetchRemoteDiary,
  insertRemoteDiary,
  deleteRemoteDiary,
} from '../lib/storage.js'

// 감정 일기: 오늘의 감정을 기록하고, 있었던 일·속마음을 적어요.
// todayEmotion(선택): 감정 테스트 직후 넘어오면 그 감정이 기본으로 붙어요.
export default function DiaryScreen({ onHome, todayEmotion = null }) {
  const { user } = useAuth()
  const [entries, setEntries] = useState([])
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [loadError, setLoadError] = useState(false)
  const [loading, setLoading] = useState(true)

  const emotion = todayEmotion // 결과에서 넘어온 오늘의 감정

  async function load() {
    setLoading(true)
    if (user) {
      const { data, error } = await fetchRemoteDiary(user.id)
      setEntries(data)
      setLoadError(Boolean(error))
    } else {
      setEntries(loadLocalDiary().slice().reverse())
      setLoadError(false)
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function handleSave() {
    const text = content.trim()
    if (!text) return
    setSaving(true)
    setSaveError('')
    setSavedMsg(false) // 이전 저장의 "저장됐어요"가 남아 헷갈리지 않도록

    const emoId = emotion?.id ?? null
    const saved = user
      ? await insertRemoteDiary(user.id, emoId, text)
      : saveLocalDiary(emoId, text)

    setSaving(false)

    // ⚠️ 저장에 성공했을 때만 입력창을 비워요. (실패 시 쓴 글이 사라지면 안 되니까)
    if (!saved) {
      setSaveError('저장하지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.')
      return
    }

    setEntries((prev) => [saved, ...prev])
    setContent('')
    setSavedMsg(true)
    setTimeout(() => setSavedMsg(false), 2000)
  }

  async function handleDelete(id) {
    const prev = entries
    setEntries((list) => list.filter((e) => e.id !== id))
    const success = user ? await deleteRemoteDiary(id) : Boolean(deleteLocalDiary(id))
    if (!success) setEntries(prev) // 실패하면 되돌리기
  }

  return (
    <div className="flex flex-col min-h-full px-6 py-10">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-black text-slate-700">📖 감정 일기</h1>
        <button
          onClick={onHome}
          className="text-slate-400 text-sm font-bold active:scale-90 transition"
        >
          닫기 ✕
        </button>
      </div>

      {/* 오늘 쓰기 */}
      <div className="anim-float rounded-2xl bg-white/80 border border-white shadow-sm p-5">
        {emotion ? (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">{emotion.emoji}</span>
            <span className="text-sm font-bold text-slate-600">
              오늘의 감정 · <span style={{ color: emotion.color }}>{emotion.name}</span>
            </span>
          </div>
        ) : (
          <p className="text-sm font-bold text-indigo-400 mb-3">오늘의 마음을 적어보세요</p>
        )}

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          maxLength={1000}
          placeholder="오늘 있었던 일이나, 지금 속마음을 편하게 적어보세요…"
          className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 outline-none focus:border-indigo-400 resize-none leading-relaxed"
        />

        {saveError && (
          <p className="mt-3 text-sm text-rose-500 font-bold bg-rose-50 rounded-xl px-4 py-3">
            {saveError}
          </p>
        )}

        <div className="flex items-center justify-between gap-3 mt-3">
          <span className="text-xs text-slate-400 shrink-0">{content.length}/1000</span>
          <div className="flex items-center gap-3">
            {savedMsg && (
              <span className="text-sm font-bold text-emerald-500 shrink-0">저장됐어요 ✓</span>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !content.trim()}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold shadow active:scale-95 transition disabled:opacity-50 shrink-0"
            >
              {saving ? '저장 중…' : '일기 저장'}
            </button>
          </div>
        </div>

        {!user && (
          <p className="text-xs text-slate-400 mt-3">
            지금은 이 기기에만 저장돼요. 로그인하면 계정에 안전하게 보관돼요.
          </p>
        )}
      </div>

      {/* 지난 일기 */}
      <p className="mt-8 mb-3 text-sm font-bold text-indigo-400">
        지난 일기 {entries.length > 0 && `(${entries.length})`}
      </p>

      {loading ? (
        <p className="text-center text-slate-400 py-10">불러오는 중…</p>
      ) : loadError ? (
        <div className="flex flex-col items-center text-center text-slate-400 py-10">
          <div className="text-5xl mb-3">📡</div>
          <p className="mb-4">
            일기를 불러오지 못했어요.
            <br />
            인터넷 연결을 확인해 주세요.
          </p>
          <button
            onClick={load}
            className="px-5 py-2.5 rounded-xl bg-white/80 border border-slate-200 text-slate-600 font-bold active:scale-95 transition"
          >
            다시 시도
          </button>
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center text-center text-slate-400 py-10">
          <div className="text-5xl mb-3">🌷</div>
          <p>
            아직 쓴 일기가 없어요.
            <br />
            오늘의 마음을 첫 일기로 남겨보세요.
          </p>
        </div>
      ) : (
        <div className="space-y-3 pb-6">
          {entries.map((e) => {
            const emo = e.emotionId ? EMOTION_BY_ID[e.emotionId] : null
            const d = new Date(e.date)
            return (
              <div
                key={e.id}
                className="anim-float rounded-2xl bg-white/80 border border-white shadow-sm p-4"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {emo && <span className="text-xl shrink-0">{emo.emoji}</span>}
                    {emo && (
                      <span
                        className="text-sm font-bold shrink-0"
                        style={{ color: emo.color }}
                      >
                        {emo.name}
                      </span>
                    )}
                    <span className="text-xs text-slate-400 shrink-0">
                      {d.getFullYear()}.{d.getMonth() + 1}.{d.getDate()}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(e.id)}
                    className="text-xs text-slate-300 hover:text-rose-400 font-bold active:scale-90 transition shrink-0"
                  >
                    삭제
                  </button>
                </div>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap break-words">
                  {e.content}
                </p>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-auto pt-4">
        <button
          onClick={onHome}
          className="w-full max-w-md mx-auto block py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-lg font-bold shadow-lg shadow-indigo-200 active:scale-95 transition-transform"
        >
          처음으로 🏠
        </button>
        <Disclaimer className="mt-5" />
      </div>
    </div>
  )
}
