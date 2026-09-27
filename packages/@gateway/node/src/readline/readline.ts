/**
 * PURPOSE: Curated entry for the Node built-in 'readline'. Exposes an interactive question/
 * answer helper and a line-tap reader, and nothing raw.
 *
 * USAGE:
 * import { question, lineReader } from '#gateway/node/readline';
 */

export * from 'readline';
export { lineReader } from './line-reader/line-reader';
export { question } from './question/question';
