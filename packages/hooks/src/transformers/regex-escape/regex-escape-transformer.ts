export const regexEscapeTransformer = ({ str }: { str: string }): string =>
  str.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
