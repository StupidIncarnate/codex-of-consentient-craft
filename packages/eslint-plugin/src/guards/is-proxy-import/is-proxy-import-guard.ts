import { hasFileSuffixGuard } from '../has-file-suffix/has-file-suffix-guard';

export const isProxyImportGuard = ({ importSource }: { importSource?: string }): boolean => {
  if (!importSource) {
    return false;
  }

  return (
    hasFileSuffixGuard({ filename: importSource, suffix: 'proxy' }) ||
    importSource.endsWith('.proxy') ||
    importSource.includes('.proxy/')
  );
};
