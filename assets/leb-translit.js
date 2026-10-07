/* ---------------------------------------------------------------------------
   Transliteration style — "plain letters" vs "chat alphabet"

   Lebanese Arabic is usually typed with the Arabic chat alphabet, where digits
   stand in for sounds English has no letter for (mar7aba, 3afak, 9ahwe…).
   That is confusing if you have never seen it, so this module rewrites every
   transliteration in the app into plain Latin letters that still sound right:

        7 → h      mar7aba   → marhaba
        5 → kh     5ayr      → khayr
        8 → gh     8ali      → ghali
        9 → q      9ahwe     → qahwe
        6 → t      6ayyib    → tayyib
        4 → th     4alatha   → thalatha
        3 → ʼ      ma3lesh   → ma'lesh   (dropped at the start: 3afak → afak)
        2 → ʼ      so2al     → so'al     (dropped at the start: 2ahwe → ahwe)

   Plain mode is ON by default; the Settings dialog and the Transliteration Lab
   both expose the switch. Standalone numbers ("es-sa3a 5", "10,000") are left
   alone — only digits sitting inside a word are letters.
   --------------------------------------------------------------------------- */
(function () {
    'use strict'

    var KEY = 'leblearn-translit-mode'
    var LETTER_MAP = { '7': 'h', '5': 'kh', '8': 'gh', '9': 'q', '6': 't', '4': 'th' }
    var GLOTTAL = { '2': true, '3': true }

    var mode = 'plain'
    try { mode = localStorage.getItem(KEY) || 'plain' } catch (e) { }
    if (mode !== 'chat') mode = 'plain'

    /* ----------------------------------------------------------- converter */
    function convertToken(tok) {
        if (!/[A-Za-z]/.test(tok)) return tok          // a real number — leave it
        var out = ''
        for (var i = 0; i < tok.length; i++) {
            var ch = tok[i]
            if (GLOTTAL[ch]) {
                if (i > 0) out += '\u2019'             // ’ inside a word
                // dropped when the word starts with it: 3afak → afak
            } else if (LETTER_MAP[ch]) {
                out += LETTER_MAP[ch]
            } else {
                out += ch
            }
        }
        return out
    }

    function convert(s) {
        if (!s || typeof s !== 'string') return s
        if (!/[2-9]/.test(s)) return s
        var re = /[A-Za-z0-9\u2019']+/g
        var out = '', last = 0, m
        while ((m = re.exec(s)) !== null) {
            out += s.slice(last, m.index)
            var tok = convertToken(m[0])
            // keep sentence capitalisation when the first letter came from a digit
            if (/^[0-9]/.test(m[0]) && tok) {
                var before = s.slice(0, m.index)
                if (/(^|[.!?؟:])\s*$/.test(before)) tok = tok.charAt(0).toUpperCase() + tok.slice(1)
            }
            out += tok
            last = m.index + m[0].length
        }
        return out + s.slice(last)
    }

    /* ------------------------------------------------------- apply to data */
    function applyToCards() {
        if (typeof cards === 'undefined' || !cards) return
        var plain = mode === 'plain'
        for (var i = 0; i < cards.length; i++) {
            var c = cards[i]
            if (c.translitChat === undefined) {
                c.translitChat = c.translit
                c.exampleChat = c.example
            }
            c.translit = plain ? convert(c.translitChat) : c.translitChat
            c.example = plain ? convert(c.exampleChat || '') : (c.exampleChat || '')
        }
    }

    function applyToDrills() {
        var plain = mode === 'plain'
        if (typeof sentences !== 'undefined' && sentences) {
            sentences.forEach(function (s) {
                if (s.__s === undefined) { s.__s = s.s; s.__blank = s.blank }
                s.s = plain ? convert(s.__s) : s.__s
                s.blank = plain ? convert(s.__blank) : s.__blank
            })
        }
        if (typeof scenarios !== 'undefined' && scenarios) {
            scenarios.forEach(function (sc) {
                (sc.nodes || []).forEach(function (n) {
                    if (n.__text === undefined) n.__text = n.text
                    n.text = plain ? convert(n.__text) : n.__text
                        ; (n.options || []).forEach(function (o) {
                            if (o.__t === undefined) o.__t = o.t
                            o.t = plain ? convert(o.__t) : o.__t
                        })
                })
            })
        }
    }

    function apply() {
        applyToCards()
        applyToDrills()
    }

    /* --------------------------------------------------------- re-renders */
    function refreshUI() {
        try { if (typeof updateAllStats === 'function') updateAllStats() } catch (e) { }
        try {
            if (typeof filterVocabTable === 'function') filterVocabTable()
            else if (typeof renderVocabTable === 'function') renderVocabTable(cards)
        } catch (e) { }
        try {
            var deck = document.getElementById('deck-modal')
            if (deck && !deck.classList.contains('hidden') && typeof filterDeckTable === 'function') filterDeckTable()
        } catch (e) { }
        try {
            var anki = document.getElementById('anki-modal')
            if (anki && anki.style.display === 'flex' && typeof renderCurrentCard === 'function') renderCurrentCard()
        } catch (e) { }
        try { if (window.HUB && window.HUB.refresh) window.HUB.refresh() } catch (e) { }
        renderSoundKey()
        paintNavToggle()
        paintStaticSamples()
    }

    function setMode(next) {
        mode = next === 'chat' ? 'chat' : 'plain'
        try { localStorage.setItem(KEY, mode) } catch (e) { }
        apply()
        refreshUI()
    }

    /* --------------------------------------------- matching / search help */
    function loose(s) {
        return String(s || '').toLowerCase()
            .replace(/[\s.,!?؟'\u2019\-]/g, '')
    }
    /* a typed answer counts if it matches either spelling of the word */
    window.translitMatch = function (input, card) {
        var a = loose(input)
        if (!a) return false
        var forms = [card.translit, card.translitChat, convert(card.translitChat || card.translit)]
        for (var i = 0; i < forms.length; i++) {
            if (forms[i] && loose(forms[i]) === a) return true
        }
        return false
    }
    /* search boxes should find "mar7aba" and "marhaba" alike */
    window.translitSearch = function (card, needle) {
        var n = (needle || '').toLowerCase()
        if (!n) return true
        return (card.translit || '').toLowerCase().indexOf(n) !== -1 ||
               (card.translitChat || '').toLowerCase().indexOf(n) !== -1 ||
               loose(card.translit).indexOf(loose(needle)) !== -1
    }

    /* ------------------------------------------- Transliteration Lab panel */
    var SOUNDS = [
        { ar: 'ح', chat: '7', plain: 'h', note: 'a breathy, deep “h”', ex: 'Mar7aba' },
        { ar: 'ع', chat: '3', plain: '’', note: 'the “3ayn” — a tightened throat sound', ex: '3afak' },
        { ar: 'ء', chat: '2', plain: '’', note: 'glottal stop, like the middle of “uh-oh”', ex: '2id' },
        { ar: 'خ', chat: '5', plain: 'kh', note: 'like the “ch” in Scottish “loch”', ex: '5ayr' },
        { ar: 'ق', chat: '9', plain: 'q', note: 'a deep “k” (often a glottal stop in Beirut)', ex: '9ahwe' },
        { ar: 'غ', chat: '8', plain: 'gh', note: 'like a French “r”', ex: '8ali' },
        { ar: 'ط', chat: '6', plain: 't', note: 'a heavy, emphatic “t”', ex: '6ayyib' }
    ]

    function renderSoundKey() {
        var host = document.getElementById('sound-key')
        if (!host) return
        var plain = mode === 'plain'
        host.innerHTML =
            '<div class="flex items-start justify-between gap-2 mb-3">' +
                '<div>' +
                    '<div class="font-bold">Key Lebanese sounds</div>' +
                    '<div class="text-[11px] text-slate-400">' +
                        (plain ? 'Showing plain letters — digits are off.' : 'Showing the chat alphabet — digits are on.') +
                    '</div>' +
                '</div>' +
                '<button onclick="TranslitMode.toggle()" class="shrink-0 text-[10px] font-extrabold px-2.5 py-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:border-indigo-400">' +
                    (plain ? 'Show 3 · 7 · 9' : 'Show plain letters') +
                '</button>' +
            '</div>' +
            '<div class="space-y-1.5 text-sm">' +
            SOUNDS.map(function (s) {
                var shown = plain ? s.plain : s.chat
                var other = plain ? s.chat : s.plain
                return '<div class="flex items-center gap-x-2 px-1 py-1">' +
                    '<span class="arabic-text text-lg w-7 text-center text-white">' + s.ar + '</span>' +
                    '<span class="font-extrabold text-indigo-300 w-8 text-center">' + shown + '</span>' +
                    '<span class="text-[10px] text-slate-500 w-10">(was ' + other + ')</span>' +
                    '<span class="text-xs text-slate-400 flex-1 truncate">' + s.note + '</span>' +
                    '<span class="font-bold text-emerald-300 text-xs">' + (plain ? convert(s.ex) : s.ex) + '</span>' +
                '</div>'
            }).join('') +
            '</div>'
    }

    /* static samples in the markup, tagged with data-translit="Mar7aba" */
    function paintStaticSamples() {
        var nodes = document.querySelectorAll('[data-translit]')
        for (var i = 0; i < nodes.length; i++) {
            var orig = nodes[i].getAttribute('data-translit')
            nodes[i].textContent = mode === 'plain' ? convert(orig) : orig
        }
    }

    /* ------------------------------------------------- nav quick-toggle pill */
    function paintNavToggle() {
        var btn = document.getElementById('translit-toggle')
        if (!btn) return
        var plain = mode === 'plain'
        btn.innerHTML = '<span class="font-extrabold">' + (plain ? 'marhaba' : 'mar7aba') + '</span>'
        btn.setAttribute('aria-pressed', plain ? 'true' : 'false')
        btn.title = plain
            ? 'Plain letters are on — click to switch to the chat alphabet (mar7aba)'
            : 'Chat alphabet is on — click to switch to plain letters (marhaba)'
    }

    window.TranslitMode = {
        get: function () { return mode },
        set: setMode,
        toggle: function () { setMode(mode === 'plain' ? 'chat' : 'plain') },
        convert: convert,
        apply: apply,
        sounds: SOUNDS,
        renderSoundKey: renderSoundKey,
        paintNavToggle: paintNavToggle,
        paintStaticSamples: paintStaticSamples
    }

    /* convert the data straight away, before the engine's first render */
    apply()

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            renderSoundKey(); paintNavToggle(); paintStaticSamples()
        })
    } else {
        renderSoundKey(); paintNavToggle(); paintStaticSamples()
    }
})()
