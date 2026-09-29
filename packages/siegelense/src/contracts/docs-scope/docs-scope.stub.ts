import type { z } from '#gateway/npm/zod';

import { docsScopeContract } from './docs-scope-contract';
import type { DocsScope } from './docs-scope-contract';

type DocsScopeInput = z.input<typeof docsScopeContract>;

export const DocsScopeStub = ({ value }: { value?: DocsScopeInput } = {}): DocsScope =>
  docsScopeContract.parse(value ?? 'walking');
