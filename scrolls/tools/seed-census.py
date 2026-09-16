"""
Counts the seeding surface the hydration migration converts, and tracks it as the conversion runs.

WHY THIS EXISTS. `siegelense-recipes.md` quotes figures — 122 e2e specs, 121 integration tests, 17
that seed domain state, `guildHarness` at 510 call sites — and a figure nobody can re-derive is a
figure that rots. It also names a job whose first act is "write the file list down": this produces
that list rather than leaving a planner to invent a different one.

WHAT COUNTS AS A CONVERSION TARGET. A test that BUILDS a guild, a quest or a session. A test that
takes a temp directory from `installTestbedCreateBroker` and never builds one is not a target, and
most integration tests are in that group.

WHAT IS DELIBERATELY EXCLUDED. A test whose SUBJECT is the production writer an ingredient's `write`
route calls cannot be converted to seed through that ingredient — it would assert the hydrator
through the hydrator. Those are reported separately under `excluded`, not as targets.

WHY `--progress` STOPPED BEING THE RUNNING MARK. It counts occurrences of the three harness
IDENTIFIERS — an import line, a `guildHarness({...})` construction, a lifecycle hook — inside the
118 e2e targets. A harness method call under the seam this migration actually uses
(`const guilds = guildHarness({...}); await guilds.createGuild({...});`) puts the identifier on the
CONSTRUCTION line and the method name on the NEXT one, so the number does not fall when a method
body is replaced and the harness keeps its name. `--methods` is the mark that does move: for each
harness method, how many call sites it has, whether its body reaches `dmRegistryBroker`, and whether
it still calls a filesystem function or an HTTP verb directly.

USAGE — from the repo root:

    python3 scrolls/tools/seed-census.py              # the census plus the target list
    python3 scrolls/tools/seed-census.py --progress   # harness-identifier occurrences (see above)
    python3 scrolls/tools/seed-census.py --methods    # per-method call sites, routing, direct writes
    python3 scrolls/tools/seed-census.py --json       # the default census, machine-readable
"""

import json
import os
import re
import sys

SKIP_DIRS = {'node_modules', 'dist', 'coverage', '.ward', '.git', 'worktrees'}

# Builds domain state: a guild, a quest, or a session transcript.
DOMAIN = re.compile(
    r'createGuild|guildHarness|questHarness|sessionHarness|createQuest|QuestStub'
    r'|questHydrateBroker|smoketestBlueprints|seedQuestRepo|/api/guilds|/api/quests'
    r'|guildAddBroker|questPersistBroker|GuildStub'
)

# A test OF one of these cannot seed THROUGH the ingredient that copies it.
COPIES_TARGETS = ('questHydrateBroker', 'questPersistBroker', 'guildAddBroker',
                  'questOperationsUpdateBroker')

# The harnesses the conversion replaces, and the ones it leaves alone.
SEEDING_HARNESSES = ('guildHarness', 'questHarness', 'sessionHarness')
DRIVING_HARNESSES = ('navigationHarness', 'environmentHarness')

# A method body "routes through the framework" when it reaches the runner every ingredient
# ultimately runs through.
FRAMEWORK_ROUTE_RE = re.compile(r'\bdmRegistryBroker\b')

# A method body "still writes directly" when it calls a filesystem function itself — either
# through a namespace import (`fs.writeFileSync(...)`) or a named one (`writeFileSync(...)`) —
# or issues a bare HTTP verb on a Playwright `APIRequestContext` (`request.post('/api/...')`).
# Both are the two ways a harness method in this repo touches real state without going through
# an ingredient's `write` or `api` route.
FS_DIRECT_RE = re.compile(
    r'\bfs\.\w+\('
    r'|\b(?:writeFileSync|appendFileSync|mkdirSync|readFileSync|readdirSync|unlinkSync'
    r'|rmSync|existsSync|copyFileSync|renameSync|rmdirSync|writeFile|appendFile|mkdir'
    r'|readFile|readdir|unlink|rm)\s*\('
)
REQUEST_DIRECT_RE = re.compile(r'\brequest\.(?:get|post|put|patch|delete|head)\s*\(')

# A local helper defined as `const NAME = (` or `const NAME = async (` — the shape every method
# in these harness files takes. The lookahead keeps the match position right before the `(`, so
# the statement scanner below starts reading at the parameter list.
FUNC_CONST_RE = re.compile(r'\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*(?=(?:async\s+)?\()')


