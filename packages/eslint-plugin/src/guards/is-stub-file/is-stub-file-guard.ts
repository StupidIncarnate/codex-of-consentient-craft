export const isStubFileGuard = ({ filename }: { filename?: string | undefined }): boolean => {
  if (filename === undefined) {
    return false;
  }

  return filename.endsWith('.stub.ts') || filename.endsWith('.stub.tsx');
};
