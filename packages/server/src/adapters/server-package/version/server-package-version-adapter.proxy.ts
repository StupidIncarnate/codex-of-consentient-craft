import { readFileSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';

// require.resolve produces an environment-derived absolute path (this repo's node_modules
// symlink, not a value the test authors), so the mock is addressed with a PREDICATE rather than
// a literal path — mirrors the note in fs-read-file-adapter.proxy.ts for this exact case.
const SERVER_PACKAGE_JSON_SUFFIX = 'package.json';

export const serverPackageVersionAdapterProxy = (): {
  returnsManifest: ({ version }: { version: string }) => void;
  returnsRawManifest: ({ raw }: { raw: string }) => void;
  readFails: ({ error }: { error: Error }) => void;
} => {
  const handle = registerMock({ fn: readFileSync });

  return {
    returnsManifest: ({ version }: { version: string }): void => {
      handle
        .calledWith([(value: unknown) => String(value).endsWith(SERVER_PACKAGE_JSON_SUFFIX)])
        .returns(JSON.stringify({ version }));
    },
    returnsRawManifest: ({ raw }: { raw: string }): void => {
      handle
        .calledWith([(value: unknown) => String(value).endsWith(SERVER_PACKAGE_JSON_SUFFIX)])
        .returns(raw);
    },
    readFails: ({ error }: { error: Error }): void => {
      handle
        .calledWith([(value: unknown) => String(value).endsWith(SERVER_PACKAGE_JSON_SUFFIX)])
        .throws(error);
    },
  };
};
