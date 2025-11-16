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

// ============================================================================
// Helper Types
// ============================================================================

/**
 * Detects if a type is a union (has multiple branches).
 * Uses function contravariance - unions in parameter positions are special.
 */
type IsUnion<T> = (T extends any ? (x: T) => void : never) extends (x: infer U) => void
  ? [T] extends [U]
    ? false
    : true
  : false;

/**
 * Detects if T is a branded version of Base.
 * Branded types are intersections: Base & Brand
 * T extends Base (branded extends base) = true
 * Base extends T (base extends branded) = false
 */
type IsBranded<T, Base> = T extends Base ? (Base extends T ? false : true) : false;

/**
 * Unbrands primitive types (string, number, boolean).
 * Returns the base primitive if branded, otherwise returns T unchanged.
 */
type UnbrandPrimitive<T> =
  IsBranded<T, string> extends true
    ? string
    : IsBranded<T, number> extends true
      ? number
      : IsBranded<T, boolean> extends true
        ? boolean
        : T;

/**
 * Transforms Record types with branded keys to use plain string/number keys.
 * Record<BrandedString, V> => Record<string, StubArgument<V>>
 */
type UnbrandRecord<T> = keyof T extends string
  ? string extends keyof T
    ? { [K in keyof T]?: StubArgument<T[K]> } // Record<string, V> - regular object
    : IsUnion<keyof T> extends true
      ? { [K in keyof T]?: StubArgument<T[K]> } // Union of literal keys - regular object
      : Record<string, StubArgument<T[keyof T]>> // Single branded key - generalize
  : keyof T extends number
    ? number extends keyof T
      ? { [K in keyof T]?: StubArgument<T[K]> } // Record<number, V> - regular object
      : IsUnion<keyof T> extends true
        ? { [K in keyof T]?: StubArgument<T[K]> } // Union of literal keys - regular object
        : Record<number, StubArgument<T[keyof T]>> // Single branded key - generalize
    : { [K in keyof T]?: StubArgument<T[K]> }; // Other key types - map properties

// ============================================================================
// Main Type
// ============================================================================

/**
 * Recursively transforms a type to accept unbranded values in stub parameters.
 * - Branded primitives => base primitives (BrandedString => string)
 * - Arrays => recursively transformed arrays
 * - Functions => preserved as-is
 * - Records with branded keys => Record<string, ...> or Record<number, ...>
 * - Objects => recursively transformed properties (all optional)
 */
export type StubArgument<T> = T extends any // Distributive - handles union members separately
  ? UnbrandPrimitive<T> extends T
    ? T extends (infer U)[] // Not a branded primitive, check if array
      ? StubArgument<U>[]
      : // IMPORTANT: `any` is required here, not `unknown`
        // Function parameters are contravariant in TypeScript
        // `(...args: unknown[]) => unknown` would fail to match specific function signatures
        // `(...args: any[]) => any` matches all possible function types
        T extends (...args: any[]) => any
        ? T // Preserve functions as-is
        : [keyof T] extends [never]
          ? T // keyof is never (some primitives/functions), preserve as-is
          : T extends object
            ? UnbrandRecord<T> // Transform Record keys or map object properties
            : T
    : UnbrandPrimitive<T> // T is a branded primitive, return unbranded version
  : never; // Should never reach here
