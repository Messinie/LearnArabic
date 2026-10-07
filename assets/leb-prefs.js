/* ---------------------------------------------------------------------------
   Settings dialog — replaces the original demo modal (which only had
   non-functional inputs and a "Settings saved (demo)" toast).

   Real, persisted options:
     * Transliteration style: plain letters (default) or the chat alphabet
     * Pronunciation voice + speaking rate, with a test button
     * Reset the spaced-repetition progress
   --------------------------------------------------------------------------- */
(function () {
    'use strict'

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    }

    function voiceOptions() {
        if (!window.Speech || !window.Speech.supported) return ''
        var all = window.Speech.voices()
        var ar = window.Speech.arabicVoices()
        var cur = window.Speech.prefs.voiceURI
        var opt = function (v) {
            return '<option value="' + esc(v.voiceURI) + '"' + (cur === v.voiceURI ? ' selected' : '') + '>' +
                esc(v.name + ' (' + v.lang + ')') + '</option>'
        }
        var others = all.filter(function (v) { return ar.indexOf(v) === -1 })
        return '<option value="auto"' + (cur === 'auto' ? ' selected' : '') + '>Auto — best Arabic voice</option>' +
            (ar.length ? '<optgroup label="Arabic voices">' + ar.map(opt).join('') + '</optgroup>' : '') +
            (others.length ? '<optgroup label="Other voices (approximate)">' + others.map(opt).join('') + '</optgroup>' : '')
    }

    function body() {
        var plain = !window.TranslitMode || window.TranslitMode.get() === 'plain'
        var speech = window.Speech && window.Speech.supported
        var arCount = speech ? window.Speech.arabicVoices().length : 0
        var rate = speech ? window.Speech.prefs.rate : 0.95

        return '' +
        '<div class="dark-glass border border-slate-700 rounded-3xl p-6 max-h-[85vh] overflow-y-auto hub-scroll">' +
            '<div class="flex items-center justify-between mb-5">' +
                '<div class="font-extrabold text-xl">Settings</div>' +
                '<button onclick="this.closest(\'.fixed\').remove()" class="w-9 h-9 rounded-2xl bg-slate-800 hover:bg-slate-700" aria-label="Close settings">' +
                    '<i class="fa-solid fa-xmark"></i></button>' +
            '</div>' +

            /* ---- transliteration ---- */
            '<div class="mb-6">' +
                '<div class="text-xs font-extrabold tracking-widest text-slate-400 mb-2">TRANSLITERATION STYLE</div>' +
                '<div class="grid grid-cols-2 gap-2">' +
                    '<button onclick="LebPrefs.setTranslit(\'plain\')" aria-pressed="' + plain + '" ' +
                        'class="text-left rounded-2xl border p-3 transition-colors ' +
                        (plain ? 'border-indigo-400 bg-indigo-500/15' : 'border-slate-700 bg-slate-900 hover:border-slate-500') + '">' +
                        '<div class="font-extrabold text-sm">Plain letters' + (plain ? ' <i class="fa-solid fa-check text-indigo-300 ml-1"></i>' : '') + '</div>' +
                        '<div class="text-indigo-200 font-bold mt-1">marhaba</div>' +
                        '<div class="text-[11px] text-slate-400 mt-1">No digits. Reads the way it sounds.</div>' +
                    '</button>' +
                    '<button onclick="LebPrefs.setTranslit(\'chat\')" aria-pressed="' + (!plain) + '" ' +
                        'class="text-left rounded-2xl border p-3 transition-colors ' +
                        (!plain ? 'border-indigo-400 bg-indigo-500/15' : 'border-slate-700 bg-slate-900 hover:border-slate-500') + '">' +
                        '<div class="font-extrabold text-sm">Chat alphabet' + (!plain ? ' <i class="fa-solid fa-check text-indigo-300 ml-1"></i>' : '') + '</div>' +
                        '<div class="text-indigo-200 font-bold mt-1">mar7aba</div>' +
                        '<div class="text-[11px] text-slate-400 mt-1">The way Lebanese is typed online.</div>' +
                    '</button>' +
                '</div>' +
                '<div class="text-[11px] text-slate-500 mt-2 leading-relaxed">' +
                    'Plain mode maps 7→h, 5→kh, 8→gh, 9→q, 6→t and drops 2 / 3 (glottal sounds) ' +
                    'to a light ’ mark. Searches and typed answers accept both spellings.' +
                '</div>' +
            '</div>' +

            /* ---- pronunciation ---- */
            '<div class="mb-6">' +
                '<div class="text-xs font-extrabold tracking-widest text-slate-400 mb-2">PRONUNCIATION</div>' +
                (speech
                    ? '<label class="block text-[11px] font-bold text-slate-400 mb-1" for="pref-voice">Voice</label>' +
                      '<select id="pref-voice" onchange="LebPrefs.setVoice(this.value)" class="w-full bg-slate-800 border border-slate-700 rounded-2xl px-3 py-2 text-sm">' +
                        voiceOptions() +
                      '</select>' +
                      '<div class="text-[11px] mt-1.5 ' + (arCount ? 'text-emerald-300' : 'text-amber-300') + '">' +
                        (arCount
                            ? '<i class="fa-solid fa-circle-check mr-1"></i>' + arCount + ' Arabic voice' + (arCount > 1 ? 's' : '') + ' available on this device'
                            : '<i class="fa-solid fa-triangle-exclamation mr-1"></i>No Arabic voice installed — words are spoken from the transliteration instead. Installing an Arabic language pack gives real audio.') +
                      '</div>' +
                      '<label class="block text-[11px] font-bold text-slate-400 mt-3 mb-1" for="pref-rate">Speed <span id="pref-rate-val" class="text-slate-300">' + rate.toFixed(2) + '×</span></label>' +
                      '<input id="pref-rate" type="range" min="0.5" max="1.4" step="0.05" value="' + rate + '" ' +
                        'oninput="LebPrefs.setRate(this.value)" class="w-full accent-indigo-400">' +
                      '<button onclick="Speech.test()" class="mt-3 w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-sm font-extrabold">' +
                        '<i class="fa-solid fa-volume-high mr-2"></i>Test: مرحبا، كيفك؟</button>'
                    : '<div class="text-[11px] text-amber-300"><i class="fa-solid fa-triangle-exclamation mr-1"></i>' +
                      'This browser has no speech synthesis — the app shows the pronunciation in writing instead.</div>') +
            '</div>' +

            /* ---- progress ---- */
            '<div class="mb-2">' +
                '<div class="text-xs font-extrabold tracking-widest text-slate-400 mb-2">PROGRESS</div>' +
                '<button onclick="LebPrefs.resetProgress()" class="w-full py-2.5 rounded-2xl border border-red-900/60 bg-red-500/10 text-red-200 hover:bg-red-500/20 text-sm font-extrabold">' +
                    '<i class="fa-solid fa-rotate-left mr-2"></i>Reset spaced-repetition progress</button>' +
                '<div class="text-[11px] text-slate-500 mt-1.5">Clears review history stored in this browser. Lesson history stays.</div>' +
            '</div>' +

            '<button onclick="this.closest(\'.fixed\').remove()" class="w-full mt-5 py-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded-3xl font-extrabold">Done</button>' +
        '</div>'
    }

    function open() {
        var old = document.getElementById('settings-modal')
        if (old) old.remove()
        var modal = (typeof mkModal === 'function')
            ? mkModal('settings-modal')
            : (function () {
                var m = document.createElement('div')
                m.id = 'settings-modal'
                m.className = 'fixed inset-0 bg-black/70 backdrop-blur-sm z-[130] flex items-center justify-center'
                m.innerHTML = '<div class="max-w-md mx-4 w-full"></div>'
                m.addEventListener('click', function (e) { if (e.target === m) m.remove() })
                document.body.appendChild(m)
                return m
            })()
        modal.firstElementChild.innerHTML = body()
        if (window.Speech && window.Speech.supported) {
            // the voice list often arrives a moment later — refresh the select then
            window.Speech.whenReady(function () {
                var sel = document.getElementById('pref-voice')
                if (sel) sel.innerHTML = voiceOptions()
            })
        }
    }

    window.LebPrefs = {
        open: open,
        setTranslit: function (mode) {
            if (window.TranslitMode) window.TranslitMode.set(mode)
            open()
            if (typeof toast === 'function') {
                toast(mode === 'plain' ? 'Plain letters on — mar7aba is now marhaba' : 'Chat alphabet on — marhaba is now mar7aba')
            }
        },
        setVoice: function (uri) {
            if (window.Speech) { window.Speech.setVoice(uri); window.Speech.test() }
        },
        setRate: function (r) {
            if (window.Speech) window.Speech.setRate(r)
            var out = document.getElementById('pref-rate-val')
            if (out) out.textContent = (+r).toFixed(2) + '×'
        },
        resetProgress: function () {
            try { localStorage.removeItem('lebanese-anki-cards') } catch (e) { }
            window.location.reload()
        }
    }

    /* the gear button in the header and any legacy call site */
    window.showSettings = open
})()
