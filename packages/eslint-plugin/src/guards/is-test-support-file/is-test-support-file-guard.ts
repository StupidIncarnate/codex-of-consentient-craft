/**
 * PURPOSE: Tells whether a file is test support, the only kind of file allowed to touch a stub or a proxy: a test, a proxy, a stub, a harness, or anything under a `test/` folder. Reach for this over isTestFileGuard when the question is "may this file use test infrastructure", since a proxy or a harness is not a test yet imports stubs and proxies freely.
 *
 * USAGE:
 * isTestSupportFileGuard({ filename: '/repo/packages/shared/src/brokers/x/x-broker.proxy.ts' });
 * // Returns true
 * isTestSupportFileGuard({ filename: '/repo/packages/shared/src/brokers/x/x-broker.ts' });
 * // Returns false
 */
import { isHarnessOrProxyFileGuard } from '../is-harness-or-proxy-file/is-harness-or-proxy-file-guard';
import { isInTestDirGuard } from '../is-in-test-dir/is-in-test-dir-guard';
import { isStubFileGuard } from '../is-stub-file/is-stub-file-guard';
import { isTestFileGuard } from '../is-test-file/is-test-file-guard';

export const isTestSupportFileGuard = ({
  filename,
}: {
  filename?: string | undefined;
}): boolean => {
  if (filename === undefined) {
    return false;
  }

  return (
    isTestFileGuard({ filename }) ||
    isHarnessOrProxyFileGuard({ filename }) ||
    isStubFileGuard({ filename }) ||
    isInTestDirGuard({ filename })
  );
};
