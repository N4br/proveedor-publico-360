create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'cliente' check (role in ('admin', 'cliente', 'revisor_lexum')),
  full_name text,
  phone text,
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  razon_social text not null,
  rut text not null,
  nombre_fantasia text,
  rubro text,
  productos_servicios text,
  regiones text[] not null default '{}',
  capacidad_operativa text,
  experiencia_previa text,
  inscrita_registro_proveedores boolean not null default false,
  ha_vendido_estado boolean not null default false,
  monto_aproximado numeric,
  contacto_principal text,
  correo text,
  telefono text,
  observaciones text,
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (rut)
);

create table if not exists public.company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  member_role text not null default 'cliente' check (member_role in ('owner', 'cliente', 'revisor_lexum')),
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, user_id)
);

create table if not exists public.plans (
  id text primary key,
  name text not null,
  billing_type text not null check (billing_type in ('one_time', 'monthly', 'service')),
  launch_price_clp integer,
  regular_price_clp integer,
  limits jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  plan_id text not null references public.plans(id),
  status text not null default 'active',
  started_at timestamptz not null default now(),
  ends_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.document_types (
  id text primary key,
  name text not null,
  category text not null,
  requires_expiration boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  uploaded_by uuid references auth.users(id),
  document_type_id text references public.document_types(id),
  status text not null default 'cargado' check (status in ('cargado', 'faltante', 'vencido', 'incompleto', 'requiere_revision', 'validado')),
  file_name text not null,
  storage_bucket text not null,
  storage_path text not null,
  mime_type text,
  size_bytes bigint,
  uploaded_at timestamptz not null default now(),
  expiration_date date,
  observations text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tenders (
  id uuid primary key default gen_random_uuid(),
  codigo_externo text not null unique,
  nombre text,
  descripcion text,
  estado text,
  codigo_estado integer,
  organismo_comprador text,
  codigo_organismo text,
  region text,
  fecha_cierre timestamptz,
  monto_estimado numeric,
  moneda text,
  raw_payload jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tender_opportunities (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  tender_id uuid not null references public.tenders(id) on delete cascade,
  compatibility_score integer not null default 0,
  preliminary_risk text not null default 'no_identificado',
  recommendation text not null default 'mirar' check (recommendation in ('mirar', 'descartar', 'preparar', 'activar_sala_oferta')),
  reason text,
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, tender_id)
);

create table if not exists public.tender_rooms (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  tender_id uuid not null references public.tenders(id) on delete cascade,
  created_by uuid references auth.users(id),
  status text not null default 'open',
  extraction_status text,
  extraction_notes text,
  recommendation text not null default 'requiere_revision_humana',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tender_attachments (
  id uuid primary key default gen_random_uuid(),
  tender_id uuid not null references public.tenders(id) on delete cascade,
  tender_room_id uuid references public.tender_rooms(id) on delete cascade,
  file_name text not null,
  source_url text,
  storage_bucket text,
  storage_path text,
  mime_type text,
  size_bytes bigint,
  downloaded_at timestamptz,
  status text not null default 'discovered',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tender_analysis (
  id uuid primary key default gen_random_uuid(),
  tender_room_id uuid not null references public.tender_rooms(id) on delete cascade,
  analysis_type text not null default 'sala_oferta',
  status text not null default 'draft',
  summary text,
  result jsonb not null default '{}'::jsonb,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.provider_scores (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  total_score integer not null,
  category text not null,
  traffic_light text not null,
  criteria jsonb not null default '[]'::jsonb,
  gaps jsonb not null default '[]'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  actions jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  tender_room_id uuid references public.tender_rooms(id) on delete cascade,
  report_type text not null,
  status text not null default 'generated',
  storage_bucket text,
  storage_path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  tender_room_id uuid references public.tender_rooms(id) on delete cascade,
  assigned_to uuid references auth.users(id),
  title text not null,
  description text,
  due_at timestamptz,
  status text not null default 'open',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id),
  company_id uuid references public.companies(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  ip inet,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles','companies','company_members','plans','subscriptions','document_types','documents',
    'tenders','tender_opportunities','tender_rooms','tender_attachments','tender_analysis',
    'provider_scores','reports','tasks'
  ]
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin' and p.status = 'active'
  );
$$;

create or replace function public.is_reviewer()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'revisor_lexum') and p.status = 'active'
  );
$$;

create or replace function public.is_company_member(target_company_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.company_members cm
    where cm.company_id = target_company_id
      and cm.user_id = auth.uid()
      and cm.status = 'active'
  );
$$;

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.subscriptions enable row level security;
alter table public.documents enable row level security;
alter table public.tenders enable row level security;
alter table public.tender_opportunities enable row level security;
alter table public.tender_rooms enable row level security;
alter table public.tender_attachments enable row level security;
alter table public.tender_analysis enable row level security;
alter table public.provider_scores enable row level security;
alter table public.reports enable row level security;
alter table public.tasks enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles self or lexum" on public.profiles
for select using (id = auth.uid() or public.is_reviewer());

create policy "profiles self update" on public.profiles
for update using (id = auth.uid() or public.is_admin());

create policy "companies members select" on public.companies
for select using (public.is_company_member(id) or public.is_reviewer());

create policy "companies members update" on public.companies
for update using (public.is_company_member(id) or public.is_reviewer());

create policy "companies authenticated insert" on public.companies
for insert with check (auth.uid() is not null);

create policy "company members visible" on public.company_members
for select using (public.is_company_member(company_id) or public.is_reviewer());

create policy "company members admin insert" on public.company_members
for insert with check (public.is_admin() or user_id = auth.uid());

create policy "company scoped subscriptions" on public.subscriptions
for select using (public.is_company_member(company_id) or public.is_reviewer());

create policy "company scoped documents select" on public.documents
for select using (public.is_company_member(company_id) or public.is_reviewer());

create policy "company scoped documents insert" on public.documents
for insert with check (public.is_company_member(company_id) or public.is_reviewer());

create policy "company scoped documents update" on public.documents
for update using (public.is_company_member(company_id) or public.is_reviewer());

create policy "tenders readable authenticated" on public.tenders
for select using (auth.uid() is not null);

create policy "tenders writable lexum" on public.tenders
for all using (public.is_reviewer()) with check (public.is_reviewer());

create policy "company scoped opportunities" on public.tender_opportunities
for select using (public.is_company_member(company_id) or public.is_reviewer());

create policy "company scoped opportunities write" on public.tender_opportunities
for all using (public.is_company_member(company_id) or public.is_reviewer()) with check (public.is_company_member(company_id) or public.is_reviewer());

create policy "company scoped rooms" on public.tender_rooms
for select using (public.is_company_member(company_id) or public.is_reviewer());

create policy "company scoped rooms write" on public.tender_rooms
for all using (public.is_company_member(company_id) or public.is_reviewer()) with check (public.is_company_member(company_id) or public.is_reviewer());

create policy "attachments through room or reviewer" on public.tender_attachments
for select using (
  public.is_reviewer()
  or exists (
    select 1 from public.tender_rooms tr
    where tr.id = tender_attachments.tender_room_id
      and public.is_company_member(tr.company_id)
  )
);

create policy "analysis through room or reviewer" on public.tender_analysis
for select using (
  public.is_reviewer()
  or exists (
    select 1 from public.tender_rooms tr
    where tr.id = tender_analysis.tender_room_id
      and public.is_company_member(tr.company_id)
  )
);

create policy "company scoped scores" on public.provider_scores
for select using (public.is_company_member(company_id) or public.is_reviewer());

create policy "company scoped reports" on public.reports
for select using (company_id is null or public.is_company_member(company_id) or public.is_reviewer());

create policy "company scoped tasks" on public.tasks
for select using (company_id is null or public.is_company_member(company_id) or public.is_reviewer());

create policy "audit logs lexum only" on public.audit_logs
for select using (public.is_reviewer());

insert into public.plans (id, name, billing_type, launch_price_clp, regular_price_clp, limits)
values
  ('diagnostico', 'Diagnostico Proveedor Publico', 'one_time', 29990, 49990, '{"monthly_opportunities":0,"monthly_tender_analysis":0,"document_vault":false}'::jsonb),
  ('proveedor_preparado', 'Proveedor Preparado', 'monthly', 69990, 89990, '{"monthly_opportunities":5,"monthly_tender_analysis":0,"document_vault":true}'::jsonb),
  ('proveedor_360', 'Proveedor 360', 'monthly', 189990, 249990, '{"monthly_opportunities":10,"monthly_tender_analysis":1,"document_vault":true}'::jsonb),
  ('sala_oferta_express', 'Sala de Oferta Express', 'service', 99990, 99990, '{"scope":"express"}'::jsonb),
  ('sala_oferta_completa', 'Sala de Oferta Completa', 'service', 179990, 179990, '{"scope":"completa"}'::jsonb),
  ('sala_oferta_estrategica', 'Sala de Oferta Estrategica', 'service', 299990, 299990, '{"scope":"estrategica"}'::jsonb)
on conflict (id) do update set
  name = excluded.name,
  billing_type = excluded.billing_type,
  launch_price_clp = excluded.launch_price_clp,
  regular_price_clp = excluded.regular_price_clp,
  limits = excluded.limits,
  updated_at = now();

insert into public.document_types (id, name, category, requires_expiration)
values
  ('constitucion_escritura', 'Constitucion / escritura', 'societario', false),
  ('certificado_vigencia', 'Certificado de vigencia', 'societario', true),
  ('poderes', 'Poderes', 'societario', true),
  ('rut_empresa', 'RUT empresa', 'identidad', false),
  ('antecedentes_tributarios', 'Antecedentes tributarios', 'tributario', true),
  ('certificados_laborales_previsionales', 'Certificados laborales/previsionales', 'laboral', true),
  ('experiencia', 'Experiencia', 'experiencia', false),
  ('ordenes_compra', 'Ordenes de compra', 'experiencia', false),
  ('contratos_ejecutados', 'Contratos ejecutados', 'experiencia', false),
  ('fichas_tecnicas', 'Fichas tecnicas', 'tecnico', false),
  ('cv_equipo', 'CV equipo', 'tecnico', false),
  ('catalogos', 'Catalogos', 'comercial', false),
  ('declaraciones_juradas', 'Declaraciones juradas', 'licitacion', true),
  ('otros', 'Otros', 'otros', false)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  requires_expiration = excluded.requires_expiration,
  updated_at = now();

insert into storage.buckets (id, name, public)
values
  ('company-documents', 'company-documents', false),
  ('tender-documents', 'tender-documents', false)
on conflict (id) do nothing;

create policy "private company documents by folder" on storage.objects
for select using (
  bucket_id = 'company-documents'
  and (
    public.is_reviewer()
    or exists (
      select 1 from public.documents d
      where d.storage_bucket = storage.objects.bucket_id
        and d.storage_path = storage.objects.name
        and public.is_company_member(d.company_id)
    )
  )
);

create policy "private tender documents by room" on storage.objects
for select using (
  bucket_id = 'tender-documents'
  and (
    public.is_reviewer()
    or exists (
      select 1 from public.tender_attachments ta
      join public.tender_rooms tr on tr.id = ta.tender_room_id
      where ta.storage_bucket = storage.objects.bucket_id
        and ta.storage_path = storage.objects.name
        and public.is_company_member(tr.company_id)
    )
  )
);
