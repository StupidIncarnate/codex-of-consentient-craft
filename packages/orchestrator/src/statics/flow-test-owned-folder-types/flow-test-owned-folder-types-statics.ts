/**
 * PURPOSE: The folder types whose files (implementation + flow test) are owned by the Flowrider
 * role rather than Codeweaver — flows/ and startup/. Codeweaver chunking excludes steps targeting
 * these folder types; those steps route to per-flow Flowrider work items instead.
 *
 * USAGE:
 * flowTestOwnedFolderTypesStatics.value;
 * // Returns ['flows', 'startup']
 */

export const flowTestOwnedFolderTypesStatics = {
  value: ['flows', 'startup'],
} as const;
