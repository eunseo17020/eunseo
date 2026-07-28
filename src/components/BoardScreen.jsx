import { useState, useEffect } from 'react'
import { EMOTION_BY_ID } from '../data/emotions.js'
import { isSupabaseConfigured } from '../lib/supabase.js'
import { useAuth } from '../lib/AuthContext.jsx'
import {
  fetchPosts,
  fetchMyPostIds,
  fetchMyLikes,
  createPost,
  deletePost,
  likePost,
  unlikePost,
} from '../lib/storage.js'

// 익명 닉네임 (글마다 랜덤 부여 → 서로 구분되면서도 익명 유지)
const NICK_ANIMALS = [
  '라쿤', '판다', '수달', '고양이', '토끼', '펭귄', '여우', '너구리',
  '햄스터', '알파카', '고슴도치', '두더지', '올빼미', '다람쥐', '물개', '코알라',
]
const randomNickname = () =>
  '익명의 ' + NICK_ANIMALS[Math.floor(Math.random() * NICK_ANIMALS.length)]

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return '방금'
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}.${d.getDate()}`
}

export default function BoardScreen({ onHome, onAuth, latestEmotion = null }) {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [myPosts, setMyPosts] = useState(new Set())
  const [myLikes, setMyLikes] = useState(new Set())
  const [content, setContent] = useState('')
  const [attachEmotion, setAttachEmotion] = useState(Boolean(latestEmotion))
  const [posting, setPosting] = useState(false)
  const [loading, setLoading] = useState(true)

  async function refresh() {
    const list = await fetchPosts()
    setPosts(list)
    if (user) {
      setMyPosts(await fetchMyPostIds(user.id))
      setMyLikes(await fetchMyLikes(user.id))
    } else {
      setMyPosts(new Set())
      setMyLikes(new Set())
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function handlePost() {
    const text = content.trim()
    if (!text || !user) return
    setPosting(true)
    const emoId = attachEmotion && latestEmotion ? latestEmotion.id : null
    const created = await createPost(user.id, {
      content: text,
      emotionId: emoId,
      nickname: randomNickname(),
    })
    if (created) {
      setPosts((prev) => [created, ...prev])
      setMyPosts((prev) => new Set(prev).add(created.id))
    }
    setContent('')
    setPosting(false)
  }

  async function toggleLike(post) {
    if (!user) {
      onAuth?.()
      return
    }
    const liked = myLikes.has(post.id)
    // 낙관적 업데이트
    setMyLikes((prev) => {
      const n = new Set(prev)
      liked ? n.delete(post.id) : n.add(post.id)
      return n
    })
    setPosts((prev) =>
      prev.map((p) => (p.id === post.id ? { ...p, likes: p.likes + (liked ? -1 : 1) } : p))
    )
    if (liked) await unlikePost(user.id, post.id)
    else await likePost(user.id, post.id)
  }

  async function handleDelete(id) {
    await deletePost(id)
    setPosts((prev) => prev.filter((p) => p.id !== id))
  }

  // Supabase 미설정 안내
  if (!isSupabaseConfigured) {
    return (
      <BoardShell onHome={onHome}>
        <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 py-16">
          <div className="text-5xl mb-3">💬</div>
          <p>익명 게시판은 로그인·데이터베이스 연결이 필요해요.</p>
        </div>
      </BoardShell>
    )
  }

  return (
    <BoardShell onHome={onHome}>
      {/* 글쓰기 */}
      <div className="anim-float rounded-2xl bg-white/80 border border-white shadow-sm p-5">
        {user ? (
          <>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="지금 마음, 익명으로 편하게 나눠보세요…"
              className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 outline-none focus:border-indigo-400 resize-none leading-relaxed"
            />
            <div className="flex items-center justify-between mt-3">
              {latestEmotion ? (
                <label className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={attachEmotion}
                    onChange={(e) => setAttachEmotion(e.target.checked)}
                    className="accent-indigo-500 w-4 h-4"
                  />
                  {latestEmotion.emoji} {latestEmotion.name} 감정 함께 표시
                </label>
              ) : (
                <span className="text-xs text-slate-400">{content.length}/500</span>
              )}
              <button
                onClick={handlePost}
                disabled={posting || !content.trim()}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold shadow active:scale-95 transition disabled:opacity-50"
              >
                {posting ? '올리는 중…' : '익명으로 올리기'}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-2">
            <p className="text-slate-500 mb-3">글을 쓰려면 로그인이 필요해요. (읽기는 자유롭게 가능해요!)</p>
            <button
              onClick={onAuth}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold shadow active:scale-95 transition"
            >
              로그인 / 회원가입
            </button>
          </div>
        )}
      </div>

      {/* 목록 */}
      {loading ? (
        <p className="text-center text-slate-400 mt-10">불러오는 중…</p>
      ) : posts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 py-12">
          <div className="text-5xl mb-3">🕊️</div>
          <p>아직 글이 없어요.
            <br />첫 마음을 나눠보세요.</p>
        </div>
      ) : (
        <div className="space-y-3 mt-5 pb-6">
          {posts.map((p) => {
            const emo = p.emotionId ? EMOTION_BY_ID[p.emotionId] : null
            const liked = myLikes.has(p.id)
            const mine = myPosts.has(p.id)
            return (
              <div
                key={p.id}
                className="anim-float rounded-2xl bg-white/80 border border-white shadow-sm p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-500">{p.nickname}</span>
                    {emo && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-bold"
                        style={{ backgroundColor: `${emo.color}1f`, color: emo.color }}
                      >
                        {emo.emoji} {emo.name}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400">{timeAgo(p.date)}</span>
                </div>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap break-keep">
                  {p.content}
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <button
                    onClick={() => toggleLike(p)}
                    className={`flex items-center gap-1.5 text-sm font-bold active:scale-90 transition ${
                      liked ? 'text-rose-500' : 'text-slate-400'
                    }`}
                  >
                    {liked ? '❤️' : '🤍'} 공감 {p.likes > 0 && p.likes}
                  </button>
                  {mine && (
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-xs text-slate-300 hover:text-rose-400 font-bold active:scale-90 transition ml-auto"
                    >
                      삭제
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </BoardShell>
  )
}

function BoardShell({ children, onHome }) {
  return (
    <div className="flex flex-col min-h-full px-6 py-10">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-700">💬 익명 게시판</h1>
          <p className="text-xs text-slate-400 mt-1">서로의 마음을 익명으로 나눠요</p>
        </div>
        <button
          onClick={onHome}
          className="text-slate-400 text-sm font-bold active:scale-90 transition"
        >
          닫기 ✕
        </button>
      </div>
      {children}
      <div className="mt-auto pt-4">
        <button
          onClick={onHome}
          className="w-full max-w-md mx-auto block py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-lg font-bold shadow-lg shadow-indigo-200 active:scale-95 transition-transform"
        >
          처음으로 🏠
        </button>
      </div>
    </div>
  )
}
