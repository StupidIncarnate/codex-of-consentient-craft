/**
 * PURPOSE: Stub factory for RouteMetadata contract
 *
 * USAGE:
 * const route = RouteMetadataStub({ path: '/', responderSymbol: 'AppHomeResponder' });
 * // Returns a validated RouteMetadata with sensible defaults
 */

import type { StubArgument } from '../../@types/stub-argument.type';
import { routeMetadataContract, type RouteMetadata } from './route-metadata-contract';

export const RouteMetadataStub = ({ ...props }: StubArgument<RouteMetadata> = {}): RouteMetadata =>
  routeMetadataContract.parse({
    path: '/',
    responderSymbol: 'AppHomeResponder',
    ...props,
  });
