-- moodi · v4 보안 · 익명성 강화 마이그레이션
-- Supabase 대시보드 → SQL Editor 에 전체를 붙여넣고 "Run" 하세요. (한 번만)
-- "Potential issue detected" 경고가 떠도 Run query 눌러도 됩니다
-- (기존 정책을 다시 만들기 위한 drop policy 때문이며, 테이블·데이터는 지우지 않아요)
--
-- 이 마이그레이션이 하는 일
--  1) posts / post_likes 의 user_id 를 API로 조회할 수 없게 막음 → 익명 글 작성자 역추적 차단
--  2) user_id 는 서버가 auth.uid() 로 자동으로 채움 → 클라이언트가 남의 id로 위조 불가
--  3) 내 글 / 내 공감 목록은 SECURITY DEFINER 함수로만 조회
--  4) 게시판 읽기를 로그인 사용자로 제한

-- ─────────────────────────────────────────────────────────
-- 1) user_id 를 서버가 자동으로 채우게 (클라이언트가 보낼 필요 없음)
-- ─────────────────────────────────────────────────────────
alter table public.posts       alter column user_id set default auth.uid();
alter table public.post_likes  alter column user_id set default auth.uid();

-- ─────────────────────────────────────────────────────────
-- 2) 게시판 읽기: 로그인 사용자만 (인터넷 전체 공개 → 로그인 필요)
-- ─────────────────────────────────────────────────────────
drop policy if exists "글 전체 공개 조회" on public.posts;
drop policy if exists "로그인 사용자 글 조회" on public.posts;
create policy "로그인 사용자 글 조회" on public.posts
  for select to authenticated using (true);

drop policy if exists "공감 전체 조회" on public.post_likes;
drop policy if exists "로그인 사용자 공감 조회" on public.post_likes;
create policy "로그인 사용자 공감 조회" on public.post_likes
  for select to authenticated using (true);

-- ─────────────────────────────────────────────────────────
-- 3) ⭐ 핵심: user_id 컬럼을 API에서 읽지 못하게 차단
--    (RLS 는 "어떤 행"을 볼지 정할 뿐, "어떤 컬럼"인지는 막지 못하므로 필요)
-- ─────────────────────────────────────────────────────────
revoke select (user_id) on public.posts      from anon, authenticated;
revoke select (user_id) on public.post_likes from anon, authenticated;

-- ─────────────────────────────────────────────────────────
-- 4) 내 글 / 내가 공감한 글 id 목록 (본인 것만 반환하는 안전한 함수)
-- ─────────────────────────────────────────────────────────
create or replace function public.my_post_ids()
returns setof bigint
language sql
security definer
set search_path = public
as $$
  select id from public.posts where user_id = auth.uid();
$$;

create or replace function public.my_liked_post_ids()
returns setof bigint
language sql
security definer
set search_path = public
as $$
  select post_id from public.post_likes where user_id = auth.uid();
$$;

revoke all on function public.my_post_ids()       from anon;
revoke all on function public.my_liked_post_ids() from anon;
grant execute on function public.my_post_ids()       to authenticated;
grant execute on function public.my_liked_post_ids() to authenticated;

-- ─────────────────────────────────────────────────────────
-- 확인용: 아래를 실행하면 권한 오류가 나야 정상이에요 (익명성 보호 성공)
--   select user_id from public.posts limit 1;
-- ─────────────────────────────────────────────────────────
