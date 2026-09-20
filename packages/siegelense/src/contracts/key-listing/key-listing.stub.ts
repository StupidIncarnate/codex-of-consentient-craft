import type { StubArgument } from '@dungeonmaster/shared/@types';

import { keyListingContract } from './key-listing-contract';
import type { KeyListing } from './key-listing-contract';

export const KeyListingStub = ({ ...props }: StubArgument<KeyListing> = {}): KeyListing =>
  keyListingContract.parse({
    within: null,
    rows: [],
    duplicates: [],
    truncated: [],
    rendered: 'key: (no addressable elements on this page)',
    ...props,
  });
