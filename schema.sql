-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: profiles
create table if not exists profiles (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  image_url text,
  password text default '0000',
  created_at timestamp with time zone default now()
);

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
  address text,
  created_at timestamp with time zone default now(),
  profile_id uuid references profiles(id)
);

-- Table: places_pool
create table if not exists places_pool (
  id uuid primary key default uuid_generate_v4(),
  category text not null,
  sub_category text,
  name text not null,
  naver_map_url text,
  address text,
  description text,
  created_at timestamp with time zone default now(),
  profile_id uuid references profiles(id)
);

-- Table: messages
create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  user_name text not null,
  content text not null,
  created_at timestamp with time zone default now(),
  profile_id uuid references profiles(id)
);

-- Enable Realtime for messages
alter publication supabase_realtime add table messages;
