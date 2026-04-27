create table if not exists users (
  id text primary key,
  nickname text not null default '',
  avatar_url text not null default '',
  password_hash text not null default '',
  home_persona_asset_id text,
  bio text not null default '',
  living_city text not null default '',
  hometown text not null default '',
  age text not null default '',
  tags jsonb not null default '[]'::jsonb,
  current_trip_id text,
  is_authorized boolean not null default true,
  created_at bigint not null,
  updated_at bigint not null
);

create unique index if not exists idx_users_nickname_unique on users (nickname);

create table if not exists sessions (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  expires_at bigint not null,
  created_at bigint not null
);

create table if not exists trips (
  id text primary key,
  name text not null default '未命名车次',
  departure_time text not null default '待定',
  password text not null,
  template_id text not null,
  seat_codes jsonb not null default '[]'::jsonb,
  seat_map jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  created_by_user_id text not null,
  created_at bigint not null
);

create table if not exists trip_members (
  trip_id text not null,
  user_id text not null,
  role text not null default 'member',
  joined_at bigint not null,
  primary key (trip_id, user_id)
);

create table if not exists trip_favorites (
  trip_id text not null,
  source_user_id text not null,
  target_user_id text not null,
  created_at bigint not null,
  primary key (trip_id, source_user_id, target_user_id)
);

create table if not exists tool_states (
  trip_id text not null,
  tool_type text not null,
  state_json jsonb not null default '{}'::jsonb,
  updated_at bigint not null,
  primary key (trip_id, tool_type)
);

create index if not exists idx_sessions_user_id on sessions(user_id);
create index if not exists idx_sessions_expires_at on sessions(expires_at);
create index if not exists idx_trip_members_user_id on trip_members(user_id);
create index if not exists idx_trip_favorites_trip_id on trip_favorites(trip_id);
create index if not exists idx_tool_states_trip_id on tool_states(trip_id);
