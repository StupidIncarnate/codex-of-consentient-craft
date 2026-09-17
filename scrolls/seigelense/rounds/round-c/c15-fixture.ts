// C15's type-level half: does `g[0].sessions.under({guildId})` even compile, using the REAL
// dm-target.ts fixtures (guildIngredient's guild, sessionIngredient links to guild)? Graded by
// typescriptProgramDiagnosticsAdapter in the sibling c15-run.ts — a clean compile here means the
// type system offers no refusal, so the question is purely a runtime precedence one.
import { entryChainTransformer } from '../../packages/hydration/src/transformers/entry-chain/entry-chain-transformer';
import { guildIngredient, sessionIngredient } from '../../packages/hydration/test/type-fixtures/dm-target';

const dm = entryChainTransformer({ registry: { guilds: guildIngredient, sessions: sessionIngredient } });

export const underAndAncestorSameField = dm.guilds.add(1, (g) => [
  g[0].sessions.under({ guildId: 'g-from-under' as never }).add(1, () => []),
]);
