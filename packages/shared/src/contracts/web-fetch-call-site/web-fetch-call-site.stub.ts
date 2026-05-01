/**
 * PURPOSE: Stub factory for WebFetchCallSite contract
 *
 * USAGE:
 * const site = WebFetchCallSiteStub({ method: 'GET', rawArg: 'webConfigStatics.api.routes.quests' });
 * // Returns a validated WebFetchCallSite
 */

import type { StubArgument } from '../../@types/stub-argument.type';
import { ContentTextStub } from '../content-text/content-text.stub';
import { webFetchCallSiteContract, type WebFetchCallSite } from './web-fetch-call-site-contract';

export const WebFetchCallSiteStub = ({
  ...props
}: StubArgument<WebFetchCallSite> = {}): WebFetchCallSite =>
  webFetchCallSiteContract.parse({
    method: ContentTextStub({ value: 'GET' }),
    rawArg: ContentTextStub({ value: 'webConfigStatics.api.routes.quests' }),
    ...props,
  });
