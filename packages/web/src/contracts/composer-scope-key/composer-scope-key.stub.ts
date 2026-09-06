import { composerScopeKeyContract } from './composer-scope-key-contract';
import type { ComposerScopeKey } from './composer-scope-key-contract';

export const ComposerScopeKeyStub = ({ value }: { value?: string } = {}): ComposerScopeKey =>
  composerScopeKeyContract.parse(value ?? 'f47ac10b-58cc-4372-a567-0e02b2c3d479');
