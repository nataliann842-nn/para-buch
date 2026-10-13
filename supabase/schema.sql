-- Para Buch!: schemat bazy w Supabase
-- Wklej całość w panelu: SQL Editor -> New query -> Run.
-- Wymaga włączonego anonimowego logowania (Authentication -> Sign In / Providers -> Allow anonymous sign-ins).

-- Przerwana partia: jedna na gracza (anonimowa sesja Supabase)
create table if not exists public.games (
  user_id    uuid primary key default auth.uid() references auth.users on delete cascade,
  state      jsonb not null,
  updated_at timestamptz not null default now()
);

-- Tabela wyników: wspólny ranking wszystkich graczy
create table if not exists public.scores (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  nick       text not null check (char_length(btrim(nick)) between 1 and 20),
  -- 15 par to minimum 15 ruchów; górny limit odcina oczywiste śmieci
  moves      integer not null check (moves between 15 and 500),
  created_at timestamptz not null default now()
);

create index if not exists scores_ranking_idx on public.scores (moves, created_at);

alter table public.games  enable row level security;
alter table public.scores enable row level security;

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

-- Ranking czyta każdy, dopisuje tylko zalogowany (także anonimowo) i tylko jako siebie
drop policy if exists "scores_select_all" on public.scores;
create policy "scores_select_all" on public.scores
  for select to anon, authenticated using (true);

drop policy if exists "scores_insert_own" on public.scores;
create policy "scores_insert_own" on public.scores
  for insert to authenticated with check (user_id = (select auth.uid()));

grant select, insert, update, delete on public.games to authenticated;
grant select on public.scores to anon, authenticated;
grant insert on public.scores to authenticated;
