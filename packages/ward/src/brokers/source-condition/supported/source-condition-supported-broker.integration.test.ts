import { resolve } from '#gateway/node/path';

import { sourceConditionSupportedBroker } from './source-condition-supported-broker';

// The unit tests stage existsSync by the same suffix the broker builds, so they stay green when
// shared moves its barrel and the suffix goes stale. This one asks the real tree: ward's own package
// folder sits in a workspace whose `@dungeonmaster/shared` link carries the source barrel.
describe('sourceConditionSupportedBroker (integration)', () => {
  it("VALID: {ward's own package folder in this monorepo} => true, so ward's children get --conditions=source", () => {
    const wardPackageFolder = resolve(__dirname, '..', '..', '..', '..');

    const result = sourceConditionSupportedBroker({ cwd: wardPackageFolder });

    expect(result).toBe(true);
  });
});
