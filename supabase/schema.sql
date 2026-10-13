-- Para Buch!: schemat bazy w Supabase
-- Wklej całość w panelu: SQL Editor -> New query -> Run. Skrypt można uruchamiać wielokrotnie;
-- na bazie z poprzedniej wersji (wyniki z nickiem) sam przeprowadza migrację.
-- Wymaga w Authentication -> Sign In / Providers:
--   * włączonego „Allow anonymous sign-ins” (gra jako gość),
--   * wyłączonego „Confirm email” (konta z loginem nie mają prawdziwego adresu e-mail).

-- Profil gracza: login widoczny w rankingu. Tworzy go wyzwalacz przy rejestracji.
create table if not exists public.profiles (
  id         uuid primary key references auth.users on delete cascade,
  -- login trzymamy małymi literami, więc unikalność nie zależy od wielkości liter
  login      text not null unique check (login ~ '^[a-z0-9_.-]{3,20}$'),
  created_at timestamptz not null default now()
);

-- Przerwana partia: jedna na gracza (gościa albo konto)
create table if not exists public.games (
  user_id    uuid primary key default auth.uid() references auth.users on delete cascade,
  state      jsonb not null,
  updated_at timestamptz not null default now()
);

-- Tabela wyników: wspólny ranking graczy z kontem
create table if not exists public.scores (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  -- 15 par to minimum 15 ruchów; górny limit odcina oczywiste śmieci
  moves      integer not null check (moves between 15 and 500),
  created_at timestamptz not null default now()
);

-- Migracja z wersji z nickiem: tamte wpisy nie miały kont, więc nie da się ich przypisać do loginów
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'scores' and column_name = 'nick') then
    delete from public.scores;
    alter table public.scores drop column nick;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'scores_user_profile_fkey') then
    alter table public.scores
      add constraint scores_user_profile_fkey foreign key (user_id) references public.profiles (id) on delete cascade;
  end if;
end $$;

create index if not exists scores_ranking_idx on public.scores (moves, created_at);
create index if not exists scores_user_idx on public.scores (user_id);

-- Profil powstaje razem z kontem; login przychodzi w metadanych rejestracji.
-- Błędny login (np. za krótki) przerywa rejestrację, więc nie zostaje konto bez profilu.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not new.is_anonymous and new.raw_user_meta_data ? 'login' then
    insert into public.profiles (id, login) values (new.id, new.raw_user_meta_data ->> 'login');
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.games    enable row level security;
alter table public.scores   enable row level security;

-- Loginy są publiczne (widać je w rankingu); profil zakłada tylko wyzwalacz, login się nie zmienia
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles
  for select to anon, authenticated using (true);

-- Każdy gracz widzi i zmienia tylko swoją partię
drop policy if exists "games_select_own" on public.games;
create policy "games_select_own" on public.games
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "games_insert_own" on public.games;
create policy "games_insert_own" on public.games
  for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists "games_update_own" on public.games;
create policy "games_update_own" on public.games
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "games_delete_own" on public.games;
create policy "games_delete_own" on public.games
  for delete to authenticated using (user_id = (select auth.uid()));

-- Ranking czyta każdy; wynik dopisuje tylko gracz z profilem (nie gość) i tylko jako siebie
drop policy if exists "scores_select_all" on public.scores;
create policy "scores_select_all" on public.scores
  for select to anon, authenticated using (true);

drop policy if exists "scores_insert_own" on public.scores;
create policy "scores_insert_own" on public.scores
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.profiles p where p.id = (select auth.uid()))
  );

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant select, insert, update, delete on public.games to authenticated;
revoke all on public.scores from anon, authenticated;
grant select on public.scores to anon, authenticated;
grant insert on public.scores to authenticated;
