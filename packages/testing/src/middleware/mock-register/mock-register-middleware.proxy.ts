import { mockStagingCreateMiddlewareProxy } from '../mock-staging-create/mock-staging-create-middleware.proxy';

export const mockRegisterMiddlewareProxy = (): Record<PropertyKey, never> => {
  mockStagingCreateMiddlewareProxy();

  return {};
};
