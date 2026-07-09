import { GROUPS } from '../data/emotions.js'

export default function ResultScreen({ emotion, onRestart, onHome, onHistory }) {
  const group = GROUPS[emotion.groups[0]]

  return (
    <div className="flex flex-col items-center min-h-full px-6 py-10">
      {/* 캐릭터 등장 */}
      <div className="anim-pop text-center">
        <p className="text-sm font-bold text-slate-400 mb-2">지금 당신의 마음은</p>
        <div
          className="mx-auto w-36 h-36 rounded-full flex items-center justify-center shadow-lg anim-bob"
          style={{ background: `radial-gradient(circle at 50% 40%, ${emotion.color}33, ${emotion.color}66)` }}
        >
          <span className="text-7xl">{emotion.emoji}</span>
        </div>
        <h1 className="mt-5 text-4xl font-black" style={{ color: emotion.color }}>
          {emotion.name}
        </h1>
        <p className="mt-1 font-hand text-2xl text-slate-500">{emotion.character}</p>
      </div>

      <div className="w-full max-w-md mt-8 space-y-4">
        {/* 감정 설명 */}
        <Card icon="💭" title="지금 마음은" tint={emotion.color}>
          <p className="text-slate-600 leading-relaxed break-keep">{emotion.description}</p>
        </Card>

        {/* 위로의 말 */}
        <Card icon="🫂" title="위로의 말" tint={emotion.color}>
          <ul className="space-y-2">
            {emotion.comfort.map((c, i) => (
              <li key={i} className="text-slate-600 leading-relaxed break-keep flex gap-2">
                <span style={{ color: emotion.color }}>·</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* 해결법 */}
        <Card icon="🌱" title="이렇게 해보세요" tint={emotion.color}>
          <div className="flex flex-wrap gap-2">
            {emotion.solutions.map((s, i) => (
              <span
                key={i}
                className="px-3.5 py-2 rounded-full text-sm font-bold"
                style={{ backgroundColor: `${emotion.color}1f`, color: emotion.color }}
              >
                {s}
              </span>
            ))}
          </div>
        </Card>
      </div>

      {/* 버튼 */}
      <div className="w-full max-w-md mt-8 space-y-3">
        <button
          onClick={onRestart}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-lg font-bold shadow-lg shadow-indigo-200 active:scale-95 transition-transform"
        >
          다시 해보기 🔄
        </button>
        <div className="flex gap-3">
          <button
            onClick={onHistory}
            className="flex-1 py-3.5 rounded-2xl bg-white/80 text-slate-600 font-bold border border-slate-200 active:scale-95 transition-transform"
          >
            📊 감정 기록
          </button>
          <button
            onClick={onHome}
            className="flex-1 py-3.5 rounded-2xl bg-white/80 text-slate-600 font-bold border border-slate-200 active:scale-95 transition-transform"
          >
            🏠 처음으로
          </button>
        </div>
      </div>

      <p className="mt-6 text-xs text-slate-400 text-center max-w-xs leading-relaxed">
        FeelMe의 결과는 전문적인 진단이 아니에요.
        <br />
        마음이 많이 힘들다면 꼭 전문가의 도움을 받으세요.
      </p>
    </div>
  )
}

function Card({ icon, title, children, tint }) {
  return (
    <div className="anim-float rounded-2xl bg-white/80 backdrop-blur border border-white shadow-sm p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{icon}</span>
        <h2 className="font-bold" style={{ color: tint }}>
          {title}
        </h2>
      </div>
      {children}
    </div>
  )
}
