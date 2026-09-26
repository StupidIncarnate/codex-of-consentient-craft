/**
 * PURPOSE: Wraps the native `import()` expression — a language construct, not a member of the
 * `module` object, so it cannot become a property on `index.ts`'s `moduleGateway` the way
 * `resolvePackageRoot` did and lives in its own file instead. Reach for this over a bare `import()`
 * anywhere outside the gateway, so every dynamic load goes through one mockable seam.
 *
 * USAGE:
 * const mod = await dynamicImport<{ StartServer: () => void }>({ path: '/abs/path/module.js' });
 * // Returns the module namespace object; rejects with Node's own error for a missing module or a
 * // syntax error inside the loaded file — neither is caught or reshaped here.
 */

export const dynamicImport = async <T = unknown>({ path }: { path: string }): Promise<T> =>
  import(path) as Promise<T>;
