import { spyOnProxy } from '#gateway/npm/jest__globals/spy-on/spy-on.proxy';
import { mockStagingCreateMiddlewareProxy } from '../../../middleware/mock-staging-create/mock-staging-create-middleware.proxy';

export const jestRegisterSpyOnAdapterProxy = (): Record<PropertyKey, never> => {
  mockStagingCreateMiddlewareProxy();
  spyOnProxy();

  return {};
};
