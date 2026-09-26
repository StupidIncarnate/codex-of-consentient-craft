import { FsErrorStub } from './fs-error.stub';

type FsError = ReturnType<typeof FsErrorStub>;

// NO mocking — isFsError is a pure predicate and runs real in every test. This proxy only builds
// semantic error values, the way a guard proxy builds semantic User/Permission stubs.
export const isFsErrorProxy = (): {
  buildMatchingError: (params: { code: string }) => FsError;
  buildMismatchedError: (params: { code: string }) => FsError;
} => ({
  buildMatchingError: ({ code }: { code: string }): FsError => FsErrorStub({ code }),

  buildMismatchedError: ({ code }: { code: string }): FsError =>
    FsErrorStub({ code: `NOT_${code}` }),
});
