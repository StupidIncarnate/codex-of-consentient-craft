/**
 * PURPOSE: Stub factory for ServerRouteCallSite contract
 *
 * USAGE:
 * const site = ServerRouteCallSiteStub({ method: 'GET', rawArg: 'apiRoutesStatics.quests.list' });
 * // Returns a validated ServerRouteCallSite
 */

import type { StubArgument } from '../../@types/stub-argument.type';
import {
  serverRouteCallSiteContract,
  type ServerRouteCallSite,
} from './server-route-call-site-contract';

export const ServerRouteCallSiteStub = ({
  ...props
}: StubArgument<ServerRouteCallSite> = {}): ServerRouteCallSite =>
  serverRouteCallSiteContract.parse({
    method: 'GET',
    rawArg: 'apiRoutesStatics.quests.list',
    responderName: 'QuestListResponder',
    ...props,
  });
