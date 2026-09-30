# Strips every `<x>Contract.shape.<f>.parse(ARG)` wrap W5's rewriter added, leaving ARG, in the files it touched.
# A wrap whose full text already existed at ef67a7930 (end of segment A, before W5) is kept.
# Usage: python3 tmp/bigbang/strip-w5-wraps.py [apply]
import re, subprocess, sys

PAT = re.compile(r'[A-Za-z_$][\w$]*Contract(?:\.shape\.[\w$]+)+\.parse\(')
APPLY = 'apply' in sys.argv


def close_paren(s, i):
    """Index of the ')' matching the '(' just before position i, skipping strings, templates and comments."""
    depth, n = 1, len(s)
    while i < n:
        c = s[i]
        if c in '\'"':
            q = c; i += 1
            while i < n and s[i] != q:
                i += 2 if s[i] == '\\' else 1
        elif c == '`':
            i += 1
            while i < n and s[i] != '`':
                if s[i] == '\\': i += 2; continue
                if s.startswith('${', i):
                    j = close_brace(s, i + 2); i = j
                i += 1
        elif s.startswith('//', i):
            i = s.find('\n', i)
            if i < 0: return -1
        elif s.startswith('/*', i):
            i = s.find('*/', i) + 1
        elif c in '([{':
            depth += 1
        elif c in ')]}':
            depth -= 1
            if depth == 0: return i
        i += 1
    return -1


def close_brace(s, i):
    depth = 1
    while i < len(s):
        if s[i] == '{': depth += 1
        elif s[i] == '}':
            depth -= 1
            if depth == 0: return i
        elif s[i] in '\'"`':
            q = s[i]; i += 1
            while i < len(s) and s[i] != q: i += 2 if s[i] == '\\' else 1
        i += 1
    return len(s)


def wraps(s):
    out = []
    for m in PAT.finditer(s):
        e = close_paren(s, m.end())
        if e < 0: continue
        out.append((m.start(), m.end(), e))
    return out


files = open('tmp/bigbang/logs/w5-wrap-files.txt').read().split()
total = 0
for f in files:
    base = subprocess.run(['git', 'show', 'ef67a7930:' + f], capture_output=True, text=True).stdout
    keep = {base[a:e + 1] for a, _, e in wraps(base)}
    s = open(f).read()
    removed = 0
    while True:
        cands = [(a, b, e) for a, b, e in wraps(s) if s[a:e + 1] not in keep]
        if not cands: break
        # innermost-last order does not matter: remove one (the last) and rescan
        a, b, e = cands[-1]
        s = s[:a] + s[b:e] + s[e + 1:]
        removed += 1
    if removed:
        total += removed
        print(f'{removed:3d} {f}')
        if APPLY: open(f, 'w').write(s)
print('removed', total, 'wraps' + ('' if APPLY else ' (dry run)'))
