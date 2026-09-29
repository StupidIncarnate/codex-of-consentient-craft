import type { z } from '#gateway/npm/zod';

import { domTextModeContract } from './dom-text-mode-contract';
import type { DomTextMode } from './dom-text-mode-contract';

type DomTextModeInput = z.input<typeof domTextModeContract>;

export const DomTextModeStub = ({ value }: { value?: DomTextModeInput } = {}): DomTextMode =>
  domTextModeContract.parse(value ?? 'own');
