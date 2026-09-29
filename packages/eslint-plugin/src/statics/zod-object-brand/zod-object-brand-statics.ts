/**
 * PURPOSE: The zod method names `require-object-contract-brands` sorts a chain by. Reach for these
 * instead of writing a list in the rule: the object roots, the derive methods (zod v4 drops a brand
 * on each), and the schemas that never carry one all have to agree across the rule's transformers.
 *
 * USAGE:
 * zodObjectBrandStatics.objectRoots.includes(methodName);
 * // true for 'object', 'strictObject' and 'looseObject'
 */
export const zodObjectBrandStatics = {
  objectRoots: ['object', 'strictObject', 'looseObject'],
  deriveMethods: ['extend', 'pick', 'omit', 'partial', 'required', 'merge', 'safeExtend'],
  // Methods that keep the schema an object, so the brand goes after the last of them.
  objectLevelMethods: [
    'extend',
    'pick',
    'omit',
    'partial',
    'required',
    'merge',
    'safeExtend',
    'strict',
    'passthrough',
    'strip',
    'catchall',
  ],
  // A literal type already cannot be confused with free text, and a boolean has two values.
  unbrandableRoots: ['enum', 'nativeEnum', 'literal', 'boolean'],
  // A value type that holds a string or a number and so needs a brand of its own. The v4 string
  // formats (`z.email()`, `z.uuid()`) are top-level constructors, so each is a root of its own.
  leafRoots: [
    'string',
    'number',
    'int',
    'int32',
    'uint32',
    'float32',
    'float64',
    'email',
    'url',
    'uuid',
    'guid',
    'uuidv4',
    'uuidv6',
    'uuidv7',
    'cuid',
    'cuid2',
    'ulid',
    'nanoid',
    'xid',
    'ksuid',
    'emoji',
    'ipv4',
    'ipv6',
    'cidrv4',
    'cidrv6',
    'base64',
    'base64url',
    'e164',
    'jwt',
  ],
  // Calls that wrap a leaf without changing what it holds; a brand goes before the first of them.
  leafWrapperMethods: [
    'optional',
    'nullable',
    'nullish',
    'default',
    'prefault',
    'catch',
    'array',
    'readonly',
    'describe',
  ],
  // The only calls a reuse (`owner.shape.key`) may carry: none of them adds a check of its own, and
  // `unwrap` and `describe` change what is read or said about the schema, not what it accepts.
  reuseModifiers: ['optional', 'nullable', 'nullish', 'default', 'unwrap', 'describe'],
  gateway: { brandPrefix: '#Gateway' },
} as const;
