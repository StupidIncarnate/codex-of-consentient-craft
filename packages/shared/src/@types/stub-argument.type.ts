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

import type { BRAND } from '#gateway/npm/zod';

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
 * Detects a Zod v4 brand whose literal starts with `'#Gateway'` — the marker a gateway schema
 * carries (`childProcessSchema`, `walkedFileSchema`, …), one check shared by every contract field
 * that holds that outside type (BR C9). `zod`'s own `BRAND<K>` type is `{[$brand]: {[k in K]: true}}`
 * (`node_modules/zod/v4/classic/compat.d.ts`), so matching `T extends BRAND<infer K>` structurally
 * recovers the brand literal(s) regardless of what T is otherwise shaped like — a real dependency on
 * `zod`, unlike the Promise/zod-schema-instance checks below, because there is no structural way to
 * name a `unique symbol`-keyed property without importing the symbol that keys it.
 */
type IsGatewayBrand<T> =
  T extends BRAND<infer K> ? (K extends `#Gateway${string}` ? true : false) : false;

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
type StubArgumentBase<T> = T extends any // Distributive - handles union members separately
  ? UnbrandPrimitive<T> extends T
    ? T extends (infer U)[] // Not a branded primitive, check if array
      ? StubArgumentBase<U>[]
      : // IMPORTANT: `any` is required here, not `unknown`
        // Function parameters are contravariant in TypeScript
        // `(...args: unknown[]) => unknown` would fail to match specific function signatures
        // `(...args: any[]) => any` matches all possible function types
        T extends (...args: any[]) => any
        ? T // Preserve functions as-is
        : // A Promise's `keyof` is a union of method names (`then`/`catch`/`finally`), so without this
          // branch `UnbrandRecord` would map it to `{ then?, catch?, finally? }` — a value with no
          // `then` at all satisfies that shape, which is not a Promise. Preserve it whole, like a
          // function: it is a live async value, not deep-partialable data.
          T extends Promise<any>
          ? T
          : // A zod schema instance's `keyof` is a union of its own method names (`parse`/
            // `safeParse`/…), so without this branch `UnbrandRecord` would map it the same broken
            // way a Promise would be mapped — a plain object with a few optional methods, not a real
            // schema. Detected structurally (`parse`+`safeParse` together) rather than by importing
            // zod's own class, so this file stays dependency-free. Preserve it whole: a schema is a
            // live, opaque value a stub carries through unvalidated, never data to unbrand.
            T extends { parse: (...args: any[]) => any; safeParse: (...args: any[]) => any }
            ? T
            : // A `#Gateway`-branded field (B06/BR C9) holds a value the GATEWAY owns — a class
              // instance like `ChildProcess`, or plain data like `WalkedFile`. `UnbrandRecord`
              // would map either one to an all-optional shape (`{pid: 5}` compiling where a whole
              // `ChildProcess` is required), and `Omit`-based stripping was already tried and
              // rejected: it rebuilds the type and breaks `this`-returning methods such as
              // `addListener`. Preserve it whole instead — the gateway's own stub is the only value
              // that satisfies it.
              IsGatewayBrand<T> extends true
              ? T
              : [keyof T] extends [never]
                ? T // keyof is never (some primitives/functions), preserve as-is
                : T extends object
                  ? UnbrandRecord<T> // Transform Record keys or map object properties
                  : T
    : UnbrandPrimitive<T> // T is a branded primitive, return unbranded version
  : never; // Should never reach here

/**
 * Stub parameter type. `Extra` carries optional convenience keys a stub accepts beyond the
 * contract's own fields (e.g. a `text` shortcut that the stub brands and injects into a nested
 * line). It defaults to `{}` so the common single-argument form `StubArgument<T>` is unchanged.
 * Both forms keep the annotation a bare `StubArgument<...>` reference, which `enforce-stub-patterns`
 * requires.
 */
export type StubArgument<T, Extra = unknown> = StubArgumentBase<T> & Extra;
