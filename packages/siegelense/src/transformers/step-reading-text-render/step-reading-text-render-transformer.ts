/**
 * PURPOSE: Picks the human wording of a SUCCESSFUL step's stored reading for the `results` text view:
 * a `box` reading becomes one geometry line, a `seed` reading one summary line per binding. Every
 * other verb, and any reading that does not parse as the verb's own shape (a failed step's error
 * text, say), comes back untouched. The stored reading stays raw JSON, so `--json` still carries it.
 *
 * USAGE:
 * stepReadingTextRenderTransformer({ verb: 'box', reading: '{"ref":24,...}' });
 * // Returns 'ref 24: 260×36 at (472, 351) — visible, in viewport (viewport 1280×720)'
 */

import { safeJsonParseTransformer } from '@dungeonmaster/shared/transformers';

import { boxReadingContract } from '../../contracts/box-reading/box-reading-contract';
import { seedResultContract } from '../../contracts/seed-result/seed-result-contract';
import { boxReadingLineTransformer } from '../box-reading-line/box-reading-line-transformer';
import { seedBindingLineTransformer } from '../seed-binding-line/seed-binding-line-transformer';

export const stepReadingTextRenderTransformer = ({
  verb,
  reading,
}: {
  verb: string | null;
  reading: string;
}): string => {
  const untouched = reading;
  if (verb !== 'box' && verb !== 'seed') {
    return untouched;
  }

  const parsed = safeJsonParseTransformer({ value: reading });
  if (!parsed.ok) {
    return untouched;
  }

  if (verb === 'box') {
    const box = boxReadingContract.safeParse(parsed.value);
    return box.success ? boxReadingLineTransformer({ reading: box.data }) : untouched;
  }

  const seeded = seedResultContract.safeParse(parsed.value);
  if (!seeded.success) {
    return untouched;
  }
  const entries = Object.entries(seeded.data);
  if (entries.length === 0) {
    return 'SEEDED: (empty)';
  }
  return [
    'SEEDED:',
    ...entries.map(([binding, value]) => seedBindingLineTransformer({ binding, value })),
  ].join('\n');
};
