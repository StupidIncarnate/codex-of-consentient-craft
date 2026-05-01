/**
 * PURPOSE: Stub factory for RulePrefixGroup contract
 *
 * USAGE:
 * const group = RulePrefixGroupStub({ prefix: 'ban', names: ['ban-primitives'] });
 * // Returns a validated RulePrefixGroup with sensible defaults
 */

import type { StubArgument } from '../../@types/stub-argument.type';
import { ContentTextStub } from '../content-text/content-text.stub';
import { rulePrefixGroupContract, type RulePrefixGroup } from './rule-prefix-group-contract';

export const RulePrefixGroupStub = ({
  ...props
}: StubArgument<RulePrefixGroup> = {}): RulePrefixGroup =>
  rulePrefixGroupContract.parse({
    prefix: ContentTextStub({ value: 'ban' }),
    names: [ContentTextStub({ value: 'ban-primitives' })],
    ...props,
  });
