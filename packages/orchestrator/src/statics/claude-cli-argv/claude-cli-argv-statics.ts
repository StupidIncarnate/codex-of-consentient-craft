/**
 * PURPOSE: The ceiling a chat spawn's whole composed prompt has to clear, and the budget carved
 * out of it for the user's own text. `childProcessSpawnStreamJsonAdapter` passes the composed
 * prompt as ONE argv element (`['-p', prompt, …]`) straight to `spawn()`, and on Linux the kernel
 * caps a single argv/envp string at `MAX_ARG_STRLEN` (`PAGE_SIZE * 32`) — an element over that
 * fails the spawn outright rather than truncating it. `chatPromptBuildTransformer` composes that
 * element by substituting the user's message into a role's template at `$ARGUMENTS`, so a
 * template's OWN bytes have to leave room for that substitution, not just clear the ceiling alone.
 *
 * USAGE:
 * claudeCliArgvStatics.limits.maxArgBytes - claudeCliArgvStatics.budgets.userMessageBytes;
 * // The most a chat-role prompt TEMPLATE may weigh and still leave the stated budget for the
 * // user's own message once $ARGUMENTS is filled
 */

export const claudeCliArgvStatics = {
  limits: {
    // MAX_ARG_STRLEN on Linux: PAGE_SIZE (4096) * 32.
    maxArgBytes: 131_072,
  },
  budgets: {
    // Same magnitude as this repo's other established ceiling for a large served text blob
    // (`mcpToolResultStatics.maxVerbatimChars`) — generous enough for a long pasted request,
    // never meant to be reached by an ordinary typed message.
    userMessageBytes: 50_000,
  },
} as const;