def walk_tests():
    e2e, integration = [], []
    for root, dirs, files in os.walk('packages'):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for name in files:
            path = os.path.join(root, name)
            if name.endswith('.e2e.ts'):
                e2e.append(path)
            elif name.endswith('.integration.test.ts'):
                integration.append(path)
    return sorted(e2e), sorted(integration)


def read(path):
    with open(path, encoding='utf-8', errors='ignore') as handle:
        return handle.read()


def is_test_of_a_copies_target(path, body):
    """A test whose describe() names a broker an ingredient's write route calls."""
    described = re.search(r"describe\(\s*'([^']+)'", body)
    subject = described.group(1) if described else os.path.basename(path)
    return any(target in subject for target in COPIES_TARGETS)


def census():
    e2e, integration = walk_tests()
    bodies = {path: read(path) for path in e2e + integration}

    e2e_targets = [p for p in e2e if DOMAIN.search(bodies[p])]
    integration_seeders = [p for p in integration if DOMAIN.search(bodies[p])]
    excluded = [p for p in integration_seeders if is_test_of_a_copies_target(p, bodies[p])]
    integration_targets = [p for p in integration_seeders if p not in excluded]

    call_sites = {}
    for harness in SEEDING_HARNESSES + DRIVING_HARNESSES:
        pattern = re.compile(r'\b' + harness + r'\b')
        call_sites[harness] = sum(len(pattern.findall(body)) for body in bodies.values())

    by_package = {}
    for path in integration_targets:
        package = path.split(os.sep)[1]
        by_package[package] = by_package.get(package, 0) + 1

    return {
        'e2e_files': len(e2e),
        'e2e_targets': [os.path.relpath(p) for p in e2e_targets],
        'integration_files': len(integration),
        'integration_seeders': len(integration_seeders),
        'integration_targets': [os.path.relpath(p) for p in integration_targets],
        'excluded_tests_of_a_copies_target': [os.path.relpath(p) for p in excluded],
        'integration_targets_by_package': by_package,
        'seeding_call_sites': {k: call_sites[k] for k in SEEDING_HARNESSES},
        'driving_call_sites': {k: call_sites[k] for k in DRIVING_HARNESSES},
    }


def report(data):
    print('CONVERSION TARGETS')
    print(f"  e2e specs:            {len(data['e2e_targets'])} of {data['e2e_files']} seed domain state")
    print(f"  integration tests:    {len(data['integration_targets'])} of {data['integration_files']}"
          f" seed domain state and are convertible")
    print(f"  excluded:             {len(data['excluded_tests_of_a_copies_target'])}"
          f" — tests OF a production writer an ingredient copies")
    print()
    print('  integration targets, by package:')
    for package, count in sorted(data['integration_targets_by_package'].items(),
                                 key=lambda row: -row[1]):
        print(f'    {package}: {count}')
    print()
    print('  integration target files:')
    for path in data['integration_targets']:
        print(f'    {path}')
    print()
    print('  EXCLUDED — these keep their own setup:')
    for path in data['excluded_tests_of_a_copies_target']:
        print(f'    {path}')
    print()
    print('CALL SITES the conversion replaces:')
    for harness, count in data['seeding_call_sites'].items():
        print(f'    {harness}: {count}')
    print()
    print('CALL SITES it leaves alone (they drive, they do not seed):')
    for harness, count in data['driving_call_sites'].items():
        print(f'    {harness}: {count}')


def progress(data):
    remaining = sum(data['seeding_call_sites'].values())
    print('CONVERSION PROGRESS')
    for harness, count in data['seeding_call_sites'].items():
        print(f'    {harness}: {count} call sites remaining')
    print(f'    total remaining: {remaining}')
    print()
    print('This counts import lines and harness constructions, not seeding calls, so it cannot fall')
    print('while a harness keeps its call signature and only a method body changes underneath it.')
    print('Run --methods for the mark that moves.')


# ---------------------------------------------------------------------------------------------
# --methods: a per-method census of the three seeding harnesses.
#
# For each method a harness exposes, this reports how many call sites it has across the e2e
# targets, whether its body (or a local helper it calls, transitively) reaches
# `dmRegistryBroker`, and whether it (or a local helper it calls, transitively) still calls a
# filesystem function or an HTTP verb directly. The third column is the one that matters: a
# call-site count can fall because a spec was deleted, and a route-through can be faked by an
# unused import, but a method whose body — followed through every local helper it calls — holds
# no direct write cannot be faked the same way.
# ---------------------------------------------------------------------------------------------

