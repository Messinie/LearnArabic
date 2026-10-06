#!/usr/bin/env python3
"""
Scan every HTML page in the repository and emit `assets/catalog.js`, the content
index that powers the merged hub's Library (search / filter / in-app viewer).

For each page we pull out: title, description, module, content type, whether it
embeds audio or interactive drills, and a handful of Arabic keywords so the hub
search can match Arabic as well as English.
"""
import html
import json
import pathlib
import re
from collections import Counter

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "catalog.js"

SKIP_FILES = {
    "index.html",                 # the merged hub itself
    "lebanese-arabic-anki.html",  # merged into the hub
    "NAVIGATION_TEMPLATE.html",   # snippet, not a page
}
SKIP_DIRS = {".git", "assets", "tools", "node_modules"}

MODULES = {
    "Vocabulary":          ("Vocabulary",        "fa-book-bookmark",   "from-violet-400 to-purple-400",  "Thematic word lists, lesson vocab and flashcards"),
    "VocabPractice":       ("Vocab Practice",    "fa-pen-to-square",   "from-fuchsia-400 to-pink-400",   "Drills and exercises that recycle the lesson vocabulary"),
    "Grammar":             ("Grammar",           "fa-diagram-project", "from-sky-400 to-blue-400",       "Verb patterns, cases, negation, conditionals and more"),
    "Reading":             ("Reading",           "fa-book-open",       "from-orange-400 to-amber-400",   "Texts, stories and comprehension work"),
    "Listening":           ("Listening",         "fa-headphones",      "from-emerald-400 to-teal-400",   "Audio lessons with transcripts and questions"),
    "Games":               ("Games",             "fa-gamepad",         "from-red-400 to-orange-400",     "Playable drills: memory, scramble, hangman, trivia"),
    "Quizzes":             ("Quizzes",           "fa-circle-question", "from-yellow-400 to-amber-400",   "Assessments and knowledge checks"),
    "Culture":             ("Culture",           "fa-mosque",          "from-amber-400 to-yellow-300",   "History, arts, cuisine, cinema and traditions"),
    "Minorities":          ("Minorities",        "fa-users-between-lines", "from-stone-400 to-amber-300", "Communities of the Arab world and their languages"),
    "EgyptianArabic":      ("Egyptian Arabic",   "fa-landmark",        "from-lime-400 to-green-400",     "Masri dialect lessons: tenses, numbers, negation"),
    "EgyptianArabicModule": ("Egyptian Module",  "fa-landmark-dome",   "from-green-400 to-emerald-400",  "The packaged Egyptian Arabic course"),
    "Week1":               ("Week 1",            "fa-1",               "from-indigo-400 to-violet-400",  "Intensive week one material"),
    "Week2":               ("Week 2",            "fa-2",               "from-violet-400 to-fuchsia-400", "Intensive week two material"),
    "AI":                  ("AI Tutor",          "fa-robot",           "from-cyan-400 to-sky-400",       "AI chat tutor and image-prompt speaking tasks"),
    "Teachers":            ("Teacher Tools",     "fa-chalkboard-user", "from-slate-400 to-slate-300",    "Classroom utilities: timers, groups, grading, canvas"),
    "ML":                  ("ML Notes",          "fa-microchip",       "from-teal-400 to-cyan-400",      "Machine-learning fundamentals notebooks"),
    "ROOT":                ("Hubs & Canvas",     "fa-compass",         "from-rose-400 to-pink-400",      "The earlier landing pages plus the Canvas lesson generators"),
}

TITLE_CLEAN = re.compile(
    r"\s*[-–—|•]\s*(Context Arabic|Al-?Manara.*|Arabic Learning Hub.*|Context.*|LearnArabic.*)$",
    re.I,
)
TAG_RE = re.compile(r"<[^>]+>")
ARABIC_WORD = re.compile(r"[\u0621-\u064A][\u0621-\u064A\u064B-\u0652]{2,}")
STOP_AR = {
    "الذي", "التي", "هذا", "هذه", "ذلك", "على", "من", "إلى", "عن", "في", "مع",
    "كان", "كانت", "يكون", "أنت", "أنا", "نحن", "هم", "هي", "هو", "ما", "لا",
    "الله", "بين", "كل", "بعد", "قبل", "عند", "لكن", "أو", "ثم", "قد", "حتى",
}


def text_of(fragment: str) -> str:
    txt = TAG_RE.sub(" ", fragment)
    txt = html.unescape(txt)
    return re.sub(r"\s+", " ", txt).strip()


