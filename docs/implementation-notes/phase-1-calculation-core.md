# Phase 1 — Calculation core

**PR:** [#2](https://github.com/rodrafer/saldito/pull/2) · 63 tests · no UI

The algorithms from section 2 of the functional spec, in `features/debts/calculation/`.
Pure TypeScript: doesn't import anything from Next or Supabase, so it runs identically in
tests, on the server when rendering, and on the client for optimistic updates.

---

## ⚠️ The pseudocode in spec section 2.3 breaks its own invariant

**This needs to be flagged to whoever wrote the spec.**

The `debtsOfExpense` algorithm as written in the document violates the equality the same
document calls out as _"the system's best safety net"_: that each person's net balance
matches `paid in − consumed`.

### The case that breaks it

Found by property testing. We wouldn't have thought to write it by hand:

> An expense of **2**. Caro and Dani put in **1 each** and consume it between the two of
> them in equal parts, **1 each**. Neither should end up owing anything.

The pseudocode processes one row at a time:

| Row         | Split among payers | Remainder                           | Own portion discarded | Result              |
| ----------- | ------------------ | ----------------------------------- | --------------------- | ------------------- |
| Caro owes 1 | tied 0.5 / 0.5     | goes to the first in list: **Caro** | yes, it was Caro's    | Caro owes nothing   |
| Dani owes 1 | tied 0.5 / 0.5     | goes to the first in list: **Caro** | no, it was Caro's     | Dani owes 1 to Caro |

Result: Dani ends up owing 1 and Caro collecting 1, when `paid in − consumed` gives zero for
both.

### The cause

Rounding row by row guarantees each **row** closes exactly against the split, but leaves the
**columns** adrift relative to what each one put in. And a person's net balance is exactly
`their column − their row`.

With a single payer the problem doesn't exist, because the one column takes everything. That's
why the prototype never showed it: it only appears now that the spec added multi-payer
expenses.

### How it was resolved

`splitMatrix`, in `features/debts/calculation/rounding.ts`, rounds the whole matrix preserving
**both margins**:

1. Floor of each cell, and each row's remainder by largest fractional part. Rows end up exact.
2. Column correction: while one column is above its total and another is below, a unit is
   moved between them **within the same row**, which is the only thing that doesn't break what
   step 1 already adjusted.

Step 2 can always proceed: a column that's above its total has a sum greater than zero, so at
least one of its cells is worth at least one.

With the columns exact, discarding the own portion leaves the invariant intact. The result is
still the proportional attribution section 1.4 calls for, and the Debts screen doesn't change.

---

## Ids read through the prototype chain

Second bug found by property testing. With an id called `valueOf`, `toString`, or
`__proto__`, the `out[id] ?? 0` pattern on a plain object returns the function inherited from
`Object.prototype` instead of zero, and the accumulator ends up wrong.

The accumulators became `Map`s, converted to an object only at the end via
`Object.fromEntries` —which defines own properties, without going through the `__proto__`
setter— and reads of user-provided records go through `amountOf`, which checks
`Object.hasOwn` and that the value is numeric.

Today the ids will be Supabase UUIDs, so in practice this doesn't trigger. Still, it's not a
class of bug worth leaving alive in the module that splits money.

---

## Deliberate deviations from the pseudocode

### `calculateDebts` receives the members as a parameter

The pseudocode does `group.members.map(...)`, but the handoff's `Group` type doesn't have that
field: `Member` is its own entity with its `groupId`, just as the tables will be. Passing them
separately keeps the functions pure without forcing a composite object to be built just to
call them.

### The expenses that originate each debt are accumulated by currency

The pseudocode accumulates `origin[debtor][creditor]` without distinguishing currency. Since
the same pair can owe money in ARS and in USD from different expenses, each debt would end up
showing expenses from the other currency in its detail.

### `deriveTransfers` receives the id generator

The pseudocode calls a global `uid()`. Injecting it (defaulting to `crypto.randomUUID`) keeps
the function deterministic and lets the tests compare the full result, not just its shape.

---

## About the tests

The fixtures' partitions are generated with a **cut algorithm independent** of the production
one. If they were built with `splitProportionally`, the tests would be validating the code
against itself and the two bugs above would have gone unnoticed.

The invariants covered, all with property testing:

- contributions and the split sum to **exactly** the amount;
- per currency, the sum of all balances in the group is **zero**;
- each person's balance matches `paid in − consumed` **and** the sum of their debts by pair;
- the plan settles exactly, with at most `n − 1` transfers per currency.

The second invariant in the list is the one that caught the section 2.3 bug: it contrasts the
long path —debt by pair, with its proportional rounding— against the direct calculation from
the expenses.

---

## Minor decisions

**`debtsOfExpense` returns the raw matrix, without netting.** Netting by pair is
`calculateDebts`'s job, just as the spec separates 2.3 from 2.4. An expense where each one put
in what they consumed returns two debts facing each other that only cancel out when netting
the pair.

**Inactive members are counted.** No one leaves the group owing money (section 6.7): if their
debts disappeared from the calculation, the rule that blocks leaving would have nothing to
stop it with.

**Declared, unconfirmed payments reduce the debt just the same.** Section 2.7 calls for it:
the creditor's confirmation is a notice, not a condition.

**In percentage mode the split is proportional to the percentages**, not calculated against 100. If old data left the percentages not summing exactly to 100, the split still closes
against the amount and the group's balance doesn't break.
