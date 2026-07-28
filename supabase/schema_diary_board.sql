-- moodi · 감정 일기 + 익명 게시판 스키마 (추가 마이그레이션)
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 "Run" 하세요. (한 번만)

-- ─────────────────────────────────────────────────────────
-- 1) 감정 일기 (diary_entries)
-- ─────────────────────────────────────────────────────────
create table if not exists public.diary_entries (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  emotion_id text,                          -- 오늘 나온 감정 (없을 수도 있음)
  content    text not null,                 -- 오늘 있었던 일 / 속마음
  created_at timestamptz not null default now()
);

alter table public.diary_entries enable row level security;

drop policy if exists "본인 일기 조회" on public.diary_entries;
create policy "본인 일기 조회" on public.diary_entries
  for select using (auth.uid() = user_id);

drop policy if exists "본인 일기 작성" on public.diary_entries;
create policy "본인 일기 작성" on public.diary_entries
  for insert with check (auth.uid() = user_id);

drop policy if exists "본인 일기 삭제" on public.diary_entries;
create policy "본인 일기 삭제" on public.diary_entries
  for delete using (auth.uid() = user_id);

create index if not exists diary_user_created_idx
  on public.diary_entries (user_id, created_at desc);

-- ─────────────────────────────────────────────────────────
-- 2) 익명 게시판 글 (posts)
--    · 모두 읽기 가능(익명 게시판), 로그인 사용자만 작성, 본인 글만 삭제
-- ─────────────────────────────────────────────────────────
create table if not exists public.posts (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  nickname   text not null default '익명',   -- 화면 표시용 익명 닉네임
  emotion_id text,                           -- 글에 붙인 감정(선택)
  content    text not null,
  created_at timestamptz not null default now()
);

alter table public.posts enable row level security;

drop policy if exists "글 전체 공개 조회" on public.posts;
create policy "글 전체 공개 조회" on public.posts
  for select using (true);

drop policy if exists "로그인 사용자 글 작성" on public.posts;
create policy "로그인 사용자 글 작성" on public.posts
  for insert with check (auth.uid() = user_id);

drop policy if exists "본인 글 삭제" on public.posts;
create policy "본인 글 삭제" on public.posts
  for delete using (auth.uid() = user_id);

create index if not exists posts_created_idx
  on public.posts (created_at desc);

-- ─────────────────────────────────────────────────────────
-- 3) 공감(좋아요) — post_likes  (한 사람당 글마다 1번)
-- ─────────────────────────────────────────────────────────
create table if not exists public.post_likes (
  post_id    bigint not null references public.posts(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.post_likes enable row level security;

drop policy if exists "공감 전체 조회" on public.post_likes;
create policy "공감 전체 조회" on public.post_likes
  for select using (true);

drop policy if exists "본인 공감 추가" on public.post_likes;
create policy "본인 공감 추가" on public.post_likes
  for insert with check (auth.uid() = user_id);

drop policy if exists "본인 공감 취소" on public.post_likes;
create policy "본인 공감 취소" on public.post_likes
  for delete using (auth.uid() = user_id);
