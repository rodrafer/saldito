'use client';

import { ListRow, Sheet } from '@/components/ui';

/** The three entry points the prototype's FAB opens onto. */
const ACTIONS = [
  {
    icon: '🧾',
    title: 'Cargar un gasto',
    detail: 'Compras, impuestos, mejoras, servicios…',
  },
  {
    icon: '✓',
    title: 'Registrar un pago',
    detail: 'Alguien te transfirió o pagaste una deuda',
  },
  {
    icon: '👋',
    title: 'Recordar un pago',
    detail: 'Aviso in-app o link para WhatsApp/Telegram',
  },
];

/**
 * What the FAB opens. Ported from the prototype as-is.
 *
 * The rows don't go anywhere yet: their destinations are built in phases 4 and
 * 5. The sheet is here because the FAB belongs to the shell and a button that
 * does nothing can't be checked against the prototype — with it, the mobile
 * screenshot and the keyboard pass cover the real thing.
 */
export function ActionsSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="¿Qué querés hacer?"
      description="Las tres formas de empezar algo en el grupo."
    >
      <div className="flex flex-col gap-[8px]">
        {ACTIONS.map((action) => (
          <ListRow
            key={action.title}
            action
            left={<span aria-hidden="true">{action.icon}</span>}
            title={action.title}
            detail={action.detail}
            right={<span aria-hidden="true">→</span>}
            onClick={() => onOpenChange(false)}
          />
        ))}
      </div>
    </Sheet>
  );
}
