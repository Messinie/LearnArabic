/* ---------------------------------------------------------------------------
   Pronunciation audio — a robust replacement for the original playAudioText().

   The old version called speechSynthesis.getVoices() synchronously (empty on
   the first call in Chrome/Edge), fell back to voices[0] — typically an English
   voice that silently refuses Arabic glyphs — and cancelled right before
   speaking, which is a known way to make Chrome drop the utterance. Result:
   clicking the speaker did nothing.

   This module:
     * waits for the voice list (voiceschanged + polling)
     * picks the best Arabic voice (ar-LB → ar-SY/ar-PS/ar-JO → ar-EG → any ar)
     * if the device has no Arabic voice at all, speaks a romanised version of
       the transliteration with the default voice instead of staying silent
     * works around the Chrome cancel/pause bugs, reports errors, and shows a
       small "speaking" pill so you can always see that something happened
     * remembers a chosen voice + speaking rate (Settings dialog)
   --------------------------------------------------------------------------- */
(function () {
    'use strict'

    var PREF_KEY = 'leblearn-speech-prefs'
    var supported = typeof window !== 'undefined' && 'speechSynthesis' in window
    var voices = []
    var warnedNoArabic = false
    var keepAlive = null

    var prefs = { voiceURI: 'auto', rate: 0.95 }
    try {
        var saved = JSON.parse(localStorage.getItem(PREF_KEY) || '{}')
        if (saved && typeof saved === 'object') {
            if (saved.voiceURI) prefs.voiceURI = saved.voiceURI
            if (saved.rate) prefs.rate = Math.min(1.4, Math.max(0.5, +saved.rate || 0.95))
        }
    } catch (e) { }

    function savePrefs() {
        try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)) } catch (e) { }
    }

    /* ------------------------------------------------------------ voices */
    function refreshVoices() {
        if (!supported) return []
        try { voices = window.speechSynthesis.getVoices() || [] } catch (e) { voices = [] }
        return voices
    }

    function whenVoicesReady(cb) {
        if (!supported) return cb([])
        if (refreshVoices().length) return cb(voices)
        var done = false
        var finish = function () {
            if (done) return
            done = true
            clearInterval(timer)
            cb(refreshVoices())
        }
        try { window.speechSynthesis.onvoiceschanged = finish } catch (e) { }
        var tries = 0
        var timer = setInterval(function () {
            if (refreshVoices().length || ++tries > 20) finish()
        }, 120)
    }

    var AR_ORDER = ['ar-lb', 'ar-sy', 'ar-ps', 'ar-jo', 'ar-eg', 'ar-sa', 'ar-ae', 'ar-ma', 'ar']

    function arabicVoices() {
        return voices.filter(function (v) {
            var l = (v.lang || '').toLowerCase().replace('_', '-')
            return l.indexOf('ar') === 0 || /arab/i.test(v.name || '')
        })
    }

    function pickVoice() {
        if (prefs.voiceURI && prefs.voiceURI !== 'auto') {
            var exact = voices.filter(function (v) { return v.voiceURI === prefs.voiceURI })[0]
            if (exact) return exact
        }
        var ar = arabicVoices()
        for (var i = 0; i < AR_ORDER.length; i++) {
            var want = AR_ORDER[i]
            var hit = ar.filter(function (v) {
                return (v.lang || '').toLowerCase().replace('_', '-').indexOf(want) === 0
            })[0]
            if (hit) return hit
        }
        return ar[0] || null
    }

    /* --------------------------------------------------------- romanising */
    /* Spoken approximation when no Arabic voice exists: take the first variant
       of a transliteration and turn the chat-alphabet digits into letters an
       English voice can actually pronounce. */
    function romanise(translit) {
        var t = String(translit || '')
            .replace(/\([^)]*\)/g, ' ')      // drop "(m)", "(female)" hints
            .split('/')[0]                   // first variant only
            .trim()
        if (window.TranslitMode) t = window.TranslitMode.convert(t)
        return t
            .replace(/[\u2019']/g, '')       // glottal marks confuse TTS
            .replace(/kh/gi, 'h')
            .replace(/gh/gi, 'g')
            .replace(/\s+/g, ' ')
            .trim()
    }

    /* ------------------------------------------------------------- the UI */
    function pill(text, tone) {
        var old = document.getElementById('leb-speak-pill')
        if (old) old.remove()
        var d = document.createElement('div')
        d.id = 'leb-speak-pill'
        d.style.cssText = 'position:fixed;bottom:18px;left:50%;transform:translateX(-50%);z-index:999999'
        var color = tone === 'warn' ? 'border-amber-600 text-amber-200' : 'border-indigo-600 text-indigo-100'
        d.innerHTML = '<div class="dark-glass rounded-[3rem] shadow-xl px-5 py-2.5 border ' + color +
            ' flex items-center gap-x-3 text-sm font-bold">' +
            '<i class="fa-solid ' + (tone === 'warn' ? 'fa-triangle-exclamation' : 'fa-volume-high') + '"></i>' +
            '<span>' + text + '</span></div>'
        document.body.appendChild(d)
        return d
    }
    function clearPill() {
        var old = document.getElementById('leb-speak-pill')
        if (old) old.remove()
    }
    function escapeHTML(s) {
        return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    }

    /* ------------------------------------------------------------- speak */
    function speak(text, voice, lang, onFail) {
        var u = new SpeechSynthesisUtterance(text)
        if (voice) { u.voice = voice; u.lang = voice.lang }
        if (lang && !voice) u.lang = lang
        u.rate = prefs.rate
        u.pitch = 1.02
        u.onend = function () { stopKeepAlive(); clearPill() }
        u.onerror = function (ev) {
            stopKeepAlive()
            if (ev && (ev.error === 'interrupted' || ev.error === 'canceled')) return
            if (onFail) onFail(ev)
            else pill('Speech failed on this device', 'warn')
        }
        var speaking = false
        try { speaking = window.speechSynthesis.speaking || window.speechSynthesis.pending } catch (e) { }

        var fire = function () {
            try {
                window.speechSynthesis.speak(u)
                startKeepAlive()
            } catch (e) {
                if (onFail) onFail(e); else pill('Speech failed on this device', 'warn')
            }
        }

        if (speaking) {
            // Chrome drops an utterance queued in the same tick as cancel()
            try { window.speechSynthesis.cancel() } catch (e) { }
            setTimeout(fire, 90)
        } else {
            // iOS Safari only allows speak() inside the gesture's own task,
            // so when nothing is playing we must stay synchronous.
            fire()
        }
        return u
    }

    /* Chrome silently pauses long-running synthesis */
    function startKeepAlive() {
        stopKeepAlive()
        keepAlive = setInterval(function () {
            try {
                if (!window.speechSynthesis.speaking) { stopKeepAlive(); return }
                if (window.speechSynthesis.paused) window.speechSynthesis.resume()
            } catch (e) { stopKeepAlive() }
        }, 4000)
    }
    function stopKeepAlive() {
        if (keepAlive) { clearInterval(keepAlive); keepAlive = null }
    }

    /* ------------------------------------------------------------- public */
    function say(arabic, translit) {
        var shown = translit || arabic || ''
        if (!supported) {
            pill('Pronounce: ' + escapeHTML(shown), 'warn')
            setTimeout(clearPill, 2600)
            return
        }
        pill(escapeHTML(shown))
        whenVoicesReady(function () {
            var voice = pickVoice()
            var isArabicVoice = voice && ((voice.lang || '').toLowerCase().indexOf('ar') === 0 || /arab/i.test(voice.name || ''))

            if (voice && isArabicVoice && arabic) {
                speak(arabic, voice, 'ar-LB', function () {
                    // Arabic voice exists but choked — try the romanised form
                    speak(romanise(translit) || arabic, null, undefined, function () {
                        pill('Speech failed on this device', 'warn')
                        setTimeout(clearPill, 2600)
                    })
                })
                return
            }

            // no Arabic voice installed: say the romanised transliteration
            var roman = romanise(translit)
            if (!warnedNoArabic) {
                warnedNoArabic = true
                if (typeof toast === 'function') {
                    toast('No Arabic voice on this device — using an approximation. Pick a voice in Settings.')
                }
            }
            if (roman) {
                speak(roman, voice || null, undefined, function () {
                    pill('Pronounce: ' + escapeHTML(shown), 'warn')
                    setTimeout(clearPill, 2600)
                })
            } else if (arabic) {
                speak(arabic, voice || null, 'ar-LB')
            } else {
                clearPill()
            }
        })
    }

    window.Speech = {
        say: say,
        supported: supported,
        voices: function () { return refreshVoices() },
        arabicVoices: function () { refreshVoices(); return arabicVoices() },
        prefs: prefs,
        setVoice: function (uri) { prefs.voiceURI = uri || 'auto'; savePrefs() },
        setRate: function (r) { prefs.rate = Math.min(1.4, Math.max(0.5, +r || 0.95)); savePrefs() },
        whenReady: whenVoicesReady,
        test: function () { say('مرحبا، كيفك؟', 'Mar7aba, kifak?') },
        stop: function () { try { window.speechSynthesis.cancel() } catch (e) { } stopKeepAlive(); clearPill() }
    }

    /* take over every pronunciation call in the LebLearn engine */
    window.playAudioText = function (arabic, translit) { say(arabic, translit) }

    /* warm the voice list up as early as possible */
    if (supported) whenVoicesReady(function () { })
})()
