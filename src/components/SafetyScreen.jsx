import { SAFETY_CONTACTS } from '../data/emotions.js'

export default function SafetyScreen({ onContinue, onHome }) {
  return (
    <div className="flex flex-col items-center min-h-full px-6 py-12">
      <div className="anim-float text-center max-w-md">
        <div className="text-6xl mb-4">🫂</div>
        <h1 className="text-2xl font-black text-slate-700 leading-relaxed break-keep">
          잠깐,
          <br />
          당신의 마음이 걱정돼요.
        </h1>
        <p className="mt-4 text-slate-500 leading-relaxed break-keep">
          지금 많이 지치고 힘든 시간을 보내고 계신 것 같아요.
          그 마음, 혼자 견디지 않으셔도 괜찮아요.
          당신은 소중한 사람이고, 도움을 받을 자격이 충분해요.
        </p>
      </div>

      {/* 상담 연락처 */}
      <div className="anim-float w-full max-w-md mt-8 space-y-3">
        {SAFETY_CONTACTS.map((c) => (
          <a
            key={c.number}
            href={`tel:${c.number.replace(/-/g, '')}`}
            className="flex items-center gap-4 rounded-2xl bg-white border border-rose-100 shadow-sm p-4 active:scale-95 transition-transform"
          >
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-2xl shrink-0">
              📞
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-700">{c.name}</p>
              <p className="text-xs text-slate-400">{c.desc}</p>
            </div>
            <span className="font-black text-rose-500 text-lg tabular-nums">{c.number}</span>
          </a>
        ))}
      </div>

      <p className="anim-float mt-6 text-sm text-slate-500 text-center max-w-md leading-relaxed break-keep">
        전화가 부담스럽다면, 곁에 있는 가족이나 친구에게
        <br />
        지금 마음을 살짝 이야기해 보는 것도 좋아요.
      </p>

      <div className="w-full max-w-md mt-8 space-y-3">
        <button
          onClick={onHome}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-400 to-pink-400 text-white text-lg font-bold shadow-lg shadow-rose-100 active:scale-95 transition-transform"
        >
          알겠어요, 고마워요 🌷
        </button>
        <button
          onClick={onContinue}
          className="w-full py-3 text-slate-400 text-sm font-bold active:scale-95 transition"
        >
          그래도 결과 보기
        </button>
      </div>
    </div>
  )
}
