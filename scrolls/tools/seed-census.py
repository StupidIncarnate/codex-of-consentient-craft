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

USAGE — from the repo root:

    python3 scrolls/tools/seed-census.py              # the census plus the target list
    python3 scrolls/tools/seed-census.py --progress   # remaining call sites, for the running mark
    python3 scrolls/tools/seed-census.py --json       # machine-readable, for a planner's own tooling
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
    print('Zero across all three is the conversion finished. Run this after each batch;')
    print('the number only falls, and a batch that does not move it converted nothing.')


if __name__ == '__main__':
    result = census()
    if '--json' in sys.argv:
        print(json.dumps(result, indent=2))
    elif '--progress' in sys.argv:
        progress(result)
    else:
        report(result)
