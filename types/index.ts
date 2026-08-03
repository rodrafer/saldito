/** Saldito domain types.
 *  Aligned with ESPECIFICACION_FUNCIONAL.md (sections 1 and 2). See docs/glossary.md
 *  for the Spanish spec term ↔ English code term mapping.
 *  IMPORTANT: Debt and Balances are DERIVED from expenses. Never persisted. */

export type CurrencyId = 'ARS' | 'USD';

/** Readability alias: algorithm signatures talk about people, not loose strings. */
export type UserId = string;

export const CURRENCIES: readonly CurrencyId[] = ['ARS', 'USD'];

export type PaymentMode = 'equal' | 'amounts';
export type SplitMode = 'equal' | 'percentage' | 'amounts';

export interface User {
  id: string;
  name: string;
  email: string;
  /** Alias or CBU to receive transfers. */
  alias: string;
  paymentApp: string;
  preferredCurrency: CurrencyId;
  cards: Card[];
}

export interface Card {
  id: string;
  userId: string;
  name: string;
  /** Format MM/YY. */
  expiry: string;
}

export interface Member {
  userId: string;
  groupId: string;
  role: 'admin' | 'member';
  /** An inactive member stays in history but not in new selectors. */
  active: boolean;
  deactivatedAt?: string;
}

export interface Group {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
}

export interface Category {
  id: string;
  groupId: string | null;
  name: string;
  /** Emoji. The app doesn't use an icon library. */
  icon: string;
  color: string;
  background: string;
}

export interface ExpenseEdit {
  date: string;
  authorId: string;
  changes: Record<string, { before: unknown; after: unknown }>;
}

export interface Expense {
  id: string;
  groupId: string;
  title: string;
  categoryId: string;
  currency: CurrencyId;
  /** Positive integer, no cents. */
  amount: number;
  date: string;

  /** Who put in the money. The sum of contributions is exactly `amount`. */
  paymentMode: PaymentMode;
  contributions: Record<string, number>;

  /** Among whom it's split. The sum of the split is exactly `amount`. */
  splitMode: SplitMode;
  participants: string[];
  split?: Record<string, number>;

  /** Logical deletion: an expense is never deleted. */
  voided: boolean;
  voidedBy?: string;
  voidedAt?: string;
  editedAt?: string;
  history: ExpenseEdit[];

  /** If it was born from a recurrence and hasn't been confirmed yet, it's a draft. */
  recurrenceId?: string;
  draft?: boolean;
  /** Payers who already confirmed they put in what was declared. */
  confirmedBy?: string[];
}

export interface Recurrence {
  id: string;
  groupId: string;
  title: string;
  categoryId: string;
  currency: CurrencyId;
  /** Reference from the previous month. Never applied without human confirmation. */
  suggestedAmount?: number;
  /** 1–28. No last-day-of-month logic. */
  dayOfMonth: number;
  paymentMode: PaymentMode;
  contributions: Record<string, number>;
  splitMode: SplitMode;
  participants: string[];
  split?: Record<string, number>;
  active: boolean;
  createdBy: string;
  lastGeneratedAt?: string;
}

export interface Payment {
  id: string;
  groupId: string;
  debtorId: string;
  creditorId: string;
  currency: CurrencyId;
  amount: number;
  date: string;
  recordedBy: string;
  /** false when the debtor declared it and the creditor hasn't confirmed it yet. */
  confirmed: boolean;
}

export interface Transfer {
  id: string;
  debtorId: string;
  creditorId: string;
  currency: CurrencyId;
  amount: number;
  done: boolean;
  doneBy?: string;
  doneAt?: string;
}

export type SettlementPlanStatus = 'idle' | 'running' | 'completed';

export interface SettlementPlan {
  id: string;
  groupId: string;
  status: SettlementPlanStatus;
  /** Frozen when started. Can mix currencies. */
  transfers: Transfer[];
  expenseIds: string[];
  startedBy: string;
  startedAt: string;
}

export type NotificationType =
  | 'newExpense'
  | 'payerAssigned'
  | 'expenseEdited'
  | 'expenseVoided'
  | 'paymentDeclared'
  | 'paymentConfirmed'
  | 'recurrencePending'
  | 'planStarted'
  | 'transferMarked'
  | 'planCancelled'
  | 'planCompleted'
  | 'reminder'
  | 'group';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  actorId?: string;
  text: string;
  entityId?: string;
  date: string;
  read: boolean;
}

/** Net debt between two people, in a currency. Derived, never persisted.
 *  When an expense had several payers, each participant owes each payer in
 *  proportion to what that payer put in (see spec 1.4 and 2.3). */
export interface Debt {
  debtorId: string;
  creditorId: string;
  currency: CurrencyId;
  amount: number;
  /** Expenses that originated this debt, to show its detail. */
  expenseIds: string[];
}

/** Net balance per member, split by currency. Derived, never persisted.
 *  Invariants: for each currency the sum of all balances in the group is zero,
 *  and each person's balance matches the sum of their debts by pair. */
export type Balances = Record<CurrencyId, Record<string, number>>;

/** There's no recurrences screen: they're managed inline within Group. */
export type Screen =
  | 'home'
  | 'expenses'
  | 'expenseDetail'
  | 'newExpense'
  | 'editExpense'
  | 'confirmDraft'
  | 'debts'
  | 'group'
  | 'profile'
  | 'notifications'
  | 'categories';
