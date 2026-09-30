#!/usr/bin/env python3
"""Derive fix-dangling holds from a diag run taken after an apply.

A diagnostic is the script's doing when
  - it sits in a file the script changed, its code is not among that file's codes in the base diag, and it is not a
    TS6133 on an import line (an unused sibling name the removed dead import used to mask); or
  - anywhere, its message names a brand text one of the script's field-inline edits created.
The edit covering the diagnostic's line is held; when no edit covers it, every edit in that file is held ('*').
The brand-text rule only counts a diagnostic that is new: a new code in a changed file, a new (code, line) elsewhere.
Holds accumulate across rounds in tmp/bigbang/logs/dangling-holds.json.

Usage: python3 tmp/bigbang/fix-dangling-holds.py <base diag> <after diag>
"""
import json, os, re, sys, collections

base = json.load(open(sys.argv[1]))
after = json.load(open(sys.argv[2]))
manifest = json.load(open('tmp/bigbang/logs/dangling-manifest.json'))
changed = set(open('tmp/bigbang/logs/dangling-changed.txt').read().split())
hf = 'tmp/bigbang/logs/dangling-holds.json'
holds = json.load(open(hf)) if os.path.exists(hf) else []
have = {(h['file'], h['id']) for h in holds}

base_codes = collections.defaultdict(set)
for e in base:
    base_codes[e['file']].add(e['code'])
by_file = collections.defaultdict(list)
for m in manifest:
    by_file[m['file']].append(m)
brand_edits = collections.defaultdict(list)
for m in manifest:
    if m['brandText']:
        brand_edits[m['brandText']].append(m)

def is_import_line(f, line):
    try:
        return re.match(r'\s*(import|export)\b', open(f).read().split('\n')[line - 1]) is not None
    except Exception:
        return False

added = []
def hold(f, i, why):
    if (f, i) in have:
        return
    have.add((f, i))
    h = {'file': f, 'id': i, 'reason': why}
    holds.append(h)
    added.append(h)

base_sites = {(e['file'], e['code'], e['line']) for e in base}
for e in after:
    msg = e['message'].replace('\n', ' ')
    why = f"TS{e['code']} at {e['file']}:{e['line']}: {msg[:140]}"
    f = e['file']
    new_here = (e['code'] not in base_codes[f]) if f in changed else ((f, e['code'], e['line']) not in base_sites)
    for b in (set(re.findall(r'\$brand<"([^"]+)">', msg)) if new_here else ()):
        for m in brand_edits.get(b, []):
            hold(m['file'], m['id'], why)
    if f not in changed or e['code'] in base_codes[f]:
        continue
    if e['code'] == 6133 and is_import_line(f, e['line']):
        continue
    if any(b in brand_edits for b in re.findall(r'\$brand<"([^"]+)">', msg)):
        continue
    cover = [m for m in by_file[f] if m['line0'] <= e['line'] <= m['line1']]
    if cover:
        for m in cover:
            hold(f, m['id'], why)
    else:
        hold(f, '*', why)

json.dump(holds, open(hf, 'w'), indent=1)
print('holds added', len(added), 'total', len(holds))
for h in added:
    print(' ', h['file'], h['id'], '|', h['reason'][:160])
