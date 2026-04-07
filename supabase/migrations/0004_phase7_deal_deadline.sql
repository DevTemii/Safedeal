alter table public.deals
  add column if not exists deadline_at timestamptz
    not null
    default (timezone('utc', now()) + interval '7 days');