def guess_kind(path: str, raw: str, low: str) -> str:
    name = path.rsplit("/", 1)[-1].lower()
    if name == "index.html":
        return "index"
    if "<audio" in low or ".mp3" in low or ".wav" in low:
        return "audio"
    if any(k in low for k in ("kahoot", "game", "hangman", "scramble", "memory")):
        return "game"
    if low.count("quiz") > 3 or "questions = [" in low or "checkanswer" in low:
        return "quiz"
    if "flashcard" in low:
        return "flashcards"
    if any(k in low for k in ("timer", "calculator", "picker", "roller", "group_maker")):
        return "tool"
    return "lesson"


def describe(raw: str) -> str:
    m = re.search(r'<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']+)', raw, re.I)
    if m:
        return html.unescape(m.group(1)).strip()
    # first reasonably long paragraph or subtitle
    for pat in (r"<p[^>]*>(.*?)</p>", r"<h2[^>]*>(.*?)</h2>", r"<h3[^>]*>(.*?)</h3>"):
        for frag in re.findall(pat, raw, re.S | re.I)[:14]:
            t = text_of(frag)
            if 35 <= len(t) <= 240 and "function" not in t:
                return t
    return ""


def keywords(raw: str) -> str:
    body = raw.split("<body", 1)[-1]
    body = re.sub(r"<script.*?</script>", " ", body, flags=re.S | re.I)
    body = re.sub(r"<style.*?</style>", " ", body, flags=re.S | re.I)
    words = [w for w in ARABIC_WORD.findall(text_of(body)) if w not in STOP_AR]
    common = [w for w, _ in Counter(words).most_common(10)]
    return " ".join(common)


entries = []
for path in sorted(ROOT.rglob("*.html")):
    rel = path.relative_to(ROOT).as_posix()
    if any(part in SKIP_DIRS for part in rel.split("/")[:-1]):
        continue
    if rel in SKIP_FILES or path.name.startswith("_"):
        continue

    raw = path.read_text(encoding="utf-8", errors="ignore")
    low = raw.lower()

    folder = rel.split("/")[0] if "/" in rel else "ROOT"
    if folder == "ML" and "/" in rel:
        folder = "ML"

    m = re.search(r"<title[^>]*>(.*?)</title>", raw, re.S | re.I)
    title = text_of(m.group(1)) if m else ""
    if not title:
        m = re.search(r"<h1[^>]*>(.*?)</h1>", raw, re.S | re.I)
        title = text_of(m.group(1)) if m else ""
    if not title:
        title = path.stem.replace("_", " ").title()
    title = TITLE_CLEAN.sub("", title).strip(" -–—|•") or path.stem

    desc = describe(raw)
    if len(desc) > 180:
        desc = desc[:177].rsplit(" ", 1)[0] + "…"

    entries.append({
        "p": rel,
        "t": title,
        "d": desc,
        "m": folder,
        "k": guess_kind(rel, raw, low),
        "a": bool(re.search(r"<audio|\.mp3|\.wav", low)),
        "s": round(path.stat().st_size / 1024),
        "ar": keywords(raw),
    })

# media files (audio) are listed too so the hub can expose the listening library
media = []
for pattern in ("*.mp3", "*.wav"):
    for path in sorted(ROOT.rglob(pattern)):
        rel = path.relative_to(ROOT).as_posix()
        if any(part in SKIP_DIRS for part in rel.split("/")[:-1]):
            continue
        media.append({
            "p": rel,
            "t": path.stem,
            "m": rel.split("/")[0] if "/" in rel else "ROOT",
            "s": round(path.stat().st_size / 1024),
        })

modules = {k: {"label": v[0], "icon": v[1], "grad": v[2], "blurb": v[3]} for k, v in MODULES.items()}
present = sorted({e["m"] for e in entries})
for key in present:
    modules.setdefault(key, {"label": key, "icon": "fa-folder", "grad": "from-slate-400 to-slate-300", "blurb": ""})

OUT.parent.mkdir(exist_ok=True)
OUT.write_text(
    "/* Generated by tools/build_catalog.py — do not hand-edit. */\n"
    "window.MODULE_META = " + json.dumps(modules, ensure_ascii=False, indent=1) + ";\n"
    "window.CONTENT_CATALOG = " + json.dumps(entries, ensure_ascii=False) + ";\n"
    "window.MEDIA_CATALOG = " + json.dumps(media, ensure_ascii=False) + ";\n",
    encoding="utf-8",
)

print(f"{len(entries)} pages, {len(media)} audio files -> {OUT.relative_to(ROOT)} "
      f"({OUT.stat().st_size/1024:.0f} KB)")
by_mod = Counter(e["m"] for e in entries)
for k, v in by_mod.most_common():
    print(f"  {k:24s} {v}")
