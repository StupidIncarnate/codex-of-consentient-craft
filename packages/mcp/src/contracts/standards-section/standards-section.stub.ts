import { standardsSectionContract } from './standards-section-contract';
import type { StandardsSection } from './standards-section-contract';
import type { StubArgument } from '@questmaestro/shared/@types';

export const StandardsSectionStub = ({
  ...props
}: StubArgument<StandardsSection> = {}): StandardsSection =>
  standardsSectionContract.parse({
    section: 'testing/proxy-architecture',
    content: '## Proxy Architecture\n\nProxies handle test setup...',
    path: 'packages/standards/testing-standards.md#proxy-architecture',
    ...props,
  });
