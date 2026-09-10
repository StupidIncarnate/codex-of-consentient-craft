"""
Sweeps every file ward would check, twenty at a time, and collects what each batch found.

WHY BATCHES AND NOT ONE FULL RUN. A file-scoped ward run takes jest's IN-BAND branch, which
carries `--detectOpenHandles` — and that sees sockets, child processes and file watchers, not just
the timers a worker run can catch. A full run cannot: `shouldRunInBand` in @jest/core reads
`if (runInBand || detectOpenHandles) return true`, so asking for it single-threads the repo. So the
sweep finds a strictly larger set of leaks than `npm run ward` does, which is the point.

Typecheck is NOT in the batches. `tsc` has no per-file mode — it grades the whole package whatever
paths it is handed — so running it once per batch would run it a hundred times for one answer. It
gets one pass per package instead.

  python3 tmp/sweep/sweep.py <out-dir> [--batch 20] [--jobs 3] [--packages a,b]
"""
import argparse, json, os, re, subprocess, sys, time
from concurrent.futures import ThreadPoolExecutor

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
# What ward's lint check discovers, from checkCommandsStatics.lint.discoverPatterns.
EXTS = ('.ts', '.tsx', '.js', '.jsx')
ROOTS = ('src', 'bin', 'test')
SKIP_DIRS = {'node_modules', 'dist', 'coverage', 'test-results', '.ward'}


def packages():
    base = os.path.join(REPO, 'packages')
    return sorted(
        name for name in os.listdir(base)
        if os.path.isdir(os.path.join(base, name, 'src'))
    )


def files_for(pkg):
    found = []
    for root_name in ROOTS:
        root = os.path.join(REPO, 'packages', pkg, root_name)
        if not os.path.isdir(root):
            continue
        for dirpath, dirnames, filenames in os.walk(root):
            dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
            for name in filenames:
                if name.endswith(EXTS):
                    found.append(os.path.relpath(os.path.join(dirpath, name), REPO))
    return sorted(found)


def run_ward(args, log_path):
    started = time.time()
    with open(log_path, 'w') as log:
        proc = subprocess.run(
            ['npm', 'run', 'ward', '--'] + args,
            cwd=REPO, stdout=log, stderr=subprocess.STDOUT,
        )
    return proc.returncode, time.time() - started


SECTION = re.compile(r'^--- (.+?) ---$')


def parse_log(path):
    """Splits a ward log into its summary lines and its `--- <name> ---` sections."""
    text = open(path, errors='replace').read()
    # Ward redraws progress lines with \r and ANSI; keep only what survived.
    text = re.sub(r'\x1b\[[0-9;]*[A-Za-z]', '', text).replace('\r', '\n')
    lines = text.split('\n')
    summary = [l for l in lines if re.match(r'^(lint|typecheck|unit|integration|e2e|run):', l)]
    sections, current = {}, None
    for line in lines:
        hit = SECTION.match(line.strip())
        if hit:
            current = hit.group(1)
            sections.setdefault(current, [])
            continue
        if current is not None and line.strip():
            sections[current].append(line.rstrip())
    return {'summary': summary, 'sections': sections, 'text': text}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('out')
    ap.add_argument('--batch', type=int, default=20)
    ap.add_argument('--jobs', type=int, default=3)
    ap.add_argument('--packages', default='')
    ap.add_argument('--skip-typecheck', action='store_true')
    args = ap.parse_args()

    os.makedirs(args.out, exist_ok=True)
    logs = os.path.join(args.out, 'logs')
    os.makedirs(logs, exist_ok=True)

    wanted = [p.strip() for p in args.packages.split(',') if p.strip()] or packages()

    jobs = []
    if not args.skip_typecheck:
        for pkg in wanted:
            jobs.append({
                'id': f'typecheck-{pkg}', 'package': pkg, 'kind': 'typecheck',
                'args': ['--only', 'typecheck', '--', f'packages/{pkg}'], 'files': [],
            })
    for pkg in wanted:
        found = files_for(pkg)
        for index in range(0, len(found), args.batch):
            chunk = found[index:index + args.batch]
            jobs.append({
                'id': f'{pkg}-{index // args.batch:04d}', 'package': pkg, 'kind': 'batch',
                'args': ['--only', 'lint,unit,integration', '--'] + chunk, 'files': chunk,
            })

    print(f'{len(jobs)} jobs across {len(wanted)} packages, {args.jobs} at a time', flush=True)
    done = [0]

    def work(job):
        log_path = os.path.join(logs, f'{job["id"]}.log')
        code, seconds = run_ward(job['args'], log_path)
        job.update({'exitCode': code, 'seconds': round(seconds, 1), 'log': log_path})
        done[0] += 1
        print(f'  [{done[0]}/{len(jobs)}] {job["id"]} exit {code} in {seconds:.0f}s', flush=True)
        return job

    with ThreadPoolExecutor(max_workers=args.jobs) as pool:
        results = list(pool.map(work, jobs))

    for job in results:
        job['parsed'] = parse_log(job['log'])

    with open(os.path.join(args.out, 'results.json'), 'w') as out:
        json.dump(results, out, indent=1)

    failed = [j for j in results if j['exitCode'] != 0]
    leaks = [j for j in results if any(k.startswith('open handles') for k in j['parsed']['sections'])]
    slow = [j for j in results if any(k.startswith('slow files') for k in j['parsed']['sections'])]
    print(f'\n{len(failed)} jobs failed, {len(leaks)} reported open handles, {len(slow)} reported slow files')
    print(f'results: {os.path.join(args.out, "results.json")}')


if __name__ == '__main__':
    main()
