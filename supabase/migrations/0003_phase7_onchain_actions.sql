alter table public.deals
  add column if not exists contract_deal_id bigint,
  add column if not exists tx_create_hash text,
  add column if not exists tx_fund_hash text,
  add column if not exists tx_deliver_hash text,
  add column if not exists tx_release_hash text;

update public.deals
set status = 'funding_pending'
where status = 'awaiting_funding';

update public.deals
set escrow_status = 'funding_pending'
where escrow_status = 'awaiting_funding';

alter table public.deals
  drop constraint if exists deals_status_check;

alter table public.deals
  add constraint deals_status_check
    check (
      status in (
        'draft',
        'approved',
        'funding_pending',
        'funded',
        'delivered',
        'completed',
        'disputed',
        'cancelled',
        'refunded'
      )
    );

alter table public.deals
  drop constraint if exists deals_escrow_status_check;

alter table public.deals
  add constraint deals_escrow_status_check
    check (
      escrow_status in (
        'not_started',
        'funding_pending',
        'funded',
        'release_pending',
        'released',
        'refund_pending',
        'refunded'
      )
    );

create unique index if not exists deals_contract_deal_id_key
  on public.deals (contract_deal_id)
  where contract_deal_id is not null;
