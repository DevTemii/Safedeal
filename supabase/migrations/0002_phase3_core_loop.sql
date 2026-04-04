create extension if not exists pgcrypto;

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  last_message_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint conversations_distinct_participants_check
    check (buyer_id <> seller_id),
  constraint conversations_buyer_seller_key
    unique (buyer_id, seller_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint messages_non_empty_body_check
    check (length(btrim(body)) > 0),
  constraint messages_metadata_object_check
    check (jsonb_typeof(metadata) = 'object')
);

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  amount_minor bigint not null,
  settlement_token text not null default 'USDC',
  status text not null default 'draft',
  escrow_status text not null default 'not_started',
  delivery_status text not null default 'pending',
  dispute_status text not null default 'none',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint deals_distinct_participants_check
    check (buyer_id <> seller_id),
  constraint deals_positive_amount_minor_check
    check (amount_minor > 0),
  constraint deals_non_empty_title_check
    check (length(btrim(title)) > 0),
  constraint deals_settlement_token_check
    check (settlement_token = 'USDC'),
  constraint deals_status_check
    check (
      status in (
        'draft',
        'awaiting_funding',
        'funded',
        'delivered',
        'completed',
        'disputed',
        'cancelled',
        'refunded'
      )
    ),
  constraint deals_escrow_status_check
    check (
      escrow_status in (
        'not_started',
        'awaiting_funding',
        'funded',
        'release_pending',
        'released',
        'refund_pending',
        'refunded'
      )
    ),
  constraint deals_delivery_status_check
    check (
      delivery_status in (
        'pending',
        'submitted',
        'confirmed'
      )
    ),
  constraint deals_dispute_status_check
    check (
      dispute_status in (
        'none',
        'open',
        'resolved_buyer',
        'resolved_seller',
        'closed'
      )
    )
);

create table if not exists public.deal_deliveries (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  note text not null,
  metadata jsonb not null default '{}'::jsonb,
  delivered_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint deal_deliveries_note_non_empty_check
    check (length(btrim(note)) > 0),
  constraint deal_deliveries_metadata_object_check
    check (jsonb_typeof(metadata) = 'object'),
  constraint deal_deliveries_one_per_deal_key
    unique (deal_id)
);

create table if not exists public.deal_disputes (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  raised_by uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  details text,
  status text not null default 'open',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint deal_disputes_reason_non_empty_check
    check (length(btrim(reason)) > 0),
  constraint deal_disputes_status_check
    check (
      status in (
        'open',
        'resolved_buyer',
        'resolved_seller',
        'closed'
      )
    ),
  constraint deal_disputes_one_per_deal_key
    unique (deal_id)
);

create index if not exists conversations_buyer_last_message_idx
  on public.conversations (buyer_id, last_message_at desc, created_at desc);

create index if not exists conversations_seller_last_message_idx
  on public.conversations (seller_id, last_message_at desc, created_at desc);

create index if not exists messages_conversation_created_at_idx
  on public.messages (conversation_id, created_at desc);

create index if not exists deals_conversation_created_at_idx
  on public.deals (conversation_id, created_at desc);

create index if not exists deals_buyer_status_created_at_idx
  on public.deals (buyer_id, status, created_at desc);

create index if not exists deals_seller_status_created_at_idx
  on public.deals (seller_id, status, created_at desc);

create index if not exists deal_disputes_deal_created_at_idx
  on public.deal_disputes (deal_id, created_at desc);

create or replace function public.ensure_message_sender_is_participant()
returns trigger
language plpgsql
as $$
declare
  target_conversation public.conversations%rowtype;
begin
  select *
  into target_conversation
  from public.conversations
  where id = new.conversation_id;

  if not found then
    raise exception 'Conversation not found for message.'
      using errcode = '23503';
  end if;

  if new.sender_id not in (target_conversation.buyer_id, target_conversation.seller_id) then
    raise exception 'Message sender must be a conversation participant.'
      using errcode = '23514';
  end if;

  new.body = btrim(new.body);
  return new;
