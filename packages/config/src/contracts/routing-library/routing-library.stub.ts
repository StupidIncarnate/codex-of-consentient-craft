import { routingLibraryContract } from './routing-library-contract';
import type { RoutingLibrary } from './routing-library-contract';

export const RoutingLibraryStub = (
  { value }: { value?: string } = {
    value: 'react-router-dom',
  },
): RoutingLibrary => routingLibraryContract.parse(value);
