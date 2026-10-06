/* ---------------------------------------------------------------------------
   LebLearn Hub — merges every page of the old sites (Grammar, Vocabulary,
   Reading, Listening, Culture, Games, Minorities, Teacher tools, AI, ML …)
   into the Lebanese Anki app.

   Responsibilities:
     * tab router (Overview / Study / Library / Dictionary / Tips)
     * the Overview command center: KPIs + SVG charts drawn from the live deck
       and from the generated content catalog (no hard-coded numbers)
     * library search / filters / in-app viewer / recents / audio library

   Depends on assets/catalog.js (generated) and runs alongside assets/leb-app.js
   --------------------------------------------------------------------------- */
(function () {
    'use strict'

    var CAT = window.CONTENT_CATALOG || []
    var META = window.MODULE_META || {}
    var MEDIA = window.MEDIA_CATALOG || []
    var DAY_MS = 86400000

    var KIND_META = {
        lesson:     { label: 'Lesson',     icon: 'fa-book-open',          tint: 'text-indigo-300  bg-indigo-500/10  border-indigo-500/20', hex: '#818cf8' },
        audio:      { label: 'Audio',      icon: 'fa-headphones',         tint: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20', hex: '#34d399' },
        quiz:       { label: 'Quiz',       icon: 'fa-circle-question',    tint: 'text-amber-300   bg-amber-500/10   border-amber-500/20',  hex: '#fbbf24' },
        game:       { label: 'Game',       icon: 'fa-gamepad',            tint: 'text-rose-300    bg-rose-500/10    border-rose-500/20',   hex: '#fb7185' },
        flashcards: { label: 'Flashcards', icon: 'fa-clone',              tint: 'text-violet-300  bg-violet-500/10  border-violet-500/20', hex: '#a78bfa' },
        tool:       { label: 'Tool',       icon: 'fa-screwdriver-wrench', tint: 'text-slate-300   bg-slate-500/10   border-slate-500/20',  hex: '#94a3b8' },
        index:      { label: 'Overview',   icon: 'fa-compass',            tint: 'text-cyan-300    bg-cyan-500/10    border-cyan-500/20',   hex: '#22d3ee' }
    }

    var state = { q: '', module: 'all', kind: 'all', page: 0, tab: 'overview' }
    var PAGE = 48
    var RECENT_KEY = 'leblearn-hub-recents'
    var TABS = ['overview', 'study', 'library', 'dictionary', 'tips']

    /* ------------------------------------------------------------- helpers */
    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    }
    function el(id) { return document.getElementById(id) }
    function setText(id, v) { var n = el(id); if (n) n.textContent = v }
    function modLabel(k) { return (META[k] && META[k].label) || k }
    function modGrad(k) { return (META[k] && META[k].grad) || 'from-slate-400 to-slate-300' }
    function modIcon(k) { return (META[k] && META[k].icon) || 'fa-folder' }
    function kindMeta(k) { return KIND_META[k] || KIND_META.lesson }
    function num(n) { return (n || 0).toLocaleString('en-US') }

    /* the LebLearn engine declares `cards` / `learnCards` as top-level
       bindings — reachable here, but guarded in case the data file is missing */
    function deck() { return (typeof cards !== 'undefined' && cards) ? cards : [] }
    function learnDeck() {
        if (typeof learnCards !== 'undefined' && learnCards) return learnCards
        return deck().filter(function (c) { return !c.ref })
    }

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
    function setHash(h) { try { history.replaceState(null, '', h) } catch (e) { } }
    function scrollToTop() { try { window.scrollTo(0, 0) } catch (e) { } }
    function scrollToEl(node) {
        if (node && typeof node.scrollIntoView === 'function') {
            node.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
    }
    /* which tab panel owns a given section id */
    function panelOf(id) {
        var n = el(id)
        while (n && n !== document.body) {
            if (n.getAttribute && n.getAttribute('role') === 'tabpanel') return n.id.replace('panel-', '')
            n = n.parentNode
        }
        return null
    }

    /* ============================================================ TAB ROUTER */
    function activate(name, focusPanel) {
        if (TABS.indexOf(name) === -1) name = 'overview'
        state.tab = name
        TABS.forEach(function (t) {
            var btn = el('tab-' + t), panel = el('panel-' + t)
            if (!btn || !panel) return
            var on = t === name
            btn.setAttribute('aria-selected', on ? 'true' : 'false')
            btn.tabIndex = on ? 0 : -1
            panel.hidden = !on
        })
        if (focusPanel) {
            var p = el('panel-' + name)
            if (p) p.focus({ preventScroll: true })
        }
        if (location.hash.indexOf('#view=') !== 0) setHash('#' + name)
        scrollToTop()
        if (name === 'overview') renderCharts()
    }

    function wireTabs() {
        var bar = el('tabbar')
        if (!bar) return
        var btns = [].slice.call(bar.querySelectorAll('[role="tab"]'))
        btns.forEach(function (b) {
            b.addEventListener('click', function () { activate(b.dataset.tab) })
        })
        bar.addEventListener('keydown', function (e) {
            var i = btns.indexOf(document.activeElement)
            if (i === -1) return
            var next = null
            if (e.key === 'ArrowRight') next = btns[(i + 1) % btns.length]
            if (e.key === 'ArrowLeft') next = btns[(i - 1 + btns.length) % btns.length]
            if (e.key === 'Home') next = btns[0]
            if (e.key === 'End') next = btns[btns.length - 1]
            if (next) { e.preventDefault(); next.focus(); activate(next.dataset.tab) }
        })
    }

    /* ============================================================== CHARTS */
    /* All charts are hand-rolled inline SVG: no chart library, no network,
       each one carries a text summary for screen readers. */

    function svg(w, h, label, inner) {
        return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%" height="' + h + '" ' +
            'role="img" aria-label="' + esc(label) + '" class="overflow-visible">' + inner + '</svg>'
    }

    /* ---- 1. review forecast (next 14 days) ---- */
    function forecastData() {
        var learn = learnDeck(), now = Date.now()
        var today = new Date(); today.setHours(0, 0, 0, 0)
        var start = today.getTime()
        var days = []
        for (var i = 0; i < 14; i++) days.push({ i: i, count: 0, date: new Date(start + i * DAY_MS) })
        var overdue = 0
        learn.forEach(function (c) {
            var t = c.nextReview || now
            if (t < start) { overdue++; return }
            var idx = Math.floor((t - start) / DAY_MS)
            if (idx >= 0 && idx < 14) days[idx].count++
        })
        return { days: days, overdue: overdue }
    }

    function renderForecast() {
        var host = el('forecast-chart')
        if (!host) return
        var data = forecastData()
        var W = 520, H = 150, pad = 22, barGap = 6
        var cols = data.days.length
        var colW = (W - pad * 2) / cols
        data.days[0].overdue = data.overdue
        var max = Math.max(1, Math.max.apply(null, data.days.map(function (d) { return d.count + (d.overdue || 0) })))
        var total = data.days.reduce(function (a, d) { return a + d.count }, 0)

        var bars = data.days.map(function (d, i) {
            var plot = H - 46
            var over = d.overdue || 0
            var hOver = Math.round((over / max) * plot)
            var h = Math.round((d.count / max) * plot)
            var x = pad + i * colW, y = H - 24 - h - hOver
            var isToday = i === 0
            var fill = isToday ? 'url(#gradToday)' : 'url(#gradBar)'
            var label = d.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
            var top = d.count + over
            return '<g class="bar-col"><title>' + esc(label + ': ' + d.count + ' scheduled' + (over ? ' + ' + over + ' overdue' : '')) + '</title>' +
                '<rect x="' + (x + barGap / 2) + '" y="' + (H - 24 - plot) + '" width="' + (colW - barGap) + '" height="' + plot + '" rx="4" fill="#1e293b"/>' +
                (over ? '<rect x="' + (x + barGap / 2) + '" y="' + (H - 24 - hOver) + '" width="' + (colW - barGap) + '" height="' + Math.max(hOver, 3) + '" rx="4" fill="#fb923c"/>' : '') +
                '<rect x="' + (x + barGap / 2) + '" y="' + y + '" width="' + (colW - barGap) + '" height="' + Math.max(h, d.count ? 3 : 0) + '" rx="4" fill="' + fill + '"/>' +
                (top ? '<text x="' + (x + colW / 2) + '" y="' + (y - 4) + '" text-anchor="middle" font-size="9" font-weight="700" fill="#cbd5e1">' + top + '</text>' : '') +
                '<text x="' + (x + colW / 2) + '" y="' + (H - 9) + '" text-anchor="middle" font-size="9" fill="' + (isToday ? '#a5b4fc' : '#64748b') + '" font-weight="' + (isToday ? '800' : '500') + '">' +
                (isToday ? 'today' : d.date.toLocaleDateString('en-US', { weekday: 'narrow' })) + '</text>' +
                '</g>'
        }).join('')

        var defs = '<defs>' +
            '<linearGradient id="gradBar" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#6366f1"/><stop offset="100%" stop-color="#4338ca"/></linearGradient>' +
            '<linearGradient id="gradToday" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#34d399"/><stop offset="100%" stop-color="#0d9488"/></linearGradient>' +
            '</defs>'

        host.innerHTML = svg(W, H,
            'Bar chart of cards due over the next 14 days. ' + total + ' cards scheduled, ' +
            data.overdue + ' of them overdue and stacked onto today.', defs + bars)

        setText('forecast-total', num(total))
        var legend = el('forecast-legend')
        if (legend) {
            legend.innerHTML =
                '<span><span class="inline-block w-2.5 h-2.5 rounded bg-orange-400 mr-1.5 align-middle" aria-hidden="true"></span>overdue <b class="text-slate-200">' + num(data.overdue) + '</b></span>' +
                '<span><span class="inline-block w-2.5 h-2.5 rounded bg-emerald-400 mr-1.5 align-middle" aria-hidden="true"></span>today</span>' +
                '<span><span class="inline-block w-2.5 h-2.5 rounded bg-indigo-500 mr-1.5 align-middle" aria-hidden="true"></span>scheduled</span>' +
                '<span class="text-slate-500">busiest day: ' + num(max) + ' cards</span>'
        }
    }

    /* ---- 2. deck composition donut ---- */
    function donutSegments() {
        var learn = learnDeck()
        var mature = learn.filter(function (c) { return c.interval >= 10 }).length
        var learning = learn.filter(function (c) { return c.reviews >= 3 && c.interval < 10 }).length
        var fresh = learn.length - mature - learning
        var reference = deck().length - learn.length
        return {
            segs: [
                { label: 'Mature', value: mature, color: '#34d399', hint: 'interval ≥ 10 days' },
                { label: 'Learning', value: learning, color: '#fbbf24', hint: '3+ reviews, still short intervals' },
                { label: 'New', value: fresh, color: '#60a5fa', hint: 'not studied yet' }
            ],
            reference: reference
        }
    }

    function renderDonut() {
        var host = el('donut-chart')
        if (!host) return
        var data = donutSegments()
        var segs = data.segs
        var learnTotal = segs.reduce(function (a, s) { return a + s.value }, 0)
        var total = learnTotal || 1
        var R = 52, r = 34, cx = 60, cy = 60, angle = -Math.PI / 2
        var paths = segs.map(function (s) {
            var frac = s.value / total
            if (!s.value) return ''
            var a0 = angle, a1 = angle + frac * Math.PI * 2
            angle = a1
            var large = (a1 - a0) > Math.PI ? 1 : 0
            var p = function (rad, a) { return [cx + rad * Math.cos(a), cy + rad * Math.sin(a)] }
            var o0 = p(R, a0), o1 = p(R, a1), i1 = p(r, a1), i0 = p(r, a0)
            // full-circle guard
            if (frac > 0.999) {
                return '<circle cx="' + cx + '" cy="' + cy + '" r="' + ((R + r) / 2) + '" fill="none" stroke="' + s.color + '" stroke-width="' + (R - r) + '"/>'
            }
            return '<path d="M' + o0 + 'A' + R + ',' + R + ' 0 ' + large + ' 1 ' + o1 +
                'L' + i1 + 'A' + r + ',' + r + ' 0 ' + large + ' 0 ' + i0 + 'Z" fill="' + s.color + '">' +
                '<title>' + esc(s.label + ': ' + num(s.value)) + '</title></path>'
        }).join('')

        var center = '<text x="' + cx + '" y="' + (cy - 2) + '" text-anchor="middle" font-size="19" font-weight="800" fill="#f1f5f9">' +
            num(learnTotal) + '</text>' +
            '<text x="' + cx + '" y="' + (cy + 13) + '" text-anchor="middle" font-size="8.5" fill="#94a3b8">learnable</text>'

        host.innerHTML = '<svg viewBox="0 0 120 120" width="120" height="120" role="img" aria-label="' +
            esc('Deck composition: ' + segs.map(function (s) { return s.label + ' ' + s.value }).join(', ')) +
            '">' + paths + center + '</svg>'

        var legend = el('donut-legend')
        if (legend) {
            legend.innerHTML = segs.map(function (s) {
                var pct = Math.round((s.value / total) * 100)
                return '<div class="flex items-center gap-x-2" title="' + esc(s.hint) + '">' +
                    '<span class="w-2.5 h-2.5 rounded-sm shrink-0" style="background:' + s.color + '" aria-hidden="true"></span>' +
                    '<span class="font-semibold text-slate-200">' + s.label + '</span>' +
                    '<span class="ml-auto font-extrabold stat-number">' + num(s.value) + '</span>' +
                    '<span class="text-slate-500 w-8 text-right">' + pct + '%</span>' +
                    '</div>'
            }).join('') +
            '<div class="pt-1.5 mt-1.5 border-t border-slate-800 flex items-center gap-x-2 text-slate-400">' +
                '<span class="w-2.5 h-2.5 rounded-sm shrink-0 bg-slate-600" aria-hidden="true"></span>' +
                '<span class="font-semibold">Reference</span>' +
                '<span class="ml-auto font-extrabold stat-number">' + num(data.reference) + '</span>' +
            '</div>' +
            '<div class="text-[10px] text-slate-500 leading-tight">browse-only dictionary entries, kept out of reviews</div>'
        }
    }

    /* ---- 3. mastery by category ---- */
    function renderCategoryBars() {
        var host = el('category-bars')
        if (!host) return
        var CM = (typeof CATEGORY_META !== 'undefined') ? CATEGORY_META : {}
        var learn = learnDeck()
        var rows = {}
        learn.forEach(function (c) {
            var r = rows[c.category] || (rows[c.category] = { total: 0, mature: 0, due: 0 })
            r.total++
            if (c.interval >= 10) r.mature++
            if ((c.nextReview || 0) <= Date.now()) r.due++
        })
        var keys = Object.keys(rows).sort(function (a, b) { return rows[b].total - rows[a].total }).slice(0, 10)
        if (!keys.length) { host.innerHTML = '<div class="text-xs text-slate-500">No deck data.</div>'; return }

        host.innerHTML = keys.map(function (k) {
            var r = rows[k], m = CM[k] || {}
            var pct = r.total ? Math.round((r.mature / r.total) * 100) : 0
            return '<button onclick="HUB.drill(\'' + esc(k) + '\')" class="click-row w-full text-left group" ' +
                'aria-label="' + esc(m.label || k) + ': ' + pct + '% mature, ' + r.due + ' due. Open this category.">' +
                '<div class="flex items-center gap-x-2 text-xs">' +
                    '<span class="w-32 shrink-0 truncate font-semibold text-slate-200 group-hover:text-white">' +
                        '<i class="fa-solid ' + (m.icon || 'fa-tag') + ' ' + (m.tint || 'text-slate-400') + ' mr-1.5 w-3.5" aria-hidden="true"></i>' +
                        esc(m.label || k) + '</span>' +
                    '<span class="mini-bar-track flex-1 h-2.5 bg-slate-800 rounded-full overflow-hidden relative">' +
                        '<span class="mini-bar absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full" style="width:' + pct + '%"></span>' +
                    '</span>' +
                    '<span class="w-9 text-right font-extrabold stat-number">' + pct + '%</span>' +
                    '<span class="w-16 text-right text-slate-500 stat-number hidden sm:inline">' + num(r.mature) + '/' + num(r.total) + '</span>' +
                    '<span class="w-12 text-right ' + (r.due ? 'text-indigo-300 font-bold' : 'text-slate-600') + '">' + (r.due ? r.due + ' due' : '—') + '</span>' +
                '</div></button>'
        }).join('')
    }

    /* ---- 4. content map (library by module) + type mix ---- */
    function renderContentMap() {
        var host = el('module-bars')
        if (!host) return
        var counts = {}
        CAT.forEach(function (e) { counts[e.m] = (counts[e.m] || 0) + 1 })
        var keys = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a] })
        var max = Math.max.apply(null, keys.map(function (k) { return counts[k] }))

        host.innerHTML = keys.map(function (k) {
            var pct = Math.round((counts[k] / max) * 100)
            return '<button onclick="HUB.setModule(\'' + esc(k) + '\', true)" class="click-row text-left group" ' +
                'aria-label="' + esc(modLabel(k)) + ': ' + counts[k] + ' pages. Open in the library.">' +
                '<div class="flex items-center gap-x-2 text-xs py-0.5">' +
                    '<span class="w-28 shrink-0 truncate font-semibold text-slate-200 group-hover:text-white">' + esc(modLabel(k)) + '</span>' +
                    '<span class="mini-bar-track flex-1 h-2 bg-slate-800 rounded-full overflow-hidden relative">' +
                        '<span class="mini-bar absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ' + modGrad(k) + '" style="width:' + pct + '%"></span>' +
                    '</span>' +
                    '<span class="w-7 text-right font-extrabold stat-number">' + counts[k] + '</span>' +
                '</div></button>'
        }).join('')

        var mix = el('type-mix')
        if (mix) {
            var kinds = {}
            CAT.forEach(function (e) { kinds[e.k] = (kinds[e.k] || 0) + 1 })
            mix.innerHTML = Object.keys(kinds).sort(function (a, b) { return kinds[b] - kinds[a] }).map(function (k) {
                var km = kindMeta(k)
                return '<button onclick="HUB.tab(\'library\');HUB.setKind(\'' + esc(k) + '\')" ' +
                    'class="px-2.5 py-1 rounded-xl text-[11px] font-bold border ' + km.tint + ' hover:brightness-125">' +
                    '<i class="fa-solid ' + km.icon + ' mr-1" aria-hidden="true"></i>' + km.label + ' ' + kinds[k] + '</button>'
            }).join('')
        }
    }

    function renderCharts() {
        renderForecast()
        renderDonut()
        renderCategoryBars()
        renderContentMap()
        syncKpis()
    }

    function syncKpis() {
        var learn = learnDeck()
        var due = learn.filter(function (c) { return (c.nextReview || 0) <= Date.now() }).length
        var mature = learn.filter(function (c) { return c.interval >= 10 }).length
        setText('kpi-learnable', num(learn.length))
        setText('nav-due', num(due))
        setText('nav-mastered', num(mature))
        setText('nav-pages', num(CAT.length))
        setText('tab-due-badge', num(due))
        setText('tab-pages-badge', num(CAT.length))
        setText('surprise-count', num(CAT.length))
        var last = recents()[0]
        var lastEntry = last && byPath(last)
        setText('resume-label', lastEntry ? lastEntry.t.slice(0, 38) : 'Pick a lesson')
    }

    /* ============================================================= LIBRARY */
    function matches(e) {
        if (state.module !== 'all' && e.m !== state.module) return false
        if (state.kind !== 'all' && e.k !== state.kind) return false
        if (!state.q) return true
        var hay = (e.t + ' ' + e.d + ' ' + e.p + ' ' + e.ar + ' ' + modLabel(e.m)).toLowerCase()
        return state.q.split(/\s+/).every(function (tok) { return hay.indexOf(tok) !== -1 })
    }
    function filtered() { return CAT.filter(matches) }

    function cardHTML(e) {
        var km = kindMeta(e.k)
        return '' +
        '<button onclick="HUB.open(\'' + esc(e.p) + '\')" class="modern-card text-left bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-3xl p-4 flex flex-col group">' +
            '<div class="flex items-start justify-between gap-2">' +
                '<div class="w-9 h-9 shrink-0 rounded-2xl bg-gradient-to-br ' + modGrad(e.m) + ' flex items-center justify-center">' +
                    '<i class="fa-solid ' + modIcon(e.m) + ' text-slate-900 text-sm" aria-hidden="true"></i>' +
                '</div>' +
                '<span class="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-xl border ' + km.tint + '">' +
                    '<i class="fa-solid ' + km.icon + ' mr-1" aria-hidden="true"></i>' + km.label +
                '</span>' +
            '</div>' +
            '<div class="mt-3 font-bold leading-snug text-slate-100 group-hover:text-white line-clamp-2">' + esc(e.t) + '</div>' +
            (e.d ? '<div class="mt-1.5 text-xs text-slate-400 leading-relaxed line-clamp-3">' + esc(e.d) + '</div>' : '') +
            '<div class="mt-auto pt-3 flex items-center justify-between text-[11px] text-slate-500">' +
                '<span class="font-semibold">' + esc(modLabel(e.m)) + '</span>' +
                '<span>' + (e.a ? '<i class="fa-solid fa-volume-high mr-1 text-emerald-400" aria-hidden="true"></i>' : '') + e.s + ' KB</span>' +
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
              '<i class="fa-solid fa-magnifying-glass text-3xl mb-3 block" aria-hidden="true"></i>No page matches that search.</div>'
        setText('library-count', num(list.length))
        setText('library-shown', num(shown.length))
        var more = el('library-more')
        if (more) {
            more.classList.toggle('hidden', shown.length >= list.length)
            more.textContent = 'Load ' + Math.min(PAGE, list.length - shown.length) + ' more'
        }
    }

    function renderModuleChips() {
        var counts = {}
        CAT.forEach(function (e) { counts[e.m] = (counts[e.m] || 0) + 1 })
        var keys = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a] })
        var wrap = el('module-chips')
        if (!wrap) return
        wrap.innerHTML = ['all'].concat(keys).map(function (k) {
            var active = state.module === k
            var label = k === 'all' ? 'All modules' : modLabel(k)
            var n = k === 'all' ? CAT.length : counts[k]
            return '<button onclick="HUB.setModule(\'' + esc(k) + '\')" aria-pressed="' + active + '" ' +
                'class="px-3 py-1.5 rounded-2xl text-xs font-bold border transition-colors ' +
                (active ? 'bg-indigo-500 border-indigo-400 text-white' : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500') +
                '">' + esc(label) + ' <span class="opacity-60">' + n + '</span></button>'
        }).join('')
    }

    function renderKindChips() {
        var counts = {}
        CAT.forEach(function (e) { counts[e.k] = (counts[e.k] || 0) + 1 })
        var wrap = el('kind-chips')
        if (!wrap) return
        wrap.innerHTML = ['all'].concat(Object.keys(counts).sort()).map(function (k) {
            var active = state.kind === k
            var label = k === 'all' ? 'Everything' : kindMeta(k).label
            var icon = k === 'all' ? 'fa-layer-group' : kindMeta(k).icon
            var n = k === 'all' ? CAT.length : counts[k]
            return '<button onclick="HUB.setKind(\'' + esc(k) + '\')" aria-pressed="' + active + '" ' +
                'class="px-3 py-1.5 rounded-2xl text-xs font-bold border transition-colors ' +
                (active ? 'bg-slate-100 border-slate-100 text-slate-900' : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500') +
                '"><i class="fa-solid ' + icon + ' mr-1.5" aria-hidden="true"></i>' + esc(label) + ' <span class="opacity-60">' + n + '</span></button>'
        }).join('')
    }

    function renderModuleGrid() {
        var counts = {}, audio = {}
        CAT.forEach(function (e) {
            counts[e.m] = (counts[e.m] || 0) + 1
            if (e.a) audio[e.m] = (audio[e.m] || 0) + 1
        })
        var keys = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a] })
        var grid = el('module-grid')
        if (!grid) return
        grid.innerHTML = keys.map(function (k) {
            var m = META[k] || {}
            return '' +
            '<button onclick="HUB.setModule(\'' + esc(k) + '\', true)" class="modern-card text-left bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-3xl p-5 flex flex-col">' +
                '<div class="flex items-center justify-between">' +
                    '<div class="w-11 h-11 rounded-2xl bg-gradient-to-br ' + modGrad(k) + ' flex items-center justify-center">' +
                        '<i class="fa-solid ' + modIcon(k) + ' text-slate-900 text-lg" aria-hidden="true"></i>' +
                    '</div>' +
                    '<div class="text-right"><div class="text-2xl font-extrabold stat-number">' + counts[k] + '</div>' +
                    '<div class="text-[10px] uppercase tracking-wider text-slate-500 font-bold">pages</div></div>' +
                '</div>' +
                '<div class="mt-4 font-bold text-lg tracking-tight">' + esc(modLabel(k)) + '</div>' +
                '<div class="mt-1 text-xs text-slate-400 leading-relaxed">' + esc(m.blurb || '') + '</div>' +
                (audio[k] ? '<div class="mt-3 text-[11px] text-emerald-300 font-bold"><i class="fa-solid fa-volume-high mr-1" aria-hidden="true"></i>' + audio[k] + ' with audio</div>' : '') +
            '</button>'
        }).join('')
    }

    function renderRecents() {
        var wrap = el('recent-list')
        if (!wrap) return
        var list = recents().map(byPath).filter(Boolean)
        if (!list.length) {
            wrap.innerHTML = '<div class="text-xs text-slate-500 py-2">Nothing opened yet — pick any lesson from the library and it will show up here.</div>'
            return
        }
        wrap.innerHTML = list.map(function (e) {
            var km = kindMeta(e.k)
            return '<button onclick="HUB.open(\'' + esc(e.p) + '\')" class="shrink-0 w-56 text-left bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-2xl px-4 py-3">' +
                '<div class="flex items-center gap-x-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">' +
                    '<i class="fa-solid ' + km.icon + '" aria-hidden="true"></i>' + esc(modLabel(e.m)) + '</div>' +
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
                        '<i class="fa-solid fa-music text-slate-900 text-sm" aria-hidden="true"></i></div>' +
                    '<div class="min-w-0"><div class="text-sm font-bold truncate">' + esc(m.t) + '</div>' +
                    '<div class="text-[11px] text-slate-500">' + esc(modLabel(m.m)) + ' • ' + (Math.round(m.s / 1024 * 10) / 10) + ' MB</div></div>' +
                '</div>' +
                '<audio controls preload="none" class="w-full mt-3 h-9" src="' + encodeURI(m.p) + '"></audio>' +
            '</div>'
        }).join('')
    }

    function audioMinutes() {
        // rough: mp3 ≈ 960 KB/min at 128 kbps, wav ≈ 5300 KB/min at 16-bit 44.1 kHz mono
        var mins = MEDIA.reduce(function (a, m) {
            return a + m.s / (/\.wav$/i.test(m.p) ? 5300 : 960)
        }, 0)
        return Math.round(mins)
    }

    /* ============================================================== VIEWER */
    function open(path) {
        var e = byPath(path)
        var frame = el('viewer-frame')
        setText('viewer-title', e ? e.t : path)
        setText('viewer-sub', (e ? modLabel(e.m) + ' • ' : '') + path)
        el('viewer-open').href = path
        frame.src = path
        el('viewer').classList.remove('hidden')
        document.body.style.overflow = 'hidden'
        pushRecent(path)
        syncKpis()
        setHash('#view=' + path)
    }
    function close() {
        el('viewer').classList.add('hidden')
        el('viewer-frame').src = 'about:blank'
        document.body.style.overflow = ''
        if (location.hash.indexOf('#view=') === 0) setHash('#' + state.tab)
    }

    /* ============================================================== PUBLIC */
    var HUB = {
        tab: function (name) { activate(name, true) },
        /* jump to a section, switching to its tab first */
        goto: function (id) {
            var panel = panelOf(id)
            if (panel && panel !== state.tab) activate(panel)
            setTimeout(function () { scrollToEl(el(id)) }, 40)
        },
        open: open,
        close: close,
        focusSearch: function () {
            activate('library')
            var b = el('library-search')
            if (b) b.focus()
        },
        setModule: function (m, jump) {
            state.module = m; state.page = 0
            if (jump) activate('library')
            renderModuleChips(); renderLibrary()
            if (jump) scrollToEl(el('library'))
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
            var list = filtered().length ? filtered() : CAT
            if (list.length) open(list[Math.floor(Math.random() * list.length)].p)
        },
        resume: function () {
            var last = recents()[0]
            if (last) open(last)
            else activate('library')
        },
        /* category row → open that category's cards in the deck browser */
        drill: function (category) {
            activate('study')
            if (typeof filterDeckByCategory === 'function') filterDeckByCategory(category)
            else scrollToEl(el('anki'))
        },
        reset: function () {
            state.q = ''; state.module = 'all'; state.kind = 'all'; state.page = 0
            var b = el('library-search'); if (b) b.value = ''
            renderModuleChips(); renderKindChips(); renderLibrary()
        },
        refresh: renderCharts
    }
    window.HUB = HUB

    /* mobile/overflow nav: the tab bar is already scrollable, so this just
       jumps to a section of the active tab */
    window.showMobileNav = function () { HUB.tab('library') }

    /* ================================================================ INIT */
    function init() {
        wireTabs()
        renderModuleChips()
        renderKindChips()
        renderLibrary()
        renderModuleGrid()
        renderRecents()
        renderMedia()

        setText('stat-pages', num(CAT.length))
        setText('stat-modules', Object.keys(CAT.reduce(function (a, e) { a[e.m] = 1; return a }, {})).length)
        setText('stat-audio', num(CAT.filter(function (e) { return e.a }).length + MEDIA.length))
        setText('stat-minutes', num(audioMinutes()))
        renderCharts()

        var box = el('library-search')
        if (box) {
            var t = null
            box.addEventListener('input', function (ev) {
                clearTimeout(t)
                var v = ev.target.value
                t = setTimeout(function () { HUB.search(v) }, 120)
            })
        }

        document.addEventListener('keydown', function (ev) {
            if (ev.key === 'Escape' && !el('viewer').classList.contains('hidden')) close()
            if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'k') {
                ev.preventDefault()
                HUB.focusSearch()
            }
        })

        function fromHash() {
            var h = location.hash
            if (h.indexOf('#view=') === 0) { open(decodeURIComponent(h.slice(6))); return }
            var name = h.replace('#', '')
            if (TABS.indexOf(name) !== -1) { activate(name); return }
            // deep links to sections inside a tab (e.g. #practice, #media)
            var map = { anki: 'study', translit: 'study', practice: 'study', vocab: 'dictionary', modules: 'library', media: 'library', dashboard: 'overview' }
            if (map[name]) {
                activate(map[name])
                setTimeout(function () { scrollToEl(el(name)) }, 60)
            }
        }
        fromHash()
        window.addEventListener('hashchange', fromHash)

        /* keep the charts honest: refresh after every SRS write */
        if (typeof window.saveCardData === 'function') {
            var origSave = window.saveCardData
            window.saveCardData = function () {
                var r = origSave.apply(this, arguments)
                renderCharts()
                return r
            }
        }
        /* and once the engine has finished its own boot pass */
        window.addEventListener('load', function () { setTimeout(renderCharts, 120) })
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init)
    } else {
        init()
    }
})()
