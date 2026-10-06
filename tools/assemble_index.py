#!/usr/bin/env python3
"""
Assemble the merged `index.html`:

    tools/index.template.html  (hub shell: nav, hero, library, modules, viewer)
  + tools/_leb_style.css       (LebLearn stylesheet)
  + tools/_leb_sections_*.html (Dashboard, Anki, Translit lab, Practice, Vocab, Tips)
  = index.html

Run tools/split_leblearn.py first (it produces the _leb_* parts and the
assets/leb-*.js bundles), then tools/build_catalog.py for assets/catalog.js.
"""
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
TOOLS = ROOT / "tools"

tpl = (TOOLS / "index.template.html").read_text(encoding="utf-8")
style = (TOOLS / "_leb_style.css").read_text(encoding="utf-8")
core = (TOOLS / "_leb_sections_core.html").read_text(encoding="utf-8")
rest = (TOOLS / "_leb_sections_rest.html").read_text(encoding="utf-8")

# The Anki section's old copy still said "Lebanese dictionary only" — the deck is
# unchanged, but the section now sits inside the merged hub.
core = core.replace(
    "Spaced repetition + transliteration mastery",
    "Spaced repetition + transliteration mastery • merged with every lesson module",
)

out = (tpl
       .replace("{{LEB_STYLE}}", style.rstrip())
       .replace("{{SECTIONS_CORE}}", "    <!-- DASHBOARD -->" + core.rstrip())
       .replace("{{SECTIONS_REST}}", rest.rstrip()))

(ROOT / "index.html").write_text(out, encoding="utf-8")
print("index.html written: %.1f KB" % ((ROOT / "index.html").stat().st_size / 1024))

for needle in ('id="anki-modal"', 'id="library-grid"', 'id="viewer-frame"',
               'assets/leb-data.js', 'id="practice"', 'id="vocab"'):
    assert needle in out, needle
print("sanity checks OK")
