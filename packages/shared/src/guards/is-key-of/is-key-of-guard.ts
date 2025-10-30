/**
 * PURPOSE: Type guard function to check if a key exists in an object at runtime
 *
 * USAGE:
 * if (isKeyOfGuard('name', user)) { console.log(user.name); }
 * // Returns true if key exists in object, with TypeScript type narrowing
 */

export const isKeyOfGuard = <T extends object>(key: PropertyKey, obj: T): key is keyof T =>
  key in obj;
