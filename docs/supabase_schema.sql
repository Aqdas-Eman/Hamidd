-- Optional Supabase / PostgreSQL Schema Reference
-- Run this in your Supabase SQL Editor if deploying externally to Vercel + Supabase

create extension if not exists "pgcrypto";

create table if not exists public.settings (
  id integer primary key default 1,
  husband_name text not null default 'Hamid',
  wife_name text not null default 'Aqdas',
  couple_names text not null default 'Hamid & Aqdas',
  hero_intro text not null,
  first_meet_date char(8) not null default '08042023',
  second_meet_date char(8) not null default '23042023',
  together_since_date timestamptz not null default '2023-04-08T18:00:00Z',
  gate_enabled boolean not null default true,
  gate_title text not null,
  gate_question text not null,
  hints jsonb not null default '[]'::jsonb,
  wrong_messages jsonb not null default '[]'::jsonb,
  extra_hint_after_attempts text not null default '',
  gate1_success_message text not null default '',
  gate2_enabled boolean not null default true,
  gate2_title text not null,
  gate2_question text not null,
  gate2_hints jsonb not null default '[]'::jsonb,
  gate2_wrong_messages jsonb not null default '[]'::jsonb,
  gate2_extra_hint text not null default '',
  gate2_success_message text not null default '',
  music_url text not null default '',
  theme_accent text not null default 'rose-gold',
  final_surprise_title text not null,
  final_letter text not null,
  final_media_url text not null default '',
  final_media_type text not null default 'image',
  visible_pages jsonb not null default '{"welcome":true,"story":true,"promises":true,"gate2":true,"gallery":true,"wishes":true,"surprise":true}'::jsonb,
  page_order jsonb not null default '["gate","welcome","story","promises","gate2","gallery","wishes","surprise"]'::jsonb,
  next_button_labels jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.wishes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  text text not null,
  image_url text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.gallery (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  caption text not null default '',
  album text not null default 'Memories',
  captured_date text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.promises (
  id uuid primary key default gen_random_uuid(),
  icon text not null default '❤️',
  title text not null,
  text text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.timeline (
  id uuid primary key default gen_random_uuid(),
  date_label text not null,
  title text not null,
  description text not null,
  image_url text not null default '',
  is_first_meeting boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Storage bucket for media uploads:
-- insert into storage.buckets (id, name, public) values ('media', 'media', true) on conflict do nothing;
