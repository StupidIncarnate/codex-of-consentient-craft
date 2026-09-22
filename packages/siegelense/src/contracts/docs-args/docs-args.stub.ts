import type { StubArgument } from '@dungeonmaster/shared/@types';

import { docsArgsContract } from './docs-args-contract';
import type { DocsArgs } from './docs-args-contract';

export const DocsArgsStub = ({ ...props }: StubArgument<DocsArgs> = {}): DocsArgs =>
  docsArgsContract.parse({
    scope: 'operating',
    isJson: false,
    ...props,
  });
