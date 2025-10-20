export const isNpmPackageImportGuard = ({
  importSource,
}: {
  importSource?: string;
}): boolean => {
  if (importSource === undefined || importSource === '') {
    return false;
  }

  // NPM package imports don't start with '.' or '..'
  return !importSource.startsWith('.') && !importSource.startsWith('/');
};
