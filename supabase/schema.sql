-- moodi · 데이터베이스 스키마
-- Supabase 대시보드 → SQL Editor 에 이 파일 내용을 붙여넣고 "Run" 하세요.
-- (한 번만 실행하면 돼요. 계정/로그인은 Supabase가 auth.users 로 자동 관리합니다.)

-- ─────────────────────────────────────────────────────────
-- 1) 프로필 테이블 (auth.users 와 1:1 연결)
-- ─────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "본인 프로필 조회" on public.profiles;
create policy "본인 프로필 조회" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "본인 프로필 생성" on public.profiles;
create policy "본인 프로필 생성" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "본인 프로필 수정" on public.profiles;
create policy "본인 프로필 수정" on public.profiles
  for update using (auth.uid() = id);

-- ─────────────────────────────────────────────────────────
-- 2) 감정 기록 테이블 (사용자별 결과 저장)
-- ─────────────────────────────────────────────────────────
create table if not exists public.emotion_logs (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  emotion_id text not null,               -- 예: 'happy', 'sad' (프론트의 감정 id)
  created_at timestamptz not null default now()
);

alter table public.emotion_logs enable row level security;

drop policy if exists "본인 기록 조회" on public.emotion_logs;
create policy "본인 기록 조회" on public.emotion_logs
  for select using (auth.uid() = user_id);

drop policy if exists "본인 기록 추가" on public.emotion_logs;
create policy "본인 기록 추가" on public.emotion_logs
  for insert with check (auth.uid() = user_id);

drop policy if exists "본인 기록 삭제" on public.emotion_logs;
create policy "본인 기록 삭제" on public.emotion_logs
  for delete using (auth.uid() = user_id);

create index if not exists emotion_logs_user_created_idx
  on public.emotion_logs (user_id, created_at desc);

-- ─────────────────────────────────────────────────────────
-- 3) 회원가입 시 프로필 자동 생성 트리거
-- ─────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
