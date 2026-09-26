import type { FsError } from './is-fs-error';

// Built as a real `Error` (not a bare object) so it survives `registerMock`'s `.rejects()`
// unchanged: that staging step substitutes a generic `new Error(String(val))` for any rejection
// value that fails both `instanceof Error` and `isNativeError`, which would silently drop `code`.
// `isFsError`'s OWN realm-safety — that it works without `instanceof` — is proven separately in
// is-fs-error.test.ts against a genuinely prototype-less object, which never goes through a mock.
export const FsErrorStub = ({
  code,
  path,
  syscall,
}: {
  code: string;
  path?: string;
  syscall?: string;
}): FsError =>
  Object.assign(new Error(`${code}: ${syscall ?? 'op'} '${path ?? ''}'`), {
    code,
    ...(path === undefined ? {} : { path }),
    ...(syscall === undefined ? {} : { syscall }),
  });
