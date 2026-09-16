/**
 * Row 2 — `set` with a field the ingredient never declared must not compile. Counterpart:
 * `scrolls/seigelense/proto/negative.ts`'s `unknownField`, `@ts-expect-error 'nope' is not a guild
 * field`.
 */
import { dm } from './_shared';

export const unknownField = dm.guilds.add(1, (g) => [g[0].set({ nope: 1 })]);
