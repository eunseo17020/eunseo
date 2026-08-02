// 정신건강 관련 서비스이므로, 주요 화면 하단에 항상 노출되는 안내 문구예요.
// (의료 서비스가 아니라는 점 + 도움받을 수 있는 곳)
export default function Disclaimer({ className = '' }) {
  return (
    <p className={`text-[11px] text-slate-400 text-center leading-relaxed ${className}`}>
      moodi는 의료 서비스가 아니며, 결과는 진단이 아니에요.
      <br />
      많이 힘들다면 혼자 견디지 말고 도움을 요청하세요 ·{' '}
      <a href="tel:109" className="font-bold underline text-slate-500">
        자살예방 109
      </a>
    </p>
  )
}
