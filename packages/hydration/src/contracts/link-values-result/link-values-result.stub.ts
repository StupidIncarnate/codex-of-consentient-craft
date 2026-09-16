import type { StubArgument } from '@dungeonmaster/shared/@types';
import { linkValuesResultContract } from './link-values-result-contract';
import type { LinkValuesResult } from './link-values-result-contract';

// Defaults to the satisfied variant. Pass a full override — e.g.
// LinkValuesResultStub({ ok: false, missingParentName: 'guild' }) — to get the other one; the
// discriminated union parse strips the now-irrelevant default fields.
export const LinkValuesResultStub = ({
  ...props
}: StubArgument<LinkValuesResult> = {}): LinkValuesResult =>
  linkValuesResultContract.parse({
    ok: true,
    values: {},
    ...props,
  });
