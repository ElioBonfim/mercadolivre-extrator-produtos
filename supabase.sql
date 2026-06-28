-- Setup do Supabase para a extensão "Mercado Livre - Extrator de Produtos"
-- Rode no SQL Editor do Supabase (ou via psql) UMA vez.

create table if not exists public.ml_produtos (
  pk             bigint generated always as identity primary key,
  ml_id          text,
  titulo         text not null,
  preco          numeric,
  preco_original numeric,
  desconto       text,
  parcelas       text,
  frete          text,
  full_ml        boolean,
  categoria      text,
  link           text,
  origem         text,
  capturado_em   timestamptz not null default now()
);

create index if not exists ml_produtos_capturado_em_idx
  on public.ml_produtos (capturado_em desc);

-- RLS: a extensão usa a PUBLISHABLE key (papel anon). Liberamos só INSERT.
-- (sem SELECT para anon = os dados não ficam legíveis pela chave pública)
alter table public.ml_produtos enable row level security;

drop policy if exists "anon insert ml_produtos" on public.ml_produtos;
create policy "anon insert ml_produtos"
  on public.ml_produtos for insert
  to anon
  with check (true);

grant usage on schema public to anon;
grant insert on table public.ml_produtos to anon;
