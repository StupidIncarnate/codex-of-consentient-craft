/**
 * Pins that NOTHING jest loads on its transform path reads compiled output.
 *
 * The three files under `ts-jest/` and `jest.setup.js` are loaded by plain Node `require`, before
 * and outside ts-jest's own transform, so the `source` export condition in a jest config cannot
 * reach them — a relative `../dist/...` here stays a `dist` read however the configs are set.
 *
 * That matters more than an ordinary stale import, because these four files sit on EVERY transform
 * in the repo. An edit to the middleware behind `registerMock` is invisible to every test in every
 * package until someone builds, with nothing saying which half of the change is live.
 *
 * The assertion is derived rather than a fixed list of strings, so moving a require to a different
 * source path keeps passing and moving one back to `dist` fails.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

const PACKAGE_ROOT = resolve(__dirname, '..');

const TRANSFORM_PATH_FILES = [
  'ts-jest/transformers.js',
  'ts-jest/proxy-mock-transformer.js',
  'ts-jest/harness-lifecycle-transformer.js',
  'src/jest.setup.js',
] as const;

const REQUIRE_ARGUMENT = /require\(\s*'([^']+)'\s*\)/gu;

describe('jest transform path', () => {
  describe('relative requires in the files jest loads before transforming anything', () => {
    it.each(TRANSFORM_PATH_FILES)('VALID: {%s} => requires no compiled output', (relativePath) => {
      const contents = readFileSync(resolve(PACKAGE_ROOT, relativePath), 'utf-8');

      const distRequires = [...contents.matchAll(REQUIRE_ARGUMENT)]
        .map((match) => String(match[1]))
        .filter((specifier) => specifier.startsWith('.'))
        .filter((specifier) => specifier.split('/').includes('dist'));

      expect(distRequires).toStrictEqual([]);
    });
  });
});
