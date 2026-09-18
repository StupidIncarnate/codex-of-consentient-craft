/**
 * PURPOSE: Turns a KeyReading into readable ContentText —
 * `pressed "${reading.press}" — focused: ${formatted}`
 * or
 * `pressed "${reading.press}" — nothing focused`
 * when focused is null.
 *
 * USAGE:
 * keyReadingRenderTransformer({ reading: KeyReadingStub() });
 * // Returns 'pressed "Enter" — nothing focused'
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { KeyReading } from '../../contracts/key-reading/key-reading-contract';

export const keyReadingRenderTransformer = ({ reading }: { reading: KeyReading }): ContentText => {
  if (reading.focused === null) {
    return contentTextContract.parse(`pressed "${reading.press}" — nothing focused`);
  }

  const { tag, testId, role, domId, text, ref } = reading.focused;
  const domIdPart = domId === null ? '' : `#${domId}`;
  const testIdPart = testId === null ? '' : `[data-testid="${testId}"]`;
  const rolePart = role === null ? '' : `[role="${role}"]`;
  const textPart = text === null ? '' : ` "${text}"`;
  const refPart = ref === null ? '' : ` (ref ${String(ref)})`;
  const element = `${tag}${domIdPart}${testIdPart}${rolePart}${textPart}${refPart}`;

  return contentTextContract.parse(`pressed "${reading.press}" — focused: ${element}`);
};
