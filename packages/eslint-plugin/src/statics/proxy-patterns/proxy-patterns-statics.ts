/**
 * PURPOSE: Defines forbidden words in proxy files and implementation suffixes
 *
 * USAGE:
 * import { proxyPatternsStatics } from './statics/proxy-patterns/proxy-patterns-statics';
 * const hasForbiddenWord = proxyPatternsStatics.forbiddenWords.includes('mock');
 * // Returns true
 * const isImplementationSuffix = proxyPatternsStatics.implementationSuffixes.includes('Broker');
 * // Returns true
 *
 * WHEN-TO-USE: When validating proxy file naming or checking for test-related terminology
 */
export const proxyPatternsStatics = {
  forbiddenWords: ['mock', 'stub', 'fake', 'spy', 'jest', 'dummy'],
  implementationSuffixes: [
    'Adapter',
    'Broker',
    'Transformer',
    'Guard',
    'Binding',
    'Widget',
    'Responder',
    'Middleware',
    'State',
    'Flow',
  ],
} as const;
