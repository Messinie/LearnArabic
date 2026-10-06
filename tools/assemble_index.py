#!/usr/bin/env python3
"""
Assemble the merged `index.html`.

    tools/index.template.html   (hub shell: nav, tab bar, overview dashboard,
                                 library, viewer, footer)
  + tools/_leb_style.css        (LebLearn stylesheet)
  + tools/_leb_sections_*.html  (the original app's sections, redistributed
                                 across the tab panels)
  = index.html

The original "Learning Dashboard" block is dropped on purpose: its tiles were
half hard-coded demo numbers (streak 47, "reviewed today 38", "efficiency 96%").
The Overview tab in the template replaces it with charts computed from the real
deck and the real content catalog, reusing the same element ids so the LebLearn
engine keeps updating them.

Run tools/split_leblearn.py first, then tools/build_catalog.py.
"""
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
TOOLS = ROOT / "tools"

tpl = (TOOLS / "index.template.html").read_text(encoding="utf-8")
style = (TOOLS / "_leb_style.css").read_text(encoding="utf-8")
core = (TOOLS / "_leb_sections_core.html").read_text(encoding="utf-8")
rest = (TOOLS / "_leb_sections_rest.html").read_text(encoding="utf-8")


def after(text, marker):
    assert marker in text, marker
    return marker + text.split(marker, 1)[1]


def between(text, start, end):
    assert start in text and end in text, (start, end)
    return start + text.split(start, 1)[1].split(end, 1)[0]


anki = after(core, "<!-- ANKI SRS SECTION -->")           # Anki section only
translit_practice = between(rest, '<div id="translit"', '<div id="vocab"')
vocab = between(rest, '<div id="vocab"', '<div id="tips"')
tips = between(rest, '<div id="tips"', '<div id="anki-modal"')
modals = after(rest, '<div id="anki-modal"')

# Section widths: the tab panels are a touch tighter than the old full-bleed page.
def tighten(html):
    return html.replace("max-w-screen-2xl mx-auto px-8", "max-w-screen-2xl mx-auto px-4 md:px-7")


study = tighten(anki + "\n" + translit_practice)
vocab = tighten(vocab)
tips = tighten(tips)

out = (tpl
       .replace("{{LEB_STYLE}}", style.rstrip())
       .replace("{{SECTIONS_STUDY}}", study.rstrip())
       .replace("{{SECTIONS_DICT}}", vocab.rstrip())
       .replace("{{SECTIONS_TIPS}}", tips.rstrip())
       .replace("{{MODALS}}", modals.rstrip()))

(ROOT / "index.html").write_text(out, encoding="utf-8")
print("index.html written: %.1f KB" % ((ROOT / "index.html").stat().st_size / 1024))

required = ('id="anki-modal"', 'id="deck-modal"', 'id="tip-modal"', 'id="library-grid"',
            'id="viewer-frame"', 'assets/leb-data.js', 'id="practice"', 'id="vocab-table-body"',
            'id="forecast-chart"', 'id="donut-chart"', 'id="category-bars"', 'id="module-bars"',
            'id="tips-grid"', 'id="category-grid"', 'role="tablist"')
for needle in required:
    assert needle in out, needle
assert "{{" not in out, "unreplaced placeholder"
assert "Learning Dashboard" not in out, "old demo dashboard leaked in"
print("sanity checks OK")
