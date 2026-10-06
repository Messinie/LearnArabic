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

| Section | What it is |
| --- | --- |
| **Dashboard** | Streak, due cards, mastery and category progress (from the Lebanese Anki app) |
| **Anki SRS** | The SM-2 flashcard review, 105,252 cards: curated Lebanese deck + MSA / Levantine / dialect reference |
| **Library** | **All 264 pages from every old module**, searchable in English *and* Arabic, filterable by module and by type (lesson / audio / quiz / game / flashcards / tool / overview) |
| **Modules** | The old sites as one grid — tap a module to filter the library |
| **Audio Library** | Every `.mp3` / `.wav` in the repo, playable inline |
| **Transliteration Lab** | The 3/7/9/2 transliteration trainer |
| **Practice** | Typing, multiple choice, listening and matching drills |
| **Dictionary** | The full searchable word table with transliterations |
| **Tips** | Lebanese-specific learning notes |

Lessons open **inside** the hub in a viewer (title bar, back button, "open in new
tab"), so you never leave the app. Deep links work too:
`index.html#view=Grammar/dual.html`.
Every page also got a floating **LebLearn Hub** pill, so pages opened directly
still lead back into the merged app. Recently opened lessons are remembered in
`localStorage` and shown under the hero.

Keyboard: `⌘K` / `Ctrl+K` jumps to the library search, `Esc` closes the viewer.

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
