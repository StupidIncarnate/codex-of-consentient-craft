/**
 * PURPOSE: Stub factory for RouteMetadata contract
 *
 * USAGE:
 * const route = RouteMetadataStub({ path: '/', responderSymbol: 'AppHomeResponder' });
 * // Returns a validated RouteMetadata with sensible defaults
 */

import type { StubArgument } from '../../@types/stub-argument.type';
import { ContentTextStub } from '../content-text/content-text.stub';
import { routeMetadataContract, type RouteMetadata } from './route-metadata-contract';

export const RouteMetadataStub = ({ ...props }: StubArgument<RouteMetadata> = {}): RouteMetadata =>
  routeMetadataContract.parse({
    path: ContentTextStub({ value: '/' }),
    responderSymbol: ContentTextStub({ value: 'AppHomeResponder' }),
    ...props,
  });
