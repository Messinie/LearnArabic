#!/usr/bin/env python3
"""
Inject `assets/leb-shell.js` into every merged page so that each old sub-site
page knows it now belongs to the LebLearn hub (floating back-to-hub pill when
opened directly, silent when loaded inside the hub viewer).

Idempotent: running it twice changes nothing.
"""
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SKIP_FILES = {"index.html", "lebanese-arabic-anki.html", "NAVIGATION_TEMPLATE.html"}
SKIP_DIRS = {".git", "assets", "tools", "node_modules"}
MARKER = "assets/leb-shell.js"

added, already, no_body = 0, 0, []

for path in sorted(ROOT.rglob("*.html")):
    rel = path.relative_to(ROOT).as_posix()
    if any(part in SKIP_DIRS for part in rel.split("/")[:-1]):
        continue
    if rel in SKIP_FILES or path.name.startswith("_"):
        continue

    raw = path.read_text(encoding="utf-8", errors="ignore")
    if MARKER in raw:
        already += 1
        continue

    depth = rel.count("/")
    prefix = "../" * depth
    tag = ('    <!-- LebLearn hub shell -->\n'
           f'    <script src="{prefix}{MARKER}" defer></script>\n')

    if re.search(r"</body\s*>", raw, re.I):
        new = re.sub(r"</body\s*>", tag + "</body>", raw, count=1, flags=re.I)
    elif re.search(r"</html\s*>", raw, re.I):
        new = re.sub(r"</html\s*>", tag + "</html>", raw, count=1, flags=re.I)
    else:
        new = raw + "\n" + tag
        no_body.append(rel)

    path.write_text(new, encoding="utf-8")
    added += 1

print(f"injected into {added} pages, {already} already had it")
if no_body:
    print("appended at EOF (no </body>):", ", ".join(no_body))
