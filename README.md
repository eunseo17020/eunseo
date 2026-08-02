# 🧭 moodi

> 지금 내 마음에 가장 가까운 감정을 함께 찾아주는 서비스

15개의 질문에 4단계로 답하면, **30가지 감정** 중 지금 나의 마음에 가장 가까운 하나를 찾아
감정 설명 · 위로의 말 · 해결법을 제공합니다.

## ✨ 주요 기능

- **2단계 설문 (15문항)** — ① 마음의 결(그룹)을 넓게 좁히고 ② 감정을 자세히 들여다봅니다.
- **문항 은행 (450문항)** — 감정 30개 × 15문항. 방문할 때마다 다른 문항이 출제되어 지루하지 않아요.
- **감정 캐릭터 & 결과** — 감정 캐릭터, 설명, 위로의 말, 추천 해결법 제공.
- **감정 일기 📖** — 오늘 나온 감정을 기록하고, 있었던 일·속마음을 적어요. (로그인 시 계정 저장)
- **익명 게시판 💬** — 서로의 마음을 익명으로 나누고 '공감'해요.
- **안전 안내** — 위험 신호가 감지되면 결과 대신 전문 상담 연락처를 부드럽게 안내합니다.
- **감정 기록 & 그래프** — 결과가 쌓이고, 감정 분포를 그래프로 볼 수 있어요.
- **오늘의 한마디** — 시작 화면에서 랜덤 위로 문구 제공.

## 🧩 감정 그룹 (6)

| 그룹 | 감정 |
|---|---|
| 😊 긍정·들뜸 | 행복 · 설렘 · 기대감 · 벅참 · 자신감 · 감동 |
| 😌 긍정·차분 | 평온 · 해방감 · 시원섭섭함 |
| 😡 분노 | 화남 · 억울함 · 답답함 |
| 😰 불안·긴장 | 불안 · 두려움 · 긴장감 · 스트레스 · 혼란 |
| 😢 가라앉음 | 슬픔 · 무기력 · 지침 · 피로감 · 자괴감 · 후회 · 실망 |
| 🥺 관계·단절 | 외로움 · 고독 · 소외감 · 질투 · 미련 · 부끄러움 · 혼란 |

## 🛠 기술 스택

- **React 18 + Vite**
- **Tailwind CSS v4**
- **Supabase** (회원가입/로그인 + PostgreSQL DB) — *선택*
- **localStorage** (로그인하지 않은 게스트의 감정 기록)

## 🚀 실행

```bash
npm install
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드
npm run preview  # 빌드 결과 미리보기
```

## 🔐 계정 · 데이터베이스 설정 (Supabase)

Supabase를 연결하면 회원가입/로그인과 계정별 감정 기록 저장이 켜져요.
**설정하지 않아도** 앱은 게스트 모드(브라우저 저장)로 정상 동작합니다.

1. [supabase.com](https://supabase.com) 에서 무료 프로젝트 생성
2. 대시보드 → **SQL Editor** 에서 순서대로 실행:
   [`supabase/schema.sql`](supabase/schema.sql) →
   [`supabase/schema_diary_board.sql`](supabase/schema_diary_board.sql) (일기·게시판) →
   [`supabase/schema_v4_security.sql`](supabase/schema_v4_security.sql) (**익명성 보호 · 필수**)
3. 대시보드 → **Settings → API** 에서 `Project URL` 과 `anon public` 키 복사
4. `.env.example` 을 복사해 `.env` 파일을 만들고 값 채우기:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGci...
   ```
5. 배포(Netlify)에도 같은 두 환경변수를 등록: **Site configuration → Environment variables**
6. (선택) 즉시 로그인되게 하려면 **Authentication → Providers → Email** 에서
   "Confirm email" 을 꺼도 돼요. 켜두면 가입 시 확인 메일이 발송됩니다.

### 데이터베이스 구조

| 테이블 | 설명 |
|---|---|
| `profiles` | 사용자 프로필 (auth.users와 1:1, 닉네임) |
| `emotion_logs` | 사용자별 감정 결과 기록 (emotion_id, 시각) |
| `diary_entries` | 감정 일기 (감정 + 내용 + 시각) |
| `posts` | 익명 게시판 글 (닉네임·감정·내용) — 로그인 사용자만 읽기, 본인만 삭제 |
| `post_likes` | 게시글 공감 (한 사람당 글마다 1번) |

모든 테이블은 **RLS(행 수준 보안)** 로 보호돼요. 개인 데이터(`profiles`·`emotion_logs`·`diary_entries`)는
본인만 접근할 수 있어요.

**익명 게시판의 익명성 보호**: `posts`·`post_likes`의 `user_id` 컬럼은 API에서 조회할 수 없도록
권한을 차단했고(`revoke select`), `user_id`는 서버가 `auth.uid()`로 자동으로 채워요.
내 글·내 공감 목록은 `my_post_ids()` / `my_liked_post_ids()` **SECURITY DEFINER 함수**로만 조회하므로,
다른 사람이 글쓴이를 역추적할 수 없어요.

## ⚠️ 안내

moodi의 결과는 전문적인 진단이 아닙니다. 마음이 많이 힘들다면 꼭 전문가의 도움을 받으세요.

- 자살예방 상담전화 **109**
- 정신건강 상담전화 **1577-0199**
- 청소년 전화 **1388**

---

📄 기획·설계 문서: [`docs/moodi_기획서.pdf`](docs/moodi_기획서.pdf)
