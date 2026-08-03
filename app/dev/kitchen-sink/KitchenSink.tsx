'use client';

import { useState, type ReactNode } from 'react';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CategoryIcon,
  Chip,
  ChipGroup,
  ChipGroupItem,
  ChipRow,
  DonutChart,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  FilterMenu,
  FilterMenuContent,
  FilterMenuItem,
  FilterMenuSearch,
  FilterMenuTrigger,
  Input,
  ListRow,
  Modal,
  ModalClose,
  SegmentedControl,
  Sheet,
  SheetClose,
  Sidebar,
  Toast,
} from '@/components/ui';
import { DesktopGrid, NAV_ITEMS } from '@/components/layout';
import { formatAmount, formatBalance } from '@/lib/format';

const CATEGORIES = [
  { id: 'mejoras', icon: '🔧', name: 'Mejoras' },
  { id: 'impuestos', icon: '🧾', name: 'Impuestos' },
  { id: 'servicios', icon: '💡', name: 'Servicios' },
  { id: 'super', icon: '🛒', name: 'Súper' },
];

const DONUT_SEGMENTS = [
  { name: 'Mejoras', color: 'var(--sd-gold)', pct: 42, amount: formatAmount(77364) },
  { name: 'Impuestos', color: 'var(--sd-negative)', pct: 26, amount: formatAmount(47840) },
  { name: 'Servicios', color: 'var(--sd-positive)', pct: 18, amount: formatAmount(33156) },
  { name: 'Súper', color: 'var(--sd-gold-deep)', pct: 14, amount: formatAmount(25788) },
];

