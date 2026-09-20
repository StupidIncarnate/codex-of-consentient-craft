import { mockStagingCreateMiddlewareProxy } from '../../../middleware/mock-staging-create/mock-staging-create-middleware.proxy';

export const jestRegisterMockAdapterProxy = (): Record<PropertyKey, never> => {
  mockStagingCreateMiddlewareProxy();

  return {};
};