def find_harness_source(name):
    """Locate the *.harness.ts file that exports `name`, and return (path, source)."""
    pattern = re.compile(r'\bexport const ' + re.escape(name) + r'\s*=')
    for root, dirs, files in os.walk('packages'):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for fname in files:
            if fname.endswith('.harness.ts'):
                path = os.path.join(root, fname)
                text = read(path)
                if pattern.search(text):
                    return path, text
    return None, None


def _skip_string_or_comment(text, i):
    """If `text[i:]` opens a string, template literal or comment, return the index just past
    it. Otherwise return None. A template literal's `${...}` sections are code, not text, so
    their contents recurse through this same function rather than being treated as literal."""
    ch = text[i]
    n = len(text)
    if ch == '/' and i + 1 < n and text[i + 1] == '/':
        j = text.find('\n', i)
        return n if j == -1 else j + 1
    if ch == '/' and i + 1 < n and text[i + 1] == '*':
        j = text.find('*/', i + 2)
        return n if j == -1 else j + 2
    if ch in ("'", '"'):
        j = i + 1
        while j < n:
            if text[j] == '\\':
                j += 2
                continue
            if text[j] == ch:
                return j + 1
            j += 1
        return n
    if ch == '`':
        j = i + 1
        depth = 0
        while j < n:
            if text[j] == '\\':
                j += 2
                continue
            if depth == 0:
                if text[j] == '`':
                    return j + 1
                if text[j] == '$' and j + 1 < n and text[j + 1] == '{':
                    depth = 1
                    j += 2
                    continue
                j += 1
                continue
            sub = _skip_string_or_comment(text, j)
            if sub is not None:
                j = sub
                continue
            if text[j] == '{':
                depth += 1
            elif text[j] == '}':
                depth -= 1
            j += 1
        return n
    return None


def _find_matching_close(text, open_index):
    """`open_index` points at an opening bracket. Return the index just past its match."""
    depth = 0
    i = open_index
    n = len(text)
    while i < n:
        skip_to = _skip_string_or_comment(text, i)
        if skip_to is not None:
            i = skip_to
            continue
        ch = text[i]
        if ch in '({[':
            depth += 1
        elif ch in ')}]':
            depth -= 1
            if depth == 0:
                return i + 1
        i += 1
    return n


def _find_statement_end(text, start):
    """From `start` (right after a `const NAME = `), find the top-level terminating `;`."""
    depth = 0
    i = start
    n = len(text)
    while i < n:
        skip_to = _skip_string_or_comment(text, i)
        if skip_to is not None:
            i = skip_to
            continue
        ch = text[i]
        if ch in '({[':
            depth += 1
        elif ch in ')}]':
            depth -= 1
        elif ch == ';' and depth <= 0:
            return i
        i += 1
    return n


def find_all_local_bodies(text):
    """Every top-level `const NAME = (...) => ...` in the file, mapped to its own body text —
    from right after the `=` to the statement's terminating `;`. Picks up both the methods a
    harness exposes and the private helpers they call."""
    bodies = {}
    for match in FUNC_CONST_RE.finditer(text):
        name = match.group(1)
        start = match.end()
        end = _find_statement_end(text, start)
        bodies[name] = text[start:end]
    return bodies


def parse_return_members(text):
    """The harness factory's own `return { ... };` — the LAST one in the file, since a nested
    helper (a `.map()` callback, for instance) can have its own `return {` earlier. Each entry
    is either a bareword (`cleanGuilds`) or a `key: value` pair (`beforeEach: cleanGuilds`);
    returns (exposed_name, local_name) pairs in both cases."""
    matches = list(re.finditer(r'return\s*\{', text))
    if not matches:
        return []
    open_brace = matches[-1].end() - 1
    close = _find_matching_close(text, open_brace)
    inner = text[open_brace + 1:close - 1]

    entries, depth, current, i = [], 0, '', 0
    while i < len(inner):
        skip_to = _skip_string_or_comment(inner, i)
        if skip_to is not None:
            current += inner[i:skip_to]
            i = skip_to
            continue
        ch = inner[i]
        if ch in '({[':
            depth += 1
        elif ch in ')}]':
            depth -= 1
        if ch == ',' and depth == 0:
            entries.append(current)
            current = ''
            i += 1
            continue
        current += ch
        i += 1
    if current.strip():
        entries.append(current)

    members = []
    for entry in entries:
        stripped = re.sub(r'//.*', '', entry).strip()
        if not stripped:
            continue
        pair = re.match(r'^([A-Za-z_$][\w$]*)\s*:\s*([A-Za-z_$][\w$]*)$', stripped)
        if pair:
            members.append((pair.group(1), pair.group(2)))
            continue
        shorthand = re.match(r'^([A-Za-z_$][\w$]*)$', stripped)
        if shorthand:
            members.append((shorthand.group(1), shorthand.group(1)))
    return members


