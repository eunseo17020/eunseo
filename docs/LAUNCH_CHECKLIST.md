# 🚀 moodi 출시 전 수정 체크리스트

> 이 파일은 **작업이 중간에 끊겼을 때 이어서 하기 위한 기록**이에요.
> 다시 시작할 때 이 파일만 보면 어디까지 했는지 알 수 있어요.
> 상태: `[ ]` 안 함 / `[x]` 코드 수정 완료 / `[배포]` 실제 사이트에 반영까지 완료

마지막 업데이트: **v4 코드 수정 전부 완료 + 자동 테스트 23개 통과.**
남은 일은 아래 "배포 순서" 2가지(SQL 실행 + 코드 push)뿐이에요.

---

## 🔴 반드시 고쳐야 함

- [x] **1. 익명 게시판 익명성 노출** (`supabase/schema_v4_security.sql`, `src/lib/storage.js`)
  - 문제: `posts` / `post_likes`의 `user_id`가 API로 조회 가능 → 익명 글 작성자 역추적 가능
  - 조치: `user_id` 컬럼 SELECT 권한 revoke + `auth.uid()` 기본값 + 내 글/공감 조회는 SECURITY DEFINER RPC로
- [x] **2. 저장 실패인데 "저장됐어요"로 표시되고 글 사라짐** (`DiaryScreen.jsx`, `BoardScreen.jsx`)
  - 조치: 저장 성공했을 때만 입력창 비우기, 실패 시 내용 보존 + 에러 메시지

## 🟡 고치면 좋음

- [x] **4. 네트워크 오류가 "데이터 없음"으로 보임** (`storage.js`, `App.jsx`, `HistoryScreen`, `DiaryScreen`, `BoardScreen`)
  - 조치: fetch 결과를 `{ data, error }`로 반환하고, 에러면 "불러오지 못했어요 + 다시 시도" 표시
- [x] **5. 의료 조언 아님 고지가 결과 화면에만 있음** (`StartScreen.jsx`, `DiaryScreen.jsx`, `BoardScreen.jsx`)
  - 조치: 공통 `Disclaimer` 컴포넌트로 주요 화면 하단에 한 줄 고지 + 상담 연락처
- [x] **6. 게시판이 로그인 없이 전체 공개** (`schema_v4_security.sql`, `BoardScreen.jsx`)
  - 조치: 읽기도 로그인 필요(RLS `authenticated`), 비로그인 시 로그인 안내
- [x] **7. 로그인 상태 깜빡임(flicker)** (`App.jsx`)
  - 조치: `useAuth().loading` 동안 스플래시 화면 표시
- [ ] **3. UI 언어 (한국어 → 영어?)** ← **네가 결정해야 하는 항목**
  - 지금은 100% 한국어. 친구들이 영어를 더 편해하면 영어로 바꿔야 함.
  - 전체 번역은 작업량이 크므로 별도 진행. (기능 문제 아님)

## 🟢 나중에 / 정리

- [x] **10. 핀치 줌 차단 제거** (`index.html` viewport)
- [x] **11. 소셜 공유 미리보기(og:) 태그 추가** (`index.html`)
- [x] **13. favicon 이모지 → 실제 벡터 아이콘** (`public/favicon.svg`)
- [x] **9. 코드 주석의 옛 이름(FeelMe) 정리**
- [ ] 12. 번들 크기 최적화(코드 스플리팅) — 지금은 문제 없음
- [ ] 8. `console.error` 정리 — UI 에러 표시로 대체했으므로 개발용으로 유지 중

---

## ✅ 배포 순서 (코드 수정 후 반드시 이 순서대로)

1. **Supabase SQL 실행** — `supabase/schema_v4_security.sql` 전체를 SQL Editor에 붙여넣고 Run
   - ⚠️ 이걸 먼저 안 하면 게시판의 "내 글 삭제/공감 표시"가 동작하지 않아요 (앱은 안 죽고 그냥 표시만 안 됨)
2. **코드 push**
   ```bash
   cd ~/Downloads/feelme
   tar -xzf ~/Downloads/moodiv4.tar.gz
   git add .
   git commit -m "security and stability fixes"
   git push
   ```
3. Netlify 자동 배포 확인 → `moodi.fit` 에서 `Cmd+Shift+R`

## 🧪 이미 통과한 자동 검증 (v4)

게스트 모드 16개 + 로그인 설정 모드 7개 = **23개 전부 통과**

- 브랜드(moodi) / 의료 고지 / 상담번호 109 노출
- 360px 폭에서 가로 스크롤 없음 (모바일)
- 일기: 빈 상태 → 저장 성공 → 목록 반영 → 입력창 비워짐
- **일기 저장 실패 시: 에러 표시 + 글 보존 + "저장됐어요" 안 뜸** ← 핵심 수정
- 비로그인 게시판 = 잠금 안내, 글 목록 노출 안 됨
- 로그인 화면: 빈 입력 검증 / 6자 미만 비밀번호 검증
- 퀴즈 15문항 완주 → 결과·안전화면 정상
- JS 런타임 에러 0건

## 🔍 배포 후 확인할 것

- [ ] 로그인 → 감정 테스트 → 결과 → 일기 저장 → 목록에 보임
- [ ] 게시판: 글 작성 → 목록에 보임 → 공감 ❤️ 눌림 → 내 글 삭제 버튼 보임
- [ ] 로그아웃 상태에서 게시판 → "로그인이 필요해요" 안내
- [ ] 비행기모드로 만든 뒤 일기 저장 → "저장 실패" 뜨고 **글이 사라지지 않음**
