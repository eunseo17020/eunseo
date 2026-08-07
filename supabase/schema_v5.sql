-- moodi · v5 보안 마이그레이션 (v4 내용 포함 — 이것 하나만 실행하면 돼요)
-- Supabase 대시보드 → SQL Editor 에 전체를 붙여넣고 "Run"
-- "Potential issue detected" 경고가 떠도 Run query 눌러도 됩니다.
-- (기존 정책을 다시 만들기 위한 drop policy 때문이며, 테이블·데이터는 지우지 않아요)
--
-- 하는 일
--  1) 익명 게시판의 작성자(user_id) 를 API 로 조회할 수 없게 차단
--  2) 내 글 / 내 공감 목록은 안전한 서버 함수로만 조회
--  3) 게시판 읽기를 로그인 사용자로 제한
--  4) 글·일기 길이를 서버에서도 제한 (브라우저 제한은 우회 가능하므로)

-- ─────────────────────────────────────────────────────────
-- 1) user_id 기본값: 클라이언트가 안 보내도 서버가 채움
--    (앱은 명시적으로도 보내므로, 실행 전후 모두 정상 동작해요)
-- ─────────────────────────────────────────────────────────
alter table public.posts       alter column user_id set default auth.uid();
alter table public.post_likes  alter column user_id set default auth.uid();

-- ─────────────────────────────────────────────────────────
-- 2) 게시판 읽기: 로그인 사용자만
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
-- 3) ⭐ 핵심: user_id 컬럼을 API 에서 읽지 못하게 차단
--    (RLS 는 "어떤 행"을 볼지만 정하고, "어떤 컬럼"인지는 막지 못해요)
-- ─────────────────────────────────────────────────────────
revoke select (user_id) on public.posts      from anon, authenticated;
revoke select (user_id) on public.post_likes from anon, authenticated;

-- ─────────────────────────────────────────────────────────
-- 4) 내 글 / 내가 공감한 글 (본인 것만 돌려주는 안전한 함수)
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
-- 5) 서버 쪽 길이 제한 (브라우저 maxLength 는 우회 가능하므로)
-- ─────────────────────────────────────────────────────────
alter table public.posts drop constraint if exists posts_content_len;
alter table public.posts add constraint posts_content_len
  check (char_length(content) between 1 and 500);

alter table public.posts drop constraint if exists posts_nickname_len;
alter table public.posts add constraint posts_nickname_len
  check (char_length(nickname) between 1 and 30);

alter table public.diary_entries drop constraint if exists diary_content_len;
alter table public.diary_entries add constraint diary_content_len
  check (char_length(content) between 1 and 1000);

-- ─────────────────────────────────────────────────────────
-- 확인용: 아래를 실행하면 "permission denied" 가 나야 정상이에요 (익명성 보호 성공)
--   select user_id from public.posts limit 1;
-- ─────────────────────────────────────────────────────────