def _local_call_names(body, known_locals):
    return {name for name in known_locals
            if re.search(r'(?<![.\w$])' + re.escape(name) + r'\s*\(', body)}


def _resolve_local(name, local_bodies, memo, seen):
    """Whether `name`'s body — or any local helper it calls, transitively — routes through the
    framework and/or still writes directly. Memoised per harness file; `seen` breaks a cycle."""
    if name in memo:
        return memo[name]
    if name in seen or name not in local_bodies:
        return {'routes': False, 'writes': False}
    seen = seen | {name}
    body = local_bodies[name]
    routes = bool(FRAMEWORK_ROUTE_RE.search(body))
    writes = bool(FS_DIRECT_RE.search(body) or REQUEST_DIRECT_RE.search(body))
    for other in _local_call_names(body, local_bodies.keys()):
        if other == name:
            continue
        sub = _resolve_local(other, local_bodies, memo, seen)
        routes = routes or sub['routes']
        writes = writes or sub['writes']
    result = {'routes': routes, 'writes': writes}
    memo[name] = result
    return result


def methods_census():
    e2e, _ = walk_tests()
    bodies = {path: read(path) for path in e2e}
    e2e_targets = [p for p in e2e if DOMAIN.search(bodies[p])]

    report_rows = {}
    for harness in SEEDING_HARNESSES:
        path, text = find_harness_source(harness)
        if path is None:
            report_rows[harness] = {'path': None, 'methods': []}
            continue
        members = parse_return_members(text)
        local_bodies = find_all_local_bodies(text)
        memo = {}
        methods = []
        for exposed, local in members:
            resolved = _resolve_local(local, local_bodies, memo, set())
            pattern = re.compile(r'\.' + re.escape(exposed) + r'\(')
            call_sites = sum(len(pattern.findall(bodies[p])) for p in e2e_targets)
            methods.append({
                'name': exposed,
                'call_sites': call_sites,
                'routes_through_framework': resolved['routes'],
                'writes_directly': resolved['writes'],
            })
        report_rows[harness] = {'path': os.path.relpath(path), 'methods': methods}
    return report_rows


def methods_report(data):
    print('PER-METHOD CENSUS — call sites across the e2e targets; whether the body (or a local')
    print('helper it calls) reaches dmRegistryBroker; whether it (or a local helper) still calls')
    print('fs.* / a named fs function, or a bare request.<verb>(\'/api/...\').')
    print()
    still_writing = []
    for harness, entry in data.items():
        print(f'{harness} — {entry["path"]}')
        if not entry['methods']:
            print('    NOT FOUND')
            print()
            continue
        print(f'    {"method":36s} {"call sites":>10s}   {"routes thru framework":22s} writes directly')
        for method in entry['methods']:
            routes = 'yes' if method['routes_through_framework'] else 'no'
            writes = 'yes' if method['writes_directly'] else 'no'
            print(f'    {method["name"]:36s} {method["call_sites"]:>10d}   {routes:22s} {writes}')
            if method['writes_directly']:
                still_writing.append(f'{harness}.{method["name"]}')
        print()
    print(f'STILL WRITES DIRECTLY ({len(still_writing)}):')
    for name in still_writing:
        print(f'    {name}')
    print()
    print('Done is every CONVERT-marked method routing through the framework, and this list')
    print('holding nothing the migration plan did not already name to stay raw.')


if __name__ == '__main__':
    if '--methods' in sys.argv:
        methods_report(methods_census())
    else:
        result = census()
        if '--json' in sys.argv:
            print(json.dumps(result, indent=2))
        elif '--progress' in sys.argv:
            progress(result)
        else:
            report(result)
