-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: schedules
create table if not exists schedules (
  id uuid primary key default uuid_generate_v4(),
  day_number integer not null,
  option_type text check (option_type in ('A', 'B')),
  start_time time not null,
  end_time time not null,
  location text not null,
  purpose text,
  remarks text,
  lat float,
  lng float,
  created_at timestamp with time zone default now()
);

-- Table: places_pool
create table if not exists places_pool (
  id uuid primary key default uuid_generate_v4(),
  category text not null,
  sub_category text,
  name text not null,
  naver_map_url text,
  description text,
  created_at timestamp with time zone default now()
);

-- Table: messages
create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  user_name text not null,
  content text not null,
  created_at timestamp with time zone default now()
);

-- Enable Realtime for messages
alter publication supabase_realtime add table messages;
