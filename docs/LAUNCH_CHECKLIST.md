# 🚀 moodi 출시 전 체크리스트

> 작업이 중간에 끊겼을 때 **이 파일만 보면 이어서 할 수 있어요.**
> 새 대화에서 "docs/LAUNCH_CHECKLIST.md 보고 이어서 해줘" 라고 하면 됩니다.
> 상태: `[ ]` 안 함 / `[x]` 코드 완료 / `[배포]` 사이트 반영까지 완료

**현재 버전: v5** (2차 감사 지적사항 반영)

---

## 📌 지금 남은 일 (딱 3개)

1. **[ ] Supabase에서 `supabase/schema_v5.sql` 실행** ← 익명성 보호 + 글 길이 제한
2. **[ ] Supabase → Authentication → Sign In/Providers → Email → "Confirm email" **끄기** + Save**
   - 켜져 있으면 친구들이 인증 메일을 못 받아 **가입 자체가 불가능**해요
3. **[ ] v5 코드 push** (아래 "배포 순서" 참고)

> ✅ v5부터는 **1번 SQL을 아직 안 돌려도 게시판이 정상 동작**하도록 코드를 고쳤어요.
> (단, SQL을 돌려야 익명성 보호가 켜집니다 — 출시 전 꼭 실행)

---

## ✅ v5에서 고친 것 (2차 감사)

- [x] **게시판이 SQL 미실행 시 완전히 고장나던 문제** (`src/lib/storage.js`)
  - `createPost`/`likePost`가 `user_id`를 다시 명시적으로 전송 → 마이그레이션 전에도 동작
  - 위조는 RLS(`with check auth.uid() = user_id`)가 계속 차단하므로 안전함
- [x] **캐릭터 이름 오타** `기대’이` → `기대이` (`src/data/emotions.js`)
- [x] **중복 가입 시 막다른 길** (`src/components/AuthScreen.jsx`)
  - 기존: 오지 않을 "확인 메일 보냈어요" 안내 → 변경: "이미 가입된 이메일일 수 있어요. 로그인해 보세요."
- [x] **서버 쪽 글 길이 제한 없음** → `supabase/schema_v5.sql` 에 CHECK 제약 추가 (글 500자 / 일기 1000자)
- [x] **게시판 운영 안내 문구** 추가 (부적절한 글 삭제 가능)
- [x] **og:image 가 SVG라 카톡 미리보기 안 뜸** → PNG로 교체 (`public/og-image.png`)
- [x] **퀴즈 중간 이탈 시 경고 없음** → 답변한 게 있으면 확인창 표시 (`QuizScreen.jsx`)

## ✅ v4에서 고친 것 (1차 감사) — 이미 배포됨

- [x] 익명 게시판 익명성 노출 (user_id 조회 차단 + SECURITY DEFINER 함수)
- [x] 저장 실패인데 "저장됐어요" 뜨고 글 사라지던 문제
- [x] 네트워크 오류를 "데이터 없음"으로 보여주던 문제 (+ 다시 시도 버튼)
- [x] 정신건강 고지(Disclaimer) 주요 화면 상시 노출
- [x] 로그인 상태 깜빡임, 핀치 줌 차단, 벡터 favicon, 잔여 FeelMe 표기

## ⬜ 의도적으로 안 한 것 (나중에)

- [ ] **UI 언어 한국어 → 영어** ← 친구들이 어느 쪽을 편해하는지에 따라 결정 (기능 문제 아님)
- [ ] 계정 삭제 기능 (요청 시 Supabase에서 직접 삭제로 충분)
- [ ] 게시판 신고 기능 (Table Editor에서 직접 삭제로 운영)
- [ ] 로그아웃 버튼을 모든 화면에 (현재 시작 화면에만)
- [ ] 번들 크기 최적화 (458KB, 현재 문제 없음)

---

## 🚀 배포 순서

1. **Supabase SQL Editor** 에서 `supabase/schema_v5.sql` 전체 실행
2. **Authentication → Email → "Confirm email" OFF** 확인
3. 코드 push:
   ```bash
   cd ~/Downloads/feelme
   tar -xzf ~/Downloads/moodiv5.tar.gz
   git add .
   git commit -m "post-audit fixes"
   git push
   ```
4. Netlify 자동 배포 → `moodi.fit` 에서 `Cmd+Shift+R`

## 🔍 배포 후 직접 확인 (이게 진짜 검수)

- [ ] **새 이메일로 회원가입** → 인증 메일 없이 바로 로그인되는가
- [ ] 감정 테스트 15문항 → 결과 화면 정상
- [ ] 결과에서 "일기 쓰기" → 저장 → 목록에 보이는가
- [ ] **게시판에 글 쓰기 → 올라가는가** (안 되면 1번 SQL 미실행)
- [ ] 공감 ❤️ 눌러지는가 / 내 글에 삭제 버튼 보이는가
- [ ] 로그아웃 → 게시판 들어가면 "로그인 필요" 안내
- [ ] 익명성 확인: SQL Editor에서 `select user_id from public.posts limit 1;`
      → **권한 오류가 나야 정상**
