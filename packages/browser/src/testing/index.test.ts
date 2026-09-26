import * as browserTesting from './index';

const CURATED_MODULE_PROXY_EXPORTS = [
  ['fetchJsonProxy', browserTesting.fetchJsonProxy],
  ['readItemProxy', browserTesting.readItemProxy],
  ['writeItemProxy', browserTesting.writeItemProxy],
  ['removeItemProxy', browserTesting.removeItemProxy],
  ['keysProxy', browserTesting.keysProxy],
  ['connectProxy', browserTesting.connectProxy],
  ['openStoreProxy', browserTesting.openStoreProxy],
  ['getAllProxy', browserTesting.getAllProxy],
  ['putProxy', browserTesting.putProxy],
  ['deleteRecordProxy', browserTesting.deleteRecordProxy],
] as const;

describe('@dungeonmaster/browser/testing', () => {
  it.each(CURATED_MODULE_PROXY_EXPORTS)(
    'VALID: {export: %s} => is re-exported as a function',
    (_name, value) => {
      expect(value).toStrictEqual(expect.any(Function));
    },
  );
});
