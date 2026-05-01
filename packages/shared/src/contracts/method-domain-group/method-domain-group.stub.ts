/**
 * PURPOSE: Stub factory for MethodDomainGroup contract
 *
 * USAGE:
 * const group = MethodDomainGroupStub({ domain: ContentTextStub({ value: 'Guilds' }) });
 * // Returns a validated MethodDomainGroup with sensible defaults
 */

import type { StubArgument } from '../../@types/stub-argument.type';
import { ContentTextStub } from '../content-text/content-text.stub';
import { methodDomainGroupContract, type MethodDomainGroup } from './method-domain-group-contract';

export const MethodDomainGroupStub = ({
  ...props
}: StubArgument<MethodDomainGroup> = {}): MethodDomainGroup =>
  methodDomainGroupContract.parse({
    domain: ContentTextStub({ value: 'Guilds' }),
    methods: [ContentTextStub({ value: 'listGuilds' })],
    ...props,
  });
