/**
 * PURPOSE: Decides whether a directory entry is one ward's own e2e run created, by testing that
 * what sits between the prefix and the suffix is a bare port number. This predicate IS the blast
 * radius of the artifact sweep, and that is why it is its own file rather than a regex inline.
 *
 * Ward runs in repos that never adopted per-port paths. Playwright's DEFAULT `outputDir` is
 * `test-results/` itself, and a project using it writes `test-results/<spec>-<title>-chromium/`
 * there — someone else's failure traces, sitting exactly where the sweep is looking. Requiring
 * digits and nothing else is the only thing separating "reap what ward left" from "delete a
 * stranger's evidence".
 *
 * USAGE:
 * isPortSuffixedArtifactGuard({ name: '.vite-40000', prefix: '.vite-', suffix: '' });
 * // Returns true; 'my-spec-renders-chromium' under the same prefix returns false
 */

export const isPortSuffixedArtifactGuard = ({
  name,
  prefix,
  suffix,
}: {
  name?: string;
  prefix?: string;
  suffix?: string;
}): boolean => {
  if (name === undefined || prefix === undefined || suffix === undefined) {
    return false;
  }

  if (!name.startsWith(prefix) || !name.endsWith(suffix)) {
    return false;
  }

  // Compute the end index rather than negating the suffix length. `slice(prefix.length, -0)` is
  // `slice(prefix.length, 0)`, which returns the empty string — so the obvious-looking form
  // silently rejects every entry whose suffix is empty, which is two of the three artifacts.
  const middle = name.slice(prefix.length, name.length - suffix.length);

  return middle.length > 0 && /^\d+$/u.test(middle);
};
