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


# The Transliteration Lab's "Key Lebanese Sounds" card was a static list of
# chat-alphabet digits; swap it for a live panel that follows the chosen
# transliteration style (assets/leb-translit.js renders it).
sound_card_start = "<!-- Key sounds -->"
sound_card_end = '<div class="dark-glass rounded-3xl p-5">\n                <div class="font-bold mb-3">Transliteration Drills'
assert sound_card_start in translit_practice and sound_card_end in translit_practice
head, tail = translit_practice.split(sound_card_start, 1)
_, tail = tail.split(sound_card_end, 1)
translit_practice = (head
                     + '<!-- live sound key, follows the transliteration setting -->\n'
                     + '            <div id="sound-key" class="dark-glass rounded-3xl p-5"></div>\n            '
                     + sound_card_end + tail)

# the static "Sa7tayn" sample in the third card is rendered by the engine now
translit_practice = translit_practice.replace(
    '<div class="text-xs text-slate-300">Sa7tayn</div>',
    '<div class="text-xs text-slate-300" data-translit="Sa7tayn">Sa7tayn</div>')

anki = anki.replace(
    '<div class="text-xs font-bold text-indigo-300 translit-highlight">Mar7aba</div>',
    '<div class="text-xs font-bold text-indigo-300 translit-highlight" data-translit="Mar7aba">Mar7aba</div>')

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
            'id="sound-key"', 'assets/leb-translit.js', 'assets/leb-speech.js', 'assets/leb-prefs.js',
            'wordmark', 'id="translit-toggle"',
            'id="tips-grid"', 'id="category-grid"', 'role="tablist"')
for needle in required:
    assert needle in out, needle
assert "{{" not in out, "unreplaced placeholder"
assert "Learning Dashboard" not in out, "old demo dashboard leaked in"
assert "Key Lebanese Sounds" not in out, "static sound card leaked in"
assert out.count('data-translit=') >= 2, "static transliteration samples not tagged"
print("sanity checks OK")
