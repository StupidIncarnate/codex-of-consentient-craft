/**
 * PURPOSE: Pins which two members of Mantine's ActionIcon size enum every icon button in this app is
 * allowed to use, and the glyph size that rides inside each. Mantine's scale lands on 18/22/28/34/44
 * px, so neither of the two sizes the design calls for (32px for the diagram controls, ~20px for
 * everything else) has an exact member — the mapping here is where that "or thereabout" judgement is
 * made once instead of at each of the eleven call sites.
 *
 * USAGE:
 * iconButtonStatics.sizes.small;
 * // Returns 'sm' — the member every icon button outside the diagram controls passes
 */

export const iconButtonStatics = {
  sizes: {
    // 20px falls exactly between xs (18px) and sm (22px). `sm` wins the tie: it is the size the
    // comment popover's controls already render at, so the shared base keeps their painted box
    // unchanged, and it reads as comfortably larger than the 12px glyph the bubble used to carry.
    small: 'sm',
    // 32px sits between md (28px) and lg (34px); lg is 2px away where md is 4px.
    large: 'lg',
  },
  // The glyph inside the button, kept a few px under the button box so the icon never crowds its
  // own border. Keyed by every size member so picking a size is the only decision a call site makes.
  glyphPx: {
    xs: 12,
    sm: 14,
    md: 18,
    lg: 20,
    xl: 26,
  },
  borderRadiusPx: 2,
} as const;
