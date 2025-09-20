export const escapeRegex = ({ str }: { str: string }) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
