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
export type StubArgument<T> = T extends string & { readonly __brand: unknown }
  ? string
  : T extends number & { readonly __brand: unknown }
    ? number
    : T extends boolean & { readonly __brand: unknown }
      ? boolean
      : T extends Array<infer U>
        ? Array<StubArgument<U>>
        : T extends object
          ? { [K in keyof T]?: StubArgument<T[K]> }
          : T;
