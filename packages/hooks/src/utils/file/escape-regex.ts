export const escapeRegex = ({ str }: { str: string }): string =>
  str.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
