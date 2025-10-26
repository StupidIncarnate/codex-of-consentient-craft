export const isStubFileGuard = ({ filename }: { filename?: string }): boolean => {
  if (!filename) {
    return false;
  }

  return /\.stub(\.tsx?)?$/u.test(filename);
};
