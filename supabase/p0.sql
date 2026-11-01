-- FitSaaS P0 : à exécuter UNE fois dans Supabase > SQL Editor (relançable sans risque)

-- PROFILS
create table if not exists profiles (user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade);
alter table profiles
  add column if not exists name text,
  add column if not exists objective text default 'perte',
  add column if not exists goal_weight numeric(5,1) default 75,
  add column if not exists weekly_goal int default 3,
  add column if not exists sex text,
  add column if not exists birth_year int,
  add column if not exists height_cm numeric(5,1),
  add column if not exists weight_kg_ref numeric(5,1),
  add column if not exists activity text default 'modere',
  add column if not exists experience text default 'debutant',
  add column if not exists diet_prefs text,
  add column if not exists allergies text,
  add column if not exists meals_per_day int default 3,
  add column if not exists training_days int default 3,
  add column if not exists session_minutes int default 60,
  add column if not exists place text default 'salle',
  add column if not exists unit text default 'kg',
  add column if not exists kcal_target int,
  add column if not exists protein_g int,
  add column if not exists carbs_g int,
  add column if not exists fat_g int,
  add column if not exists onboarding_step int default 1,
  add column if not exists onboarded boolean default false;
alter table profiles enable row level security;
drop policy if exists "own profile" on profiles;
create policy "own profile" on profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ABONNEMENT : colonnes en plus + fonction de vérification côté base
alter table subscriptions
  add column if not exists stripe_subscription_id text,
  add column if not exists current_period_end timestamptz,
  add column if not exists cancel_at_period_end boolean default false;

create or replace function public.is_pro() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from subscriptions where user_id = auth.uid() and status in ('active','trialing'));
$$;

create table if not exists stripe_events (id text primary key, created_at timestamptz default now());
alter table stripe_events enable row level security;

-- POIDS
alter table weights add column if not exists note text;

-- SEANCES : écriture réservée aux abonnés (vérifié par la base, pas par le navigateur)
alter table workouts add column if not exists day_name text;
drop policy if exists "own rows" on workouts;
drop policy if exists "w read" on workouts;
drop policy if exists "w insert" on workouts;
drop policy if exists "w update" on workouts;
drop policy if exists "w delete" on workouts;
create policy "w read" on workouts for select using (auth.uid() = user_id);
create policy "w insert" on workouts for insert with check (auth.uid() = user_id and is_pro());
create policy "w update" on workouts for update using (auth.uid() = user_id and is_pro()) with check (auth.uid() = user_id and is_pro());
create policy "w delete" on workouts for delete using (auth.uid() = user_id);
create index if not exists workouts_user_date on workouts(user_id, date);

-- PROGRAMMES
create table if not exists programs (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null default 'Mon programme',
  days jsonb not null default '[]',
  active boolean not null default true,
  created_at timestamptz default now()
);
alter table programs enable row level security;
drop policy if exists "own programs" on programs;
create policy "own programs" on programs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ALIMENTS (user_id null = aliments communs, lecture seule)
create table if not exists foods (
  id bigint generated always as identity primary key,
  user_id uuid default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  kcal100 numeric(6,1) not null,
  protein100 numeric(5,1) not null default 0,
  carbs100 numeric(5,1) not null default 0,
  fat100 numeric(5,1) not null default 0,
  created_at timestamptz default now()
);
alter table foods enable row level security;
drop policy if exists "foods read" on foods;
drop policy if exists "foods insert" on foods;
drop policy if exists "foods update" on foods;
drop policy if exists "foods delete" on foods;
create policy "foods read" on foods for select using (user_id is null or auth.uid() = user_id);
create policy "foods insert" on foods for insert with check (auth.uid() = user_id and is_pro());
create policy "foods update" on foods for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "foods delete" on foods for delete using (auth.uid() = user_id);

