/**
 * PURPOSE: Stub factory for ServerRouteCallSite contract
 *
 * USAGE:
 * const site = ServerRouteCallSiteStub({ method: 'GET', rawArg: 'apiRoutesStatics.quests.list' });
 * // Returns a validated ServerRouteCallSite
 */

import type { StubArgument } from '../../@types/stub-argument.type';
import { ContentTextStub } from '../content-text/content-text.stub';
import {
  serverRouteCallSiteContract,
  type ServerRouteCallSite,
} from './server-route-call-site-contract';

export const ServerRouteCallSiteStub = ({
  ...props
}: StubArgument<ServerRouteCallSite> = {}): ServerRouteCallSite =>
  serverRouteCallSiteContract.parse({
    method: ContentTextStub({ value: 'GET' }),
    rawArg: ContentTextStub({ value: 'apiRoutesStatics.quests.list' }),
    responderName: ContentTextStub({ value: 'QuestListResponder' }),
    ...props,
  });
