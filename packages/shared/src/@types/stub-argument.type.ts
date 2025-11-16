/**
 * Utility type for stub function parameters.
 * Strips branded types from primitives while preserving structure validation.
 * Allows tests to pass raw values that stubs will validate and brand.
 *
 * @example
 * ```typescript
 * export const UserStub = ({ ...props }: StubArgument<User> = {}): User => {
 *   return userContract.parse({
 *     id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
 *     name: 'John Doe',
 *     ...props,
 *   });
 * };
 *
 * // Tests can now pass raw values
 * const user = UserStub({
 *   id: '123',  // raw string, not UserId brand
 *   name: 'Jane'
 * });
 * ```
 */

// Helper: Detects if a type is a union (has multiple branches)
// Uses function contravariance - unions in parameter positions are special
type IsUnion<T> = (T extends any ? (x: T) => void : never) extends (x: infer U) => void
  ? [T] extends [U]
    ? false
    : true
  : false;

export type StubArgument<T> = T extends any // Distributive conditional - processes union members separately
  ? T extends string
    ? string extends T
      ? T // T is exactly string, not branded
      : string // T is branded string (string & Brand), return plain string
    : T extends number
      ? number extends T
        ? T // T is exactly number, not branded
        : number // T is branded number (number & Brand), return plain number
      : T extends boolean
        ? boolean extends T
          ? T // T is exactly boolean, not branded
          : boolean // T is branded boolean (boolean & Brand), return plain boolean
        : T extends (infer U)[]
          ? StubArgument<U>[]
          : // IMPORTANT: `any` is required here, not `unknown`
            // Function parameters are contravariant in TypeScript
            // `(...args: unknown[]) => unknown` would fail to match specific function signatures
            // `(...args: any[]) => any` matches all possible function types
            T extends (...args: any[]) => any
            ? T // Preserve function types as-is
            : // Guard against keyof T being never (which would incorrectly match branded checks)
              // Functions and some other types can have keyof T = never
              [keyof T] extends [never]
              ? T // keyof is never, preserve T as-is
              : // Check for Record with branded string keys (must be before general object check)
                // Only transform if keyof is a single branded type (not a union of literals)
                keyof T extends string
                ? string extends keyof T
                  ? T extends object
                    ? { [K in keyof T]?: StubArgument<T[K]> } // Record<string, V> - treat as regular object
                    : T
                  : // keyof T is narrower than string - check if it's a union or single type
                    IsUnion<keyof T> extends true
                    ? T extends object
                      ? { [K in keyof T]?: StubArgument<T[K]> } // Union of keys - regular object
                      : T
                    : // Single non-union key type - likely a Record with branded/narrow key
                      // Generalize to Record<string, ...> by accessing the value type directly
                      Record<string, StubArgument<T[keyof T]>>
                : keyof T extends number
                  ? number extends keyof T
                    ? T extends object
                      ? { [K in keyof T]?: StubArgument<T[K]> } // Record<number, V> - treat as regular object
                      : T
                    : // keyof T is narrower than number - check if it's a union or single type
                      IsUnion<keyof T> extends true
                      ? T extends object
                        ? { [K in keyof T]?: StubArgument<T[K]> } // Union of keys - regular object
                        : T
                      : // Single non-union key type - likely a Record with branded/narrow key
                        // Generalize to Record<number, ...> by accessing the value type directly
                        Record<number, StubArgument<T[keyof T]>>
                  : T extends object
                    ? { [K in keyof T]?: StubArgument<T[K]> }
                    : T
  : never; // Should never reach here