-- JOURNAL ALIMENTAIRE (valeurs figées à l'ajout : les anciennes entrées ne changent jamais en silence)
create table if not exists food_entries (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date date not null,
  meal text not null check (meal in ('petit-dej','dejeuner','diner','collation')),
  name text not null,
  grams numeric(7,1) not null,
  kcal numeric(7,1) not null,
  protein numeric(6,1) not null default 0,
  carbs numeric(6,1) not null default 0,
  fat numeric(6,1) not null default 0,
  food_id bigint references foods(id) on delete set null,
  created_at timestamptz default now()
);
alter table food_entries enable row level security;
drop policy if exists "fe read" on food_entries;
drop policy if exists "fe insert" on food_entries;
drop policy if exists "fe update" on food_entries;
drop policy if exists "fe delete" on food_entries;
create policy "fe read" on food_entries for select using (auth.uid() = user_id);
create policy "fe insert" on food_entries for insert with check (auth.uid() = user_id and is_pro());
create policy "fe update" on food_entries for update using (auth.uid() = user_id and is_pro()) with check (auth.uid() = user_id and is_pro());
create policy "fe delete" on food_entries for delete using (auth.uid() = user_id);
create index if not exists fe_user_date on food_entries(user_id, date);

-- ALIMENTS COMMUNS (valeurs indicatives pour 100 g)
insert into foods (user_id, name, kcal100, protein100, carbs100, fat100)
select null, v.n, v.k, v.p, v.c, v.f from (values
 ('Blanc de poulet (cuit)',165,31,0,3.6),('Escalope de dinde (cuite)',147,30,0,2),('Steak haché 5% (cuit)',175,28,0,7),
 ('Saumon (cuit)',206,22,0,13),('Thon au naturel (conserve)',116,26,0,1),('Cabillaud (cuit)',105,23,0,1),
 ('Crevettes (cuites)',99,24,0,0.3),('Jambon blanc',107,18,1,3),('Œuf entier',143,12.6,0.7,9.5),('Blanc d''œuf',52,11,0.7,0.2),
 ('Riz blanc (cuit)',130,2.7,28,0.3),('Riz blanc (cru)',360,7,79,0.6),('Pâtes (cuites)',131,5,25,1.1),('Pâtes (crues)',357,12.5,72,1.5),
 ('Semoule (cuite)',112,3.8,23,0.2),('Quinoa (cuit)',120,4.4,21,1.9),('Pomme de terre (cuite)',87,1.9,20,0.1),('Patate douce (cuite)',90,2,21,0.1),
 ('Flocons d''avoine',372,13.5,60,7),('Pain complet',250,10,45,3),('Baguette',275,9,56,1),
 ('Lait demi-écrémé',46,3.3,4.8,1.6),('Yaourt nature',55,4,6,1.5),('Skyr nature',63,11,4,0.2),('Fromage blanc 0%',45,8,4,0.2),
 ('Whey (poudre)',390,78,7,6),('Emmental',380,28,0.4,29),('Mozzarella',280,22,2,22),
 ('Banane',89,1.1,23,0.3),('Pomme',52,0.3,14,0.2),('Orange',47,0.9,12,0.1),('Brocoli (cuit)',35,2.4,7,0.4),
 ('Haricots verts (cuits)',31,1.8,7,0.2),('Carotte',41,0.9,10,0.2),('Tomate',18,0.9,3.9,0.2),('Salade verte',15,1.4,2.9,0.2),
 ('Avocat',160,2,9,15),('Huile d''olive',884,0,0,100),('Beurre',717,0.9,0.1,81),('Beurre de cacahuète',588,25,20,50),('Amandes',579,21,22,50),
 ('Lentilles (cuites)',116,9,20,0.4),('Pois chiches (cuits)',164,8.9,27,2.6),('Haricots rouges (cuits)',127,8.7,23,0.5),
 ('Tofu nature',120,13,2,7),('Chocolat noir 70%',580,8,40,42)
) as v(n,k,p,c,f)
where not exists (select 1 from foods where user_id is null);
