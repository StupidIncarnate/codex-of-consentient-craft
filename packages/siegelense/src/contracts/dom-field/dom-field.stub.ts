import type { z } from 'zod';

import { domFieldContract } from './dom-field-contract';
import type { DomField } from './dom-field-contract';

type DomFieldInput = z.input<typeof domFieldContract>;

export const DomFieldStub = ({ value }: { value?: DomFieldInput } = {}): DomField =>
  domFieldContract.parse(value ?? 'text');
