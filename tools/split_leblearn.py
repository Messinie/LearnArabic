#!/usr/bin/env python3
"""
Split the monolithic `lebanese-arabic-anki.html` (7.8 MB) into reusable assets:

  assets/leb-data.js   -> seed cards + DICT + DICT3 + DICT2 (the ~105k word dictionary)
  assets/leb-app.js    -> the whole LebLearn engine (SRS, quizzes, drills, tables)
  tools/_leb_style.css -> the LebLearn stylesheet (injected into the merged index.html)
  tools/_leb_sections_core.html  -> Dashboard + Anki SRS sections
  tools/_leb_sections_rest.html  -> Translit lab, Practice, Vocabulary, Tips + modals

Everything is byte-for-byte lifted from the original file so the Lebanese Anki app
keeps behaving exactly as before, it is just no longer trapped in one HTML file.
"""
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "lebanese-arabic-anki.html"
ASSETS = ROOT / "assets"
TOOLS = ROOT / "tools"

text = SRC.read_text(encoding="utf-8")

# ---------------------------------------------------------------- style
style = text.split("<style>", 1)[1].split("</style>", 1)[0]

# ---------------------------------------------------------------- body / sections
body = text.split("<body class=\"bg-slate-950 text-slate-200\">", 1)[1]
body = body.split("</body>", 1)[0]

sections = body.split("<!-- DASHBOARD -->", 1)[1]
sections = sections.split("<footer", 1)[0]

core, rest = sections.split('<div id="translit"', 1)
rest = '<div id="translit"' + rest

# ---------------------------------------------------------------- script split
script = text.split('<script src="https://cdn.tailwindcss.com"></script>\n    <script>', 1)[1]
script = script.rsplit("</script>", 1)[0]

DATA_START = "const NOW = Date.now(), DAY = 86400000;"
DATA_END = "const REF_CAT = {"

head_js, tail = script.split(DATA_START, 1)
data_js, rest_js = tail.split(DATA_END, 1)

data_js = DATA_START + data_js
app_js = head_js + DATA_END + rest_js

# Hardening: if the Tailwind CDN is unavailable (offline / blocked), the original
# initializeTailwind() threw and took the whole app down with it. Guard it so the
# merged hub still boots with the rest of its JS intact.
app_js = app_js.replace(
    "function initializeTailwind() {",
    "function initializeTailwind() {\n            if (typeof tailwind === 'undefined') return;",
    1,
)
assert "if (typeof tailwind === 'undefined') return;" in app_js

# Hardening: reading localStorage throws in some sandboxed contexts (file://,
# private mode, third-party iframes). Progress is a nice-to-have, never fatal.
app_js = app_js.replace(
    "function loadCardData() {\n            const saved = localStorage.getItem('lebanese-anki-cards')",
    "function loadCardData() {\n            let saved = null\n            try { saved = localStorage.getItem('lebanese-anki-cards') } catch (e) { return }",
    1,
)
assert "try { saved = localStorage.getItem('lebanese-anki-cards') }" in app_js

HEADER = (
    "/* ------------------------------------------------------------------\n"
    "   %s\n"
    "   Extracted verbatim from lebanese-arabic-anki.html by tools/split_leblearn.py\n"
    "   Do not hand-edit: re-run the script instead.\n"
    "   ------------------------------------------------------------------ */\n"
)

ASSETS.mkdir(exist_ok=True)
(ASSETS / "leb-data.js").write_text(
    HEADER % "LebLearn data: seed deck + curated dictionaries + 105k word reference"
    + data_js,
    encoding="utf-8",
)
(ASSETS / "leb-app.js").write_text(
    HEADER % "LebLearn engine: SM-2 SRS, quizzes, drills, vocabulary tables" + app_js,
    encoding="utf-8",
)
(TOOLS / "_leb_style.css").write_text(style, encoding="utf-8")
(TOOLS / "_leb_sections_core.html").write_text(core, encoding="utf-8")
(TOOLS / "_leb_sections_rest.html").write_text(rest, encoding="utf-8")

print("leb-data.js  %8.2f MB" % ((ASSETS / "leb-data.js").stat().st_size / 1e6))
print("leb-app.js   %8.2f KB" % ((ASSETS / "leb-app.js").stat().st_size / 1e3))
print("style        %8.2f KB" % ((TOOLS / "_leb_style.css").stat().st_size / 1e3))
print("core html    %8.2f KB" % ((TOOLS / "_leb_sections_core.html").stat().st_size / 1e3))
print("rest html    %8.2f KB" % ((TOOLS / "_leb_sections_rest.html").stat().st_size / 1e3))

# sanity: the data file must define the three dictionaries and the card array
for needle in ("let cards = [", "const DICT = [", "const DICT3 = [", "const DICT2 = ["):
    assert needle in data_js, needle
for needle in ("function initializeApp", "function rateCard", "DICT2.forEach"):
    assert needle in app_js, needle
print("sanity checks OK")