end;
$$;

create or replace function public.touch_conversation_after_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set last_message_at = new.created_at,
      updated_at = timezone('utc', now())
  where id = new.conversation_id;

  return new;
end;
$$;

create or replace function public.ensure_deal_matches_conversation()
returns trigger
language plpgsql
as $$
declare
  target_conversation public.conversations%rowtype;
begin
  select *
  into target_conversation
  from public.conversations
  where id = new.conversation_id;

  if not found then
    raise exception 'Conversation not found for deal.'
      using errcode = '23503';
  end if;

  if new.buyer_id is null then
    new.buyer_id = target_conversation.buyer_id;
  elsif new.buyer_id <> target_conversation.buyer_id then
    raise exception 'Deal buyer must match the conversation buyer.'
      using errcode = '23514';
  end if;

  if new.seller_id is null then
    new.seller_id = target_conversation.seller_id;
  elsif new.seller_id <> target_conversation.seller_id then
    raise exception 'Deal seller must match the conversation seller.'
      using errcode = '23514';
  end if;

  if new.created_by not in (new.buyer_id, new.seller_id) then
    raise exception 'Deal creator must be a conversation participant.'
      using errcode = '23514';
  end if;

  new.title = btrim(new.title);
  new.settlement_token = 'USDC';
  return new;
end;
$$;

create or replace function public.ensure_delivery_belongs_to_seller()
returns trigger
language plpgsql
as $$
declare
  target_deal public.deals%rowtype;
begin
  select *
  into target_deal
  from public.deals
  where id = new.deal_id;

  if not found then
    raise exception 'Deal not found for delivery.'
      using errcode = '23503';
  end if;

  if new.seller_id is null then
    new.seller_id = target_deal.seller_id;
  elsif new.seller_id <> target_deal.seller_id then
    raise exception 'Only the deal seller can create a delivery row.'
      using errcode = '23514';
  end if;

  new.note = btrim(new.note);
  return new;
end;
$$;

create or replace function public.ensure_dispute_raised_by_participant()
returns trigger
language plpgsql
as $$
declare
  target_deal public.deals%rowtype;
begin
  select *
  into target_deal
  from public.deals
  where id = new.deal_id;

  if not found then
    raise exception 'Deal not found for dispute.'
      using errcode = '23503';
  end if;

  if new.raised_by not in (target_deal.buyer_id, target_deal.seller_id) then
    raise exception 'Only a deal participant can raise a dispute.'
      using errcode = '23514';
  end if;

  new.reason = btrim(new.reason);
  if new.details is not null then
    new.details = btrim(new.details);
  end if;

  return new;
end;
$$;

drop trigger if exists conversations_handle_updated_at on public.conversations;
create trigger conversations_handle_updated_at
before update on public.conversations
for each row
execute function public.handle_updated_at();

drop trigger if exists messages_sender_participant_guard on public.messages;
create trigger messages_sender_participant_guard
before insert or update on public.messages
for each row
execute function public.ensure_message_sender_is_participant();

drop trigger if exists messages_touch_conversation_after_insert on public.messages;
create trigger messages_touch_conversation_after_insert
after insert on public.messages
for each row
execute function public.touch_conversation_after_message();

drop trigger if exists deals_match_conversation_guard on public.deals;
create trigger deals_match_conversation_guard
before insert or update on public.deals
for each row
execute function public.ensure_deal_matches_conversation();

drop trigger if exists deals_handle_updated_at on public.deals;
create trigger deals_handle_updated_at
before update on public.deals
for each row
execute function public.handle_updated_at();

drop trigger if exists deal_deliveries_seller_guard on public.deal_deliveries;
create trigger deal_deliveries_seller_guard
before insert or update on public.deal_deliveries
for each row
execute function public.ensure_delivery_belongs_to_seller();

