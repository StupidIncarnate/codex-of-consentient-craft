/**
 * PURPOSE: Defines all valid framework preset property keys
 *
 * USAGE:
 * import {frameworkPresetKeysStatics} from './framework-preset-keys-statics';
 * const keys = frameworkPresetKeysStatics.keys.all;
 * // Returns readonly array of all framework preset keys
 */

export const frameworkPresetKeysStatics = {
  keys: {
    all: [
      'widgets',
      'bindings',
      'state',
      'flows',
      'responders',
      'contracts',
      'brokers',
      'transformers',
      'errors',
      'middleware',
      'adapters',
      'startup',
    ] as const,
  },
} as const;
