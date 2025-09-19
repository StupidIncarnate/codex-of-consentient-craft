export const fileUtilGetFileExtension = ({ filePath }: { filePath: string }) => {
  const match = filePath.match(/\.[^.]*$/);
  return match ? match[0] : '';
};
