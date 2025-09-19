export const fileUtilEscapeRegex = ({ str }: { str: string }) =>
  str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
