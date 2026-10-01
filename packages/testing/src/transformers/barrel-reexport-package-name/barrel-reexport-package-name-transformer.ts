/**
 * PURPOSE: The npm package an npm gateway barrel passes through, read off its first
 * `export * from '<pkg>'` (or `export type * from '<pkg>'`) line. Reach for this over decoding the
 * folder name: `a__b` names both a scoped package (`hono__node-server` is `@hono/node-server`) and a
 * subpath (`rxjs__operators` is `rxjs/operators`), and only the barrel says which.
 *
 * USAGE:
 * barrelReexportPackageNameTransformer({ barrelText: "export * from '@tabler/icons-react';\n" });
 * // Returns '@tabler/icons-react', or null when the barrel re-exports no package
 */

const STAR_REEXPORT_PATTERN = /^export\s+(?:type\s+)?\*\s+from\s+['"]([^'"./][^'"]*)['"]/mu;

export const barrelReexportPackageNameTransformer = ({
  barrelText,
}: {
  barrelText: string;
}): string | null => {
  const match = STAR_REEXPORT_PATTERN.exec(barrelText);

  return match?.[1] ?? null;
};
