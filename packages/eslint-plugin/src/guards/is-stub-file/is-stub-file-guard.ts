export const isStubFileGuard = ({ filename }: { filename: string }): boolean =>
  filename.endsWith('.stub.ts') || filename.endsWith('.stub.tsx');
