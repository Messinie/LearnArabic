/* ---------------------------------------------------------------------------
   LebLearn Hub — merges every page of the old sites (Grammar, Vocabulary,
   Reading, Listening, Culture, Games, Minorities, Teacher tools, AI, ML …)
   into the Lebanese Anki app: searchable library, module grid, in-app viewer,
   recents and the shared audio library.
   Depends on assets/catalog.js (generated) and runs alongside assets/leb-app.js
   --------------------------------------------------------------------------- */
(function () {
    'use strict'

    var CAT = window.CONTENT_CATALOG || []
    var META = window.MODULE_META || {}
    var MEDIA = window.MEDIA_CATALOG || []

    var KIND_META = {
        lesson:     { label: 'Lesson',     icon: 'fa-book-open',       tint: 'text-indigo-300  bg-indigo-500/10  border-indigo-500/20' },
        audio:      { label: 'Audio',      icon: 'fa-headphones',      tint: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20' },
        quiz:       { label: 'Quiz',       icon: 'fa-circle-question', tint: 'text-amber-300   bg-amber-500/10   border-amber-500/20' },
        game:       { label: 'Game',       icon: 'fa-gamepad',         tint: 'text-rose-300    bg-rose-500/10    border-rose-500/20' },
        flashcards: { label: 'Flashcards', icon: 'fa-clone',           tint: 'text-violet-300  bg-violet-500/10  border-violet-500/20' },
        tool:       { label: 'Tool',       icon: 'fa-screwdriver-wrench', tint: 'text-slate-300 bg-slate-500/10  border-slate-500/20' },
        index:      { label: 'Overview',   icon: 'fa-compass',         tint: 'text-cyan-300    bg-cyan-500/10    border-cyan-500/20' }
    }

    var state = { q: '', module: 'all', kind: 'all', page: 0 }
    var PAGE = 48
    var RECENT_KEY = 'leblearn-hub-recents'

    /* ------------------------------------------------------------- helpers */
    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    }
    function el(id) { return document.getElementById(id) }
    function modLabel(key) { return (META[key] && META[key].label) || key }
    function modGrad(key) { return (META[key] && META[key].grad) || 'from-slate-400 to-slate-300' }
    function modIcon(key) { return (META[key] && META[key].icon) || 'fa-folder' }
    function kindMeta(k) { return KIND_META[k] || KIND_META.lesson }

    function recents() {
        try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') } catch (e) { return [] }
    }
    function pushRecent(path) {
        var list = recents().filter(function (p) { return p !== path })
        list.unshift(path)
        try { localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 12))) } catch (e) { }
        renderRecents()
    }
    function byPath(path) {
        for (var i = 0; i < CAT.length; i++) if (CAT[i].p === path) return CAT[i]
        return null
    }

    /* ------------------------------------------------------------- filtering */
    function matches(e) {
        if (state.module !== 'all' && e.m !== state.module) return false
        if (state.kind !== 'all' && e.k !== state.kind) return false
        if (!state.q) return true
        var hay = (e.t + ' ' + e.d + ' ' + e.p + ' ' + e.ar + ' ' + modLabel(e.m)).toLowerCase()
        return state.q.split(/\s+/).every(function (tok) { return hay.indexOf(tok) !== -1 })
    }
    function filtered() { return CAT.filter(matches) }

    /* ------------------------------------------------------------- rendering */
    function cardHTML(e) {
        var km = kindMeta(e.k)
        return '' +
        '<button onclick="HUB.open(\'' + esc(e.p) + '\')" class="modern-card text-left bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-3xl p-4 flex flex-col group">' +
            '<div class="flex items-start justify-between gap-2">' +
                '<div class="w-9 h-9 shrink-0 rounded-2xl bg-gradient-to-br ' + modGrad(e.m) + ' flex items-center justify-center">' +
                    '<i class="fa-solid ' + modIcon(e.m) + ' text-slate-900 text-sm"></i>' +
                '</div>' +
                '<span class="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-xl border ' + km.tint + '">' +
                    '<i class="fa-solid ' + km.icon + ' mr-1"></i>' + km.label +
                '</span>' +
            '</div>' +
            '<div class="mt-3 font-bold leading-snug text-slate-100 group-hover:text-white line-clamp-2">' + esc(e.t) + '</div>' +
            (e.d ? '<div class="mt-1.5 text-xs text-slate-400 leading-relaxed line-clamp-3">' + esc(e.d) + '</div>' : '') +
            '<div class="mt-auto pt-3 flex items-center justify-between text-[11px] text-slate-500">' +
                '<span class="font-semibold">' + esc(modLabel(e.m)) + '</span>' +
                '<span>' + (e.a ? '<i class="fa-solid fa-volume-high mr-1 text-emerald-400"></i>' : '') + e.s + ' KB</span>' +
            '</div>' +
        '</button>'
    }

    function renderLibrary() {
        var list = filtered()
        var shown = list.slice(0, (state.page + 1) * PAGE)
        var grid = el('library-grid')
        if (!grid) return
        grid.innerHTML = shown.length
            ? shown.map(cardHTML).join('')
            : '<div class="col-span-full text-center py-16 text-slate-500">' +
              '<i class="fa-solid fa-magnifying-glass text-3xl mb-3 block"></i>No page matches that search.</div>'

        el('library-count').textContent = list.length
        el('library-shown').textContent = shown.length
        var more = el('library-more')
        more.classList.toggle('hidden', shown.length >= list.length)
        more.textContent = 'Load ' + Math.min(PAGE, list.length - shown.length) + ' more'
    }

    function renderModuleChips() {
        var counts = {}
        CAT.forEach(function (e) { counts[e.m] = (counts[e.m] || 0) + 1 })
        var keys = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a] })
        var wrap = el('module-chips')
        wrap.innerHTML = ['all'].concat(keys).map(function (k) {
            var active = state.module === k
            var label = k === 'all' ? 'All modules' : modLabel(k)
            var n = k === 'all' ? CAT.length : counts[k]
            return '<button data-mod="' + esc(k) + '" onclick="HUB.setModule(\'' + esc(k) + '\')" ' +
                'class="px-3.5 py-1.5 rounded-2xl text-xs font-bold border transition-colors ' +
                (active ? 'bg-indigo-500 border-indigo-400 text-white' : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500') +
                '">' + esc(label) + ' <span class="opacity-60">' + n + '</span></button>'
        }).join('')
    }

    function renderKindChips() {
        var counts = {}
        CAT.forEach(function (e) { counts[e.k] = (counts[e.k] || 0) + 1 })
        var wrap = el('kind-chips')
        wrap.innerHTML = ['all'].concat(Object.keys(counts).sort()).map(function (k) {
            var active = state.kind === k
            var label = k === 'all' ? 'Everything' : kindMeta(k).label
            var icon = k === 'all' ? 'fa-layer-group' : kindMeta(k).icon
            var n = k === 'all' ? CAT.length : counts[k]
            return '<button onclick="HUB.setKind(\'' + esc(k) + '\')" ' +
                'class="px-3 py-1.5 rounded-2xl text-xs font-bold border transition-colors ' +
                (active ? 'bg-slate-100 border-slate-100 text-slate-900' : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500') +
                '"><i class="fa-solid ' + icon + ' mr-1.5"></i>' + esc(label) + ' <span class="opacity-60">' + n + '</span></button>'
        }).join('')
    }

    function renderModuleGrid() {
        var counts = {}, audio = {}
        CAT.forEach(function (e) {
            counts[e.m] = (counts[e.m] || 0) + 1
            if (e.a) audio[e.m] = (audio[e.m] || 0) + 1
        })
        var keys = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a] })
        el('module-grid').innerHTML = keys.map(function (k) {
            var m = META[k] || {}
            return '' +
            '<button onclick="HUB.setModule(\'' + esc(k) + '\', true)" class="modern-card text-left bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-3xl p-5 flex flex-col">' +
                '<div class="flex items-center justify-between">' +
                    '<div class="w-11 h-11 rounded-2xl bg-gradient-to-br ' + modGrad(k) + ' flex items-center justify-center">' +
                        '<i class="fa-solid ' + modIcon(k) + ' text-slate-900 text-lg"></i>' +
                    '</div>' +
                    '<div class="text-right"><div class="text-2xl font-extrabold stat-number">' + counts[k] + '</div>' +
                    '<div class="text-[10px] uppercase tracking-wider text-slate-500 font-bold">pages</div></div>' +
                '</div>' +
                '<div class="mt-4 font-bold text-lg tracking-tight">' + esc(modLabel(k)) + '</div>' +
                '<div class="mt-1 text-xs text-slate-400 leading-relaxed">' + esc(m.blurb || '') + '</div>' +
                (audio[k] ? '<div class="mt-3 text-[11px] text-emerald-300 font-bold"><i class="fa-solid fa-volume-high mr-1"></i>' + audio[k] + ' with audio</div>' : '') +
            '</button>'
        }).join('')
    }

    function renderRecents() {
        var wrap = el('recent-list')
        if (!wrap) return
        var list = recents().map(byPath).filter(Boolean)
        if (!list.length) {
            wrap.innerHTML = '<div class="text-xs text-slate-500 py-2">Nothing opened yet — pick any lesson below and it will show up here.</div>'
            return
        }
        wrap.innerHTML = list.map(function (e) {
            return '<button onclick="HUB.open(\'' + esc(e.p) + '\')" class="shrink-0 w-56 text-left bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-2xl px-4 py-3">' +
                '<div class="text-[10px] font-bold uppercase tracking-wider text-slate-500">' + esc(modLabel(e.m)) + '</div>' +
                '<div class="text-sm font-bold leading-snug mt-1 line-clamp-2">' + esc(e.t) + '</div>' +
            '</button>'
        }).join('')
    }

    function renderMedia() {
        var wrap = el('media-list')
        if (!wrap) return
        wrap.innerHTML = MEDIA.map(function (m) {
            return '<div class="bg-slate-900 border border-slate-800 rounded-3xl p-4">' +
                '<div class="flex items-center gap-x-2.5">' +
                    '<div class="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center">' +
                        '<i class="fa-solid fa-waveform-lines text-slate-900 text-sm"></i></div>' +
                    '<div class="min-w-0"><div class="text-sm font-bold truncate">' + esc(m.t) + '</div>' +
                    '<div class="text-[11px] text-slate-500">' + esc(modLabel(m.m)) + ' • ' + Math.round(m.s / 1024 * 10) / 10 + ' MB</div></div>' +
                '</div>' +
                '<audio controls preload="none" class="w-full mt-3 h-9" src="' + encodeURI(m.p) + '"></audio>' +
            '</div>'
        }).join('')
    }

    /* ------------------------------------------------------------- viewer */
    function open(path) {
        var e = byPath(path)
        var frame = el('viewer-frame')
        el('viewer-title').textContent = e ? e.t : path
        el('viewer-sub').textContent = (e ? modLabel(e.m) + ' • ' : '') + path
        el('viewer-open').href = path
        frame.src = path
        el('viewer').classList.remove('hidden')
        document.body.style.overflow = 'hidden'
        pushRecent(path)
        setHash('#view=' + path)
    }
    function close() {
        el('viewer').classList.add('hidden')
        el('viewer-frame').src = 'about:blank'
        document.body.style.overflow = ''
        if (location.hash.indexOf('#view=') === 0) setHash('#library')
    }
    /* history.replaceState throws on file:// in some browsers — never fatal */
    function setHash(h) {
        try { history.replaceState(null, '', h) } catch (e) { /* ignore */ }
    }

    /* ------------------------------------------------------------- actions */
    var HUB = {
        open: open,
        close: close,
        setModule: function (m, scroll) {
            state.module = m; state.page = 0
            renderModuleChips(); renderLibrary()
            if (scroll) el('library').scrollIntoView({ behavior: 'smooth' })
        },
        setKind: function (k) {
            state.kind = k; state.page = 0
            renderKindChips(); renderLibrary()
        },
        search: function (v) {
            state.q = (v || '').trim().toLowerCase(); state.page = 0
            renderLibrary()
        },
        more: function () { state.page++; renderLibrary() },
        surprise: function () {
            var list = filtered()
            if (list.length) open(list[Math.floor(Math.random() * list.length)].p)
        },
        reset: function () {
            state = { q: '', module: 'all', kind: 'all', page: 0 }
            el('library-search').value = ''
            renderModuleChips(); renderKindChips(); renderLibrary()
        }
    }
    window.HUB = HUB

    /* mobile nav for the merged section list (overrides the LebLearn one) */
    window.showMobileNav = function () {
        var m = document.getElementById('mobile-menu')
        if (!m) {
            m = document.createElement('div')
            m.id = 'mobile-menu'
            m.className = 'absolute top-full right-4 mt-2 dark-glass border border-slate-700 rounded-3xl p-2 w-56 z-50 hidden'
                ;[['dashboard', 'Dashboard'], ['anki', 'Anki SRS'], ['library', 'Library'], ['modules', 'Modules'],
                ['translit', 'Transliteration Lab'], ['practice', 'Practice'], ['vocab', 'Dictionary'],
                ['media', 'Audio'], ['tips', 'Tips']].forEach(function (x) {
                    var a = document.createElement('a')
                    a.href = '#' + x[0]
                    a.textContent = x[1]
                    a.className = 'block px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-2xl'
                    a.onclick = function () { m.classList.add('hidden') }
                    m.appendChild(a)
                })
            document.querySelector('nav').appendChild(m)
        }
        m.classList.toggle('hidden')
    }

    /* ------------------------------------------------------------- init */
    function init() {
        renderModuleChips()
        renderKindChips()
        renderLibrary()
        renderModuleGrid()
        renderRecents()
        renderMedia()

        var pages = CAT.length
        var audioPages = CAT.filter(function (e) { return e.a }).length
        var modules = Object.keys(CAT.reduce(function (a, e) { a[e.m] = 1; return a }, {})).length
        var set = function (id, v) { var n = el(id); if (n) n.textContent = v }
        set('stat-pages', pages)
        set('stat-modules', modules)
        set('stat-audio', audioPages + MEDIA.length)
        set('hero-pages', pages)
        set('hero-modules', modules)

        var box = el('library-search')
        var t = null
        box.addEventListener('input', function (ev) {
            clearTimeout(t)
            var v = ev.target.value
            t = setTimeout(function () { HUB.search(v) }, 120)
        })

        document.addEventListener('keydown', function (ev) {
            if (ev.key === 'Escape' && !el('viewer').classList.contains('hidden')) close()
            if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'k') {
                ev.preventDefault()
                el('library').scrollIntoView({ behavior: 'smooth' })
                box.focus()
            }
        })

        if (location.hash.indexOf('#view=') === 0) {
            open(decodeURIComponent(location.hash.slice(6)))
        }
        window.addEventListener('hashchange', function () {
            if (location.hash.indexOf('#view=') === 0) open(decodeURIComponent(location.hash.slice(6)))
        })

        /* active-section highlight in the nav */
        var links = [].slice.call(document.querySelectorAll('.nav-link'))
        var ids = links.map(function (a) { return a.getAttribute('href').slice(1) })
        window.addEventListener('scroll', function () {
            var y = window.scrollY + 140, cur = ids[0]
            ids.forEach(function (id) {
                var n = document.getElementById(id)
                if (n && n.offsetTop <= y) cur = id
            })
            links.forEach(function (a) {
                a.classList.toggle('nav-active', a.getAttribute('href') === '#' + cur)
            })
        }, { passive: true })
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init)
    } else {
        init()
    }
})()