function Section({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <section className="sd-stack">
      <div className="flex items-baseline gap-[14px] border-b border-border pb-[14px]">
        <span className="text-label font-bold text-gold">{n}</span>
        <h2 className="text-title-lg font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Grid({ children, min = '330px' }: { children: ReactNode; min?: string }) {
  return (
    <div
      className="grid gap-[20px] items-start"
      style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${min}, 1fr))` }}
    >
      {children}
    </div>
  );
}

function Demo({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <Card className="flex flex-col gap-[16px] !p-[20px]">
      <div>
        <div className="text-subtitle font-semibold">{title}</div>
        {note && <p className="mt-1 text-label leading-relaxed text-text-muted">{note}</p>}
      </div>
      {children}
    </Card>
  );
}

export function KitchenSink() {
  const [segment, setSegment] = useState<'persona' | 'plan'>('persona');
  const [chipOn, setChipOn] = useState(true);
  const [chipGroup, setChipGroup] = useState<string[]>(['mejoras']);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string | null>('impuestos');
  const [search, setSearch] = useState('');
  const [onlyMine, setOnlyMine] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const filtered = CATEGORIES.filter((c) =>
    c.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <main className="sd-content">
      <div
        className="sd-stack"
        style={{ gap: 'var(--sd-sp-16)', maxWidth: 1180, margin: '0 auto' }}
      >
        <header className="sd-stack" style={{ gap: 'var(--sd-sp-4)' }}>
          <div className="text-label font-semibold uppercase tracking-wide text-text-muted">
            Kitchen sink · development only
          </div>
          <h1 className="text-display font-semibold tracking-heading">Primitives</h1>
          <p className="max-w-[62ch] text-body-lg leading-relaxed text-text-secondary">
            To compare against <code>Sistema de diseño.dc.html</code>, section by section. The rail
            and the bottom bar are not here: they get verified in the app itself, which is where
            they live. The bar only appears below 900px.
          </p>
        </header>

        <Section n="01" title="Surfaces">
          <Grid min="230px">
            <Card>
              <div className="text-body-lg font-semibold">Standard card</div>
              <div className="mt-1 font-mono text-caption text-text-muted">--sd-surface-grad</div>
            </Card>
            <Card tone="elevated">
              <div className="text-body-lg font-semibold">Elevated</div>
              <div className="mt-1 font-mono text-caption text-text-muted">
                modals · sheets · menus
              </div>
            </Card>
            <Card tone="gold">
              <div className="text-body-lg font-semibold text-gold">Gold</div>
              <div className="mt-1 font-mono text-caption" style={{ color: 'var(--sd-gold-text)' }}>
                selected · action hover
              </div>
            </Card>
            <Card tone="pink">
              <div className="text-body-lg font-semibold text-negative">Pink</div>
              <div className="mt-1 font-mono text-caption text-text-muted">debtor · soft alert</div>
            </Card>
          </Grid>
        </Section>

        <Section n="02" title="Typography">
          <Card flat>
            {(
              [
                ['display-lg · 48/600', 'text-display-lg', formatAmount(184200)],
                ['display · 40/600', 'text-display', formatAmount(32400)],
                ['titulo-lg · 24/600', 'text-title-lg', 'Deudas del grupo'],
                ['titulo · 19/600', 'text-title', 'Gastos'],
                ['subtitulo · 15/600', 'text-subtitle', '¿Qué querés hacer?'],
                ['body-lg · 14/600', 'text-body-lg', 'Ferretería — canilla cocina'],
                ['body · 13/600', 'text-body', 'Registrar un pago'],
                ['label · 12/600', 'text-label', 'Pagó Rocío · hace 2 días'],
                ['caption · 11.5/700', 'text-caption', formatBalance(12400)],
              ] as const
            ).map(([spec, cls, sample]) => (
              <div
                key={spec}
                className="flex items-baseline gap-[24px] border-b border-border px-[22px] py-[16px] last:border-b-0"
              >
                <span className="w-[150px] flex-none font-mono text-caption text-text-muted">
                  {spec}
                </span>
                <span className={`${cls} font-semibold tracking-heading`}>{sample}</span>
              </div>
            ))}
          </Card>
        </Section>

        <Section n="03" title="Components">
          <Grid>
            <Demo title="Buttons" note="One primary per view. Hover: +8% brightness and −1px.">
              <div className="flex flex-wrap items-center gap-[10px]">
                <Button>Guardar gasto</Button>
                <Button variant="secondary">Cancelar</Button>
                <Button variant="ghost">Ver todo</Button>
                <Button variant="danger">Eliminar</Button>
              </div>
              <div className="flex flex-wrap items-center gap-[10px]">
                <Button size="sm">Confirmar</Button>
                <Button size="sm" variant="secondary">
                  Deshacer
                </Button>
                <Button disabled>Disabled</Button>
              </div>
              <Button block variant="secondary">
                Block
              </Button>
            </Demo>

            <Demo
              title="Chips and segmented"
              note="The row never wraps: on mobile it stays a single line with horizontal scroll."
            >
              <ChipRow>
                <Chip pressed={chipOn} onPressedChange={setChipOn}>
                  Todos
                </Chip>
                <Chip>Categoría</Chip>
                <Chip>Pagó</Chip>
                <Chip disabled>Moneda</Chip>
              </ChipRow>
              <ChipGroup value={chipGroup} onValueChange={setChipGroup} label="Categorías">
                {CATEGORIES.map((c) => (
                  <ChipGroupItem key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </ChipGroupItem>
                ))}
              </ChipGroup>
              <SegmentedControl
                label="Vista de deudas"
                value={segment}
                onChange={setSegment}
                options={[
                  { value: 'persona', label: 'Por persona' },
                  { value: 'plan', label: 'Plan simplificado' },
                ]}
                className="w-[300px] max-w-full"
              />
            </Demo>

            <Demo
              title="List rows"
              note="Minimum height 44px. The action variant turns full gold and shifts 3px."
            >
              <Card flat style={{ background: 'var(--sd-surface-input)' }}>
                <ListRow
                  left={<CategoryIcon icon="🔧" />}
                  title="Ferretería — canilla"
                  detail="Pagó Rocío · hace 2 días"
                  right={<span className="text-body-lg font-bold">{formatAmount(32400)}</span>}
                  onClick={() => setToast('Fila clicada')}
                />
                <ListRow
                  left={<Avatar name="Agustín" />}
                  title="Agustín"
                  detail="3 gastos este mes"
                  right={<Badge tone="positive">{formatBalance(12400)}</Badge>}
                  onClick={() => setToast('Fila clicada')}
                />
                <ListRow
                  left={<Avatar name="Rocío" />}
                  title="Rocío"
                  detail="Row with no onClick — not a button"
                  right={<Badge tone="negative">{formatBalance(-8200)}</Badge>}
                />
              </Card>
              <ListRow
                action
                left={<span aria-hidden="true">💸</span>}
                title="Registrar un pago"
                detail="Action variant — hover it"
                right={<span aria-hidden="true">→</span>}
                onClick={() => setToast('Pago registrado')}
              />
            </Demo>

            <Demo
              title="Fields and menus"
              note="Focus is marked with the gold border alone. Menus anchor to the trigger, not to the row."
            >
              <Input label="Descripción" defaultValue="Ferretería — canilla cocina" />

              <div className="flex flex-wrap gap-[10px]">
                <FilterMenu open={filterOpen} onOpenChange={setFilterOpen}>
                  <FilterMenuTrigger>
                    <Chip pressed={!!filterCategory}>
                      {filterCategory
                        ? CATEGORIES.find((c) => c.id === filterCategory)?.name
                        : 'Categoría'}{' '}
                      ▾
                    </Chip>
                  </FilterMenuTrigger>
                  <FilterMenuContent label="Filtrar por categoría">
                    <FilterMenuSearch
                      placeholder="Buscar categoría…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    {filtered.map((c) => (
                      <FilterMenuItem
                        key={c.id}
                        selected={filterCategory === c.id}
                        onSelect={() => {
                          setFilterCategory(filterCategory === c.id ? null : c.id);
                          setFilterOpen(false);
                        }}
                      >
                        <span>
                          {c.icon} {c.name}
                        </span>
                      </FilterMenuItem>
                    ))}
                    {filtered.length === 0 && (
                      <div className="px-[14px] py-[10px] text-body text-text-muted">
                        Sin resultados
                      </div>
                    )}
                  </FilterMenuContent>
                </FilterMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button size="sm" variant="secondary">
                      Acciones ▾
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent width={240}>
                    <DropdownMenuItem onSelect={() => setToast('Gasto editado')}>
                      Editar gasto
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setToast('Pago recordado')}>
                      Recordar pago
                    </DropdownMenuItem>
                    <DropdownMenuCheckboxItem checked={onlyMine} onCheckedChange={setOnlyMine}>
                      Sólo los míos
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Demo>

            <Demo title="Avatars and badges" note="Initial on a gold surface. Categories = emoji.">
              <div className="flex flex-wrap items-center gap-[12px]">
                <Avatar name="Rodrigo" size="sm" />
                <Avatar name="Agustín" />
                <Avatar name="Rocío" size="lg" />
                {CATEGORIES.map((c) => (
                  <CategoryIcon key={c.id} icon={c.icon} />
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-[10px]">
                <Badge tone="positive">{formatBalance(12400)}</Badge>
                <Badge tone="negative">{formatBalance(-8200)}</Badge>
                <Badge>Borrador</Badge>
              </div>
            </Demo>

            <Demo
              title="Overlays"
              note="Escape closes, focus is trapped inside and returns to the trigger on exit."
            >
              <div className="flex flex-wrap gap-[10px]">
                <Button variant="secondary" onClick={() => setSheetOpen(true)}>
                  Abrir sheet
                </Button>
                <Button variant="secondary" onClick={() => setModalOpen(true)}>
                  Abrir modal
                </Button>
                <Button variant="secondary" onClick={() => setToast('Gasto guardado')}>
                  Mostrar toast
                </Button>
              </div>
            </Demo>
          </Grid>
        </Section>

        <Section n="04" title="Charts">
          <Demo
            title="Donut"
            note="Separated segments with rounded ends. On hover the segment thickens, the rest dim and the tooltip appears."
          >
            <div className="flex flex-wrap items-center gap-[22px]">
              <DonutChart
                segments={DONUT_SEGMENTS}
                size={110}
                period="Julio 2026"
                center={
                  <div>
                    <div className="text-body-lg font-bold">$184k</div>
                    <div className="text-micro text-text-muted">total</div>
                  </div>
                }
              />
              <DonutChart segments={DONUT_SEGMENTS} size={72} period="Julio 2026 · filtrado" />
              <ul className="flex w-[220px] min-w-[170px] flex-col gap-[7px]">
                {DONUT_SEGMENTS.map((s) => (
                  <li key={s.name} className="flex justify-between text-caption">
                    <span className="flex items-center gap-[7px]">
                      <span
                        className="size-[8px] flex-none rounded-full"
                        style={{ background: s.color }}
                      />
                      {s.name}
                    </span>
                    <span className="text-text-muted">{s.pct}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </Demo>
        </Section>

        <Section n="05" title="Layout">
          <Demo
            title="Side rail"
            note="64px collapsed, 212px on hover or on tabbing into it. It overlaps the content inside a fixed 76px gap. Only visible from 900px up."
          >
            {/* `flex` is not decoration: the rail is absolutely positioned against
                its 76px gap, and that gap only gets a height by being stretched as
                a flex child — which is what the shell does to it. */}
            <div className="relative flex h-[260px] rounded-xl border border-border bg-app p-[16px]">
              <Sidebar items={NAV_ITEMS} activeHref="/" />
            </div>
          </Demo>

          <Demo
            title="Firm 1fr / 300px grid"
            note="Every desktop screen uses it, even when the right column is empty."
          >
            <DesktopGrid
              aside={
                <Card tone="gold">
                  <div className="text-body font-semibold text-gold">300px column</div>
                </Card>
              }
            >
              <Card>
                <div className="text-body font-semibold">Main column · 1fr</div>
              </Card>
            </DesktopGrid>
          </Demo>
        </Section>
      </div>

      <Sheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title="¿Qué querés hacer?"
        description="Acciones disponibles para este grupo."
      >
        <div className="flex flex-col gap-[8px]">
          <ListRow
            action
            left={<span aria-hidden="true">🧾</span>}
            title="Cargar un gasto"
            detail="Compras, impuestos, mejoras, servicios…"
            right={<span aria-hidden="true">→</span>}
            onClick={() => setSheetOpen(false)}
          />
          <ListRow
            action
            left={<span aria-hidden="true">✓</span>}
            title="Registrar un pago"
            detail="Alguien te transfirió o pagaste una deuda"
            right={<span aria-hidden="true">→</span>}
            onClick={() => setSheetOpen(false)}
          />
          <SheetClose>
            <Button block variant="ghost">
              Cerrar
            </Button>
          </SheetClose>
        </div>
      </Sheet>

      <Modal open={modalOpen} onOpenChange={setModalOpen} title="Registrar un pago">
        <div className="flex flex-col gap-[14px]">
          <Input label="Monto" inputMode="numeric" placeholder="0" />
          <Input label="Nota" placeholder="Opcional" />
          <div className="flex justify-end gap-[10px]">
            <ModalClose>
              <Button variant="secondary">Cancelar</Button>
            </ModalClose>
            <Button
              onClick={() => {
                setModalOpen(false);
                setToast('Pago registrado');
              }}
            >
              Guardar
            </Button>
          </div>
        </div>
      </Modal>

      <Toast message={toast} icon="✓" onClose={() => setToast(null)} />
    </main>
  );
}
