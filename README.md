# LebLearn Hub — one merged Arabic learning app

Everything that used to be a separate little site in this repo (Grammar, Vocabulary,
Vocab Practice, Reading, Listening, Culture, Minorities, Games, Egyptian Arabic,
Week 1/2, Quizzes, Teacher tools, AI tutor, ML notes, the old Al-Manara / Context
landing pages) now lives inside **one** application that uses the design and the
engine of the Lebanese Arabic Anki app.

**Open `index.html`.** That is the whole site.

```
index.html                 ← the merged hub (LebLearn shell + everything else)
├── assets/leb-data.js     ← seed deck + curated dictionaries + 105k-word reference
├── assets/leb-app.js      ← the LebLearn engine (SM-2 SRS, quizzes, drills, tables)
├── assets/catalog.js      ← generated index of all 264 pages + 14 audio files
├── assets/hub.js          ← library search / module grid / in-app viewer / recents
└── assets/leb-shell.js    ← tiny "back to hub" pill injected into every page
```

## What the hub contains

The app is organised as **five tabs** instead of one endless scroll:

| Tab | What's in it |
| --- | --- |
| **Overview** | A command center, not a landing page: live KPIs (due now, mastery, learnable deck, dictionary size, lesson pages, audio minutes), a **14-day review forecast** bar chart with overdue stacked onto today, a **deck-composition donut** (new / learning / mature), **mastery-by-category** bars, a **content map** of all merged modules by page count, a type breakdown, "do this next" shortcuts, word of the day, and your recently opened lessons |
| **Study** | Anki SM-2 flashcards + deck browser (105,252 cards), the transliteration lab, and the practice drills |
| **Library** | **All 264 pages from every old module**, searchable in English *and* Arabic, filterable by module and by type (lesson / audio / quiz / game / flashcards / tool / overview), plus the module grid and the audio library |
| **Dictionary** | The full searchable word table with transliterations |
| **Tips** | Lebanese-specific learning notes |

Every number on the Overview tab is computed at runtime from the live deck and
the generated catalog — the old dashboard's hard-coded "47-day streak / 38
reviewed today / 96% efficiency" tiles are gone. Charts are hand-rolled inline
SVG (no chart library, no extra network request) and each one exposes a text
summary to screen readers.

Lessons open **inside** the hub in a viewer (title bar, back button, "open in new
tab"), so you never leave the app. Deep links work too:
`index.html#view=Grammar/dual.html`, or `#library`, `#study`, `#practice`, `#media`…
Every page also got a floating **LebLearn Hub** pill, so pages opened directly
still lead back into the merged app. Recently opened lessons are remembered in
`localStorage`.

### Accessibility & interaction

* Proper `tablist` / `tab` / `tabpanel` semantics with arrow-key, Home/End navigation
* `⌘K` / `Ctrl+K` jumps to the library search, `Esc` closes the viewer
* Skip-to-content link, visible focus rings, `aria-pressed` filter chips, live result count
* Charts carry `role="img"` + `aria-label`, bars have `<title>` tooltips, and every
  chart row is a real button (click a category to drill it, a module to filter the library)
* `prefers-reduced-motion` disables the animations and the shimmer effect

## Running it

It is pure static HTML/JS — no build step, no dependencies:

```bash
python3 -m http.server 8000      # then open http://localhost:8000
```

(Opening `index.html` straight from disk works too; a server is recommended so the
audio files and iframes behave consistently.)

## Regenerating the merged files

The hub is assembled from the original monolithic app
(`lebanese-arabic-anki.html`, kept untouched as the source of the Lebanese data)
plus the repository content:

```bash
python3 tools/split_leblearn.py    # monolith -> assets/leb-data.js + assets/leb-app.js + section partials
python3 tools/build_catalog.py     # scan every page -> assets/catalog.js
python3 tools/assemble_index.py    # hub template + partials -> index.html
python3 tools/inject_shell.py      # add the back-to-hub pill to new pages (idempotent)
```

Run those four after adding new lesson pages and they will show up in the library
automatically. `tools/_leb_*.html|css` are generated intermediates.

## Legacy

* `lebanese-arabic-anki.html` — the original standalone Lebanese Anki app (source of the data).
* `legacy-context-hub.html`, `ll.html` — the previous landing pages, still browsable from the library under *Hubs & Canvas*.
* The per-module `index.html` pages (e.g. `Grammar/index.html`) still work and now link home to the merged hub.
