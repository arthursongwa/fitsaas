-- FitSaaS : fonctions de ton Excel de surcharge progressive (à exécuter après p0.sql, relançable sans risque)
alter table profiles add column if not exists program_start date;
alter table workouts add column if not exists notes text;

create table if not exists exercises (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  muscle_group text default 'Autre',
  target_sets int not null default 3,
  rep_min int not null default 6,
  rep_max int not null default 10,
  increment numeric(5,2) not null default 2.5,
  unique (user_id, name)
);
alter table exercises enable row level security;
drop policy if exists "own ex" on exercises;
create policy "own ex" on exercises for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
