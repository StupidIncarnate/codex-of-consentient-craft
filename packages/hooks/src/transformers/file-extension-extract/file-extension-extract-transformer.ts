export const fileExtensionExtractTransformer = ({ filePath }: { filePath: string }): string => {
  const match = /\.[^.]*$/u.exec(filePath);
  return match === null ? '' : match[0];
};