drop trigger if exists deal_deliveries_handle_updated_at on public.deal_deliveries;
create trigger deal_deliveries_handle_updated_at
before update on public.deal_deliveries
for each row
execute function public.handle_updated_at();

drop trigger if exists deal_disputes_participant_guard on public.deal_disputes;
create trigger deal_disputes_participant_guard
before insert or update on public.deal_disputes
for each row
execute function public.ensure_dispute_raised_by_participant();

drop trigger if exists deal_disputes_handle_updated_at on public.deal_disputes;
create trigger deal_disputes_handle_updated_at
before update on public.deal_disputes
for each row
execute function public.handle_updated_at();

alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.deals enable row level security;
alter table public.deal_deliveries enable row level security;
alter table public.deal_disputes enable row level security;

grant select, insert on public.conversations to authenticated;
grant select, insert on public.messages to authenticated;
grant select, insert on public.deals to authenticated;
grant select, insert on public.deal_deliveries to authenticated;
grant select, insert on public.deal_disputes to authenticated;

drop policy if exists "conversations_select_participants" on public.conversations;
create policy "conversations_select_participants"
on public.conversations
for select
to authenticated
using (auth.uid() in (buyer_id, seller_id));

drop policy if exists "conversations_insert_participants" on public.conversations;
create policy "conversations_insert_participants"
on public.conversations
for insert
to authenticated
with check (
  auth.uid() in (buyer_id, seller_id)
  and buyer_id <> seller_id
);

drop policy if exists "messages_select_participants" on public.messages;
create policy "messages_select_participants"
on public.messages
for select
to authenticated
using (
  exists (
    select 1
    from public.conversations
    where conversations.id = messages.conversation_id
      and auth.uid() in (conversations.buyer_id, conversations.seller_id)
  )
);

drop policy if exists "messages_insert_participants" on public.messages;
create policy "messages_insert_participants"
on public.messages
for insert
to authenticated
with check (
  auth.uid() = sender_id
  and exists (
    select 1
    from public.conversations
    where conversations.id = messages.conversation_id
      and auth.uid() in (conversations.buyer_id, conversations.seller_id)
  )
);

drop policy if exists "deals_select_participants" on public.deals;
create policy "deals_select_participants"
on public.deals
for select
to authenticated
using (auth.uid() in (buyer_id, seller_id));

drop policy if exists "deals_insert_participants" on public.deals;
create policy "deals_insert_participants"
on public.deals
for insert
to authenticated
with check (
  auth.uid() = created_by
  and auth.uid() in (buyer_id, seller_id)
);

drop policy if exists "deal_deliveries_select_participants" on public.deal_deliveries;
create policy "deal_deliveries_select_participants"
on public.deal_deliveries
for select
to authenticated
using (
  exists (
    select 1
    from public.deals
    where deals.id = deal_deliveries.deal_id
      and auth.uid() in (deals.buyer_id, deals.seller_id)
  )
);

drop policy if exists "deal_deliveries_insert_seller_only" on public.deal_deliveries;
create policy "deal_deliveries_insert_seller_only"
on public.deal_deliveries
for insert
to authenticated
with check (
  auth.uid() = seller_id
  and exists (
    select 1
    from public.deals
    where deals.id = deal_deliveries.deal_id
      and deals.seller_id = auth.uid()
  )
);

drop policy if exists "deal_disputes_select_participants" on public.deal_disputes;
create policy "deal_disputes_select_participants"
on public.deal_disputes
for select
to authenticated
using (
  exists (
    select 1
    from public.deals
    where deals.id = deal_disputes.deal_id
      and auth.uid() in (deals.buyer_id, deals.seller_id)
  )
);

drop policy if exists "deal_disputes_insert_participants" on public.deal_disputes;
create policy "deal_disputes_insert_participants"
on public.deal_disputes
for insert
to authenticated
with check (
  auth.uid() = raised_by
  and exists (
    select 1
    from public.deals
    where deals.id = deal_disputes.deal_id
      and auth.uid() in (deals.buyer_id, deals.seller_id)
  )
);
