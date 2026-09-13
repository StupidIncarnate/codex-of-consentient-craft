/**
 * PURPOSE: Knobs for the ban-flattened-contract-params rule — how many distinct properties off one
 * host type make a block a flattened contract, and which host types are structural handles rather
 * than domain contracts. Reach for this over editing the rule broker: the exempt sets are the part
 * a consumer repo is most likely to need to extend.
 *
 * USAGE:
 * flattenedContractParamsStatics.limits.minimumDistinctProperties;
 * // Returns 2 — the count at which a block is reported
 */
export const flattenedContractParamsStatics = {
  limits: {
    // Two is the floor because the architecture blesses exactly ONE indexed field as the way to
    // take a single identifier (`{ userId: User['id'] }`). A second one means the caller is holding
    // an object it could have passed whole.
    minimumDistinctProperties: 2,
  },

  // A DOM or React handle indexed twice is not a contract taken apart — there is no whole object to
  // pass instead, because the caller holds a ref or an attribute bag rather than a domain value.
  // IconButtonWidget's Popover.Target plumbing is the case this exists for.
  exemptHosts: {
    names: [
      'AriaAttributes',
      'AriaRole',
      'Array',
      'CSSProperties',
      'Document',
      'Element',
      'Event',
      'JSX',
      'Map',
      'Node',
      'Parameters',
      'Partial',
      'Promise',
      'React',
      'Readonly',
      'Record',
      'Required',
      'ReturnType',
      'Set',
      'TSESTree',
      'Window',
    ],
    // Every `HTMLInputElement` and `SVGSVGElement` at once, so the list above does not have to
    // enumerate the DOM.
    prefixes: ['HTML', 'SVG'],
    // `MouseEvent`, `KeyboardEvent`, `ChangeEvent` — the React and DOM event bags.
    suffixes: ['Event'],
  },
} as const;
