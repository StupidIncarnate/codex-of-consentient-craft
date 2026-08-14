import { stickyZIndexContract } from './sticky-z-index-contract';
import type { StickyZIndex } from './sticky-z-index-contract';
import { stickyHeaderStatics } from '../../statics/sticky-header/sticky-header-statics';

export const StickyZIndexStub = ({ value }: { value?: number } = {}): StickyZIndex =>
  stickyZIndexContract.parse(value ?? stickyHeaderStatics.zIndexBase);
