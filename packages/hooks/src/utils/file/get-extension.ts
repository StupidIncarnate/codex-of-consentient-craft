export const fileUtilGetFileExtension = ({ filePath }: { filePath: string }) => {
  const match = /\.[^.]*$/.exec(filePath);
  return match ? match[0] : '';
};
