/* ------------------------------------------------------------------
   LebLearn engine: SM-2 SRS, quizzes, drills, vocabulary tables
   Extracted verbatim from lebanese-arabic-anki.html by tools/split_leblearn.py
   Do not hand-edit: re-run the script instead.
   ------------------------------------------------------------------ */

        function initializeTailwind() {
            if (typeof tailwind === 'undefined') return;
            tailwind.config = {
                theme: {
                    extend: {
                        fontFamily: {
                            'display': ['Space Grotesk', 'system-ui', 'sans-serif']
                        }
                    }
                }
            };
        }
        
        // =====================================================================
        // FULL LEBANESE ARABIC DICTIONARY  •  original 35 seed cards (progress
        // compatible) + complete dictionary additions across 13 categories
        // =====================================================================
        const REF_CAT = { 'MSA': 'Reference - MSA', 'LEV': 'Reference - Levantine', 'OTH': 'Reference - Other dialects' };
        DICT2.forEach((d, i) => {
            const id = 747 + i;
            cards.push({
                id: id, english: d[0], arabic: d[1], translit: d[2],
                category: REF_CAT[d[3]] || d[3], example: '', difficulty: 'Reference', ref: true,
                interval: 1, ease: 2.5, nextReview: NOW + 30 * DAY, reviews: 0
            });
        });

        // Learnable pool (curated cards only) — SRS, quizzes, lessons, drills
        const learnCards = cards.filter(c => !c.ref);
        // =====================================================================
        // HELPERS
        // =====================================================================
        function shuffle(arr) {
            const a = [...arr]
            for (let i = a.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1))
                const tmp = a[i]
                a[i] = a[j]
                a[j] = tmp
            }
            return a
        }

        function norm(s) {
            return (s || '').toLowerCase().replace(/\s+/g, '').replace(/[.,!?؟]/g, '')
        }

        function esc(s) {
            return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
        }

        function mkModal(id) {
            const m = document.createElement('div')
            m.id = id
            m.className = 'fixed inset-0 bg-black/70 backdrop-blur-sm z-[130] flex items-center justify-center'
            m.innerHTML = '<div class="max-w-md mx-4 w-full"></div>'
            m.querySelector('div').addEventListener('click', e => e.stopPropagation())
            m.addEventListener('click', e => { if (e.target === m) m.remove() })
            document.body.appendChild(m)
            return m
        }

        function toast(msg) {
            const t = document.createElement('div')
            t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:999999'
            t.innerHTML = '<div class="dark-glass rounded-[3rem] shadow-xl px-5 py-2.5 border border-emerald-700 flex items-center gap-x-3">' +
                '<i class="fa-solid fa-circle-check text-emerald-300"></i><div class="text-sm font-bold">' + msg + '</div></div>'
            document.body.appendChild(t)
            setTimeout(() => t.remove(), 3200)
        }

        function showResultModal(title, score, total, message, retryFn) {
            const modal = mkModal('result-modal')
            const pct = Math.round((score / total) * 100)
            window.__retryFn = retryFn
            modal.innerHTML = '<div class="dark-glass border border-slate-700 rounded-3xl p-7 text-center">' +
                '<div class="font-extrabold text-2xl">' + esc(title) + '</div>' +
                '<div class="mt-2"><span class="text-6xl font-extrabold">' + score + '</span><span class="text-2xl font-bold text-slate-400">/' + total + '</span></div>' +
                '<div class="mt-2"><span class="px-3 py-1 rounded-[2rem] font-extrabold bg-emerald-900/30 px-4 text-emerald-300 text-sm">' + pct + '%</span></div>' +
                '<div class="text-xs font-semibold text-slate-300 mt-2">' + esc(message) + '</div>' +
                '<div class="mt-6 flex gap-2">' +
                '<button onclick="this.closest(\'.fixed\').remove(); (window.__retryFn)()" class="flex-1 py-3 text-sm font-extrabold rounded-3xl bg-emerald-300 text-emerald-900">RETRY</button>' +
                '<button onclick="this.closest(\'.fixed\').remove()" class="flex-1 py-3 text-sm font-extrabold rounded-3xl bg-slate-700">DONE</button>' +
                '</div></div>'
        }

        // =====================================================================
        // CATEGORIES
        // =====================================================================
        const CATEGORY_META = {
            'Greetings':      { label: 'Greetings',          icon: 'fa-handshake',     grad: 'from-sky-400 to-blue-400',       tint: 'text-sky-300' },
            'Food':           { label: 'Food & Drink',       icon: 'fa-utensils',      grad: 'from-orange-400 to-amber-400',   tint: 'text-orange-300' },
            'Daily':          { label: 'Daily Life',         icon: 'fa-home',          grad: 'from-teal-300 to-emerald-400',   tint: 'text-teal-300' },
            'Travel':         { label: 'Travel',             icon: 'fa-plane',         grad: 'from-violet-400 to-purple-400',  tint: 'text-violet-300' },
            'Emotions':       { label: 'Emotions & Social',  icon: 'fa-heart',         grad: 'from-rose-400 to-pink-400',      tint: 'text-pink-300' },
            'Family':         { label: 'Family',             icon: 'fa-people-roof',   grad: 'from-amber-400 to-yellow-400',   tint: 'text-amber-300' },
            'Numbers & Time': { label: 'Numbers & Time',     icon: 'fa-clock',         grad: 'from-cyan-400 to-sky-400',       tint: 'text-cyan-300' },
            'Body & Health':  { label: 'Body & Health',      icon: 'fa-heart-pulse',   grad: 'from-red-400 to-rose-400',       tint: 'text-red-300' },
            'Nature':         { label: 'Nature & Weather',   icon: 'fa-leaf',          grad: 'from-green-400 to-emerald-400',  tint: 'text-green-300' },
            'Shopping':       { label: 'Shopping & Money',   icon: 'fa-cart-shopping', grad: 'from-fuchsia-400 to-pink-400',   tint: 'text-fuchsia-300' },
            'Colors':         { label: 'Colors',             icon: 'fa-palette',       grad: 'from-indigo-400 to-violet-400',  tint: 'text-indigo-300' },
            'School & Work': { label: 'School & Work', icon: 'fa-briefcase', grad: 'from-slate-400 to-slate-300', tint: 'text-slate-300' },
            'Phrases': { label: 'Useful Phrases', icon: 'fa-comments', grad: 'from-lime-400 to-green-400', tint: 'text-lime-300' },
                        'Business': { label: 'Business', icon: 'fa-suitcase', grad: 'from-blue-400 to-sky-400', tint: 'text-blue-300' },
            'Technology': { label: 'Technology', icon: 'fa-microchip', grad: 'from-cyan-400 to-teal-400', tint: 'text-cyan-300' },
            'Culture & Religion': { label: 'Culture & Religion', icon: 'fa-star-and-crescent', grad: 'from-emerald-400 to-green-400', tint: 'text-emerald-300' },
            'Sports': { label: 'Sports', icon: 'fa-futbol', grad: 'from-lime-400 to-emerald-400', tint: 'text-lime-300' },
            'Clothing': { label: 'Clothing', icon: 'fa-shirt', grad: 'from-pink-400 to-rose-400', tint: 'text-pink-300' },
            'Plants & Flowers': { label: 'Plants & Flowers', icon: 'fa-seedling', grad: 'from-green-400 to-teal-400', tint: 'text-green-300' },
            'Idioms & Expressions': { label: 'Idioms & Expressions', icon: 'fa-quote-left', grad: 'from-amber-400 to-orange-400', tint: 'text-amber-300' },
            'Reference - MSA': { label: 'Reference: MSA', icon: 'fa-book-open', grad: 'from-slate-500 to-slate-400', tint: 'text-slate-300', ref: true },
            'Reference - Levantine': { label: 'Reference: Levantine', icon: 'fa-map', grad: 'from-amber-300 to-yellow-300', tint: 'text-amber-200', ref: true },
            'Reference - Other dialects': { label: 'Reference: Other dialects', icon: 'fa-earth-africa', grad: 'from-stone-400 to-neutral-300', tint: 'text-stone-300', ref: true }
        }
        let catCounts = {}
        function computeCatCounts() {
            catCounts = {}
            cards.forEach(c => { catCounts[c.category] = (catCounts[c.category] || 0) + 1 })
        }

        // =====================================================================
        // PROGRESS (localStorage)
        // =====================================================================
        function loadCardData() {
            let saved = null
            try { saved = localStorage.getItem('lebanese-anki-cards') } catch (e) { return }
            if (saved) {
                const parsed = JSON.parse(saved)
                parsed.forEach(savedCard => {
                    const cardIndex = cards.findIndex(c => c.id === savedCard.id)
                    if (cardIndex !== -1) {
                        cards[cardIndex].interval = savedCard.interval
                        cards[cardIndex].ease = savedCard.ease
                        cards[cardIndex].nextReview = savedCard.nextReview
                        cards[cardIndex].reviews = savedCard.reviews || 0
                    }
                })
            }
        }

        // Delta-only persistence: store just the cards that changed, so
        // localStorage stays tiny even with 100k+ reference entries.
        const dirtyIds = new Set()
        function markDirty(id) { dirtyIds.add(id) }
        function saveCardData() {
            try {
                const existing = JSON.parse(localStorage.getItem('lebanese-anki-cards') || '[]')
                const map = new Map(existing.map(e => [e.id, e]))
                const byId = new Map(cards.map(c => [c.id, c]))
                dirtyIds.forEach(id => {
                    const c = byId.get(id)
                    if (c) map.set(id, { id: c.id, interval: c.interval, ease: c.ease, nextReview: c.nextReview, reviews: c.reviews })
                })
                localStorage.setItem('lebanese-anki-cards', JSON.stringify([...map.values()]))
            } catch (e) { /* storage full or unavailable — keep going */ }
            dirtyIds.clear()
            updateAllStats()
        }

        function getDueCards() {
            const now = Date.now()
            return cards.filter(card => !card.ref && card.nextReview <= now).sort((a, b) => a.nextReview - b.nextReview)
        }

        // =====================================================================
        // DYNAMIC STATS
        // =====================================================================
        function updateAllStats() {
            const total = cards.length
            const learn = learnCards
            computeCatCounts()
            const mastered = learn.filter(c => c.interval >= 10).length
            const learning = learn.filter(c => c.reviews >= 3 && c.interval < 10).length
            const fresh = learn.length - mastered - learning
            const due = getDueCards().length
            const pct = Math.round((mastered / learn.length) * 100)

            const set = (id, v) => { const el = document.getElementById(id); if (el) el.innerHTML = v }
            set('hero-badge', total.toLocaleString('en-US') + ' words • ' + Object.keys(CATEGORY_META).length + ' categories')
            set('hero-total', total.toLocaleString('en-US'))
            set('mastered-count', mastered)
            set('mastered-total', learn.length)
            set('mastered-pct', pct + '%')
            const bar = document.getElementById('mastered-bar')
            if (bar) bar.style.width = pct + '%'
            set('stat-due', due)
            set('due-btn-count', due)
            set('deck-total-badge', total.toLocaleString('en-US') + ' cards')
            set('deck-modal-total', total.toLocaleString('en-US') + ' cards')
            set('ov-new', fresh)
            set('ov-learning', learning)
            set('ov-mature', mastered)
            set('vocab-count', total.toLocaleString('en-US'))
            set('pc-quiz', total.toLocaleString('en-US') + ' words')
            set('pc-listen', total.toLocaleString('en-US') + ' phrases')
            set('pc-scen', scenarios.length + ' scenarios')
            set('pc-sent', sentences.length + ' sentences')

            buildCategoryGrid()
            buildMasteryList()
            renderWOD()
        }

        function buildCategoryGrid() {
            const grid = document.getElementById('category-grid')
            if (!grid) return
            grid.innerHTML = Object.entries(CATEGORY_META).map(([key, m]) => {
                const count = catCounts[key] || 0
                if (!count) return ''
                return '<div onclick="filterDeckByCategory(\'' + key.replace(/'/g, "\\'") + '\')" class="flex items-center gap-x-3 px-3 py-2.5 hover:bg-slate-800 transition-colors bg-slate-900 rounded-2xl cursor-pointer">' +
                    '<div class="w-7 h-7 flex-shrink-0 rounded-2xl bg-gradient-to-br ' + m.grad + ' flex items-center justify-center"><i class="fa-solid ' + m.icon + ' text-white text-xs"></i></div>' +
                    '<div class="flex-1 min-w-0"><div class="font-semibold text-sm truncate">' + m.label + '</div>' +
                    '<div class="text-[10px] ' + m.tint + '">' + count.toLocaleString('en-US') + ' cards</div></div></div>'
            }).join('')
        }

        function buildMasteryList() {
            const list = document.getElementById('mastery-list')
            if (!list) return
            const rows = Object.keys(CATEGORY_META).map(k => {
                const cs = learnCards.filter(c => c.category === k)
                return { k, total: cs.length, mature: cs.filter(c => c.interval >= 10).length }
            }).filter(x => x.total && !CATEGORY_META[x.k].ref).sort((a, b) => b.total - a.total).slice(0, 5)
            list.innerHTML = rows.map(x => {
                const m = CATEGORY_META[x.k]
                const pct = x.total ? Math.round((x.mature / x.total) * 100) : 0
                return '<div class="flex items-center gap-x-2 text-xs">' +
                    '<div class="flex items-center gap-x-1.5 w-28 shrink-0"><span class="' + m.tint + '">•</span><span class="truncate">' + m.label + '</span></div>' +
                    '<div class="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden"><div class="h-full bg-gradient-to-r from-emerald-400 to-teal-400" style="width:' + pct + '%"></div></div>' +
                    '<span class="font-bold w-8 text-right">' + pct + '%</span></div>'
            }).join('')
        }

        function wordOfTheDay() {
            const d = new Date()
            const start = new Date(d.getFullYear(), 0, 0)
            const doy = Math.floor((d - start) / DAY)
            return learnCards[doy % learnCards.length]
        }

        function renderWOD() {
            const w = wordOfTheDay()
            const m = CATEGORY_META[w.category] || { label: w.category }
            const setT = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v }
            setT('dod-arabic', w.arabic)
            setT('dod-translit', w.translit)
            setT('dod-english', w.english)
            setT('dod-example', w.example)
            setT('dod-cat', m.label)
            const listen = document.getElementById('dod-listen')
            if (listen) listen.onclick = () => playAudioText(w.arabic, w.translit)
            const review = document.getElementById('dod-review')
            if (review) review.onclick = () => previewCard(w.id)
        }

        // =====================================================================
        // ANKI SRS
        // =====================================================================
        let currentCardIndex = 0
        let currentSessionCards = []
        let isFlipped = false

        function startAnkiSession() {
            const due = getDueCards()
            let session = due.slice(0, 12)
            if (session.length < 8) {
                const fresh = learnCards.filter(c => c.reviews < 3 && !session.includes(c))
                session = session.concat(shuffle(fresh).slice(0, 8 - session.length))
            }
            if (!session.length) session = learnCards.slice(0, 6)

            currentSessionCards = session
            currentCardIndex = 0
            isFlipped = false

            document.getElementById('anki-modal').style.display = 'flex'
            renderCurrentCard()
        }

        function renderCurrentCard() {
            if (!currentSessionCards.length) return
            const card = currentSessionCards[currentCardIndex]

            document.getElementById('card-front-text').innerHTML = card.english
            document.getElementById('card-category').innerHTML = card.category.toUpperCase()
            document.getElementById('card-progress').innerHTML = (currentCardIndex + 1) + ' / ' + currentSessionCards.length

            const ankiCard = document.getElementById('anki-card')
            ankiCard.classList.remove('flipped')
            isFlipped = false

            document.getElementById('card-arabic').innerHTML = card.arabic
            document.getElementById('card-translit').innerHTML = card.translit
            document.getElementById('card-example').innerHTML = card.example || '—'
            document.getElementById('card-difficulty').innerHTML = card.difficulty

            const srsBtns = document.getElementById('srs-buttons')
            srsBtns.style.opacity = '0.25'
            srsBtns.style.pointerEvents = 'none'
        }

        function flipCard() {
            const cardEl = document.getElementById('anki-card')
            const srsBtns = document.getElementById('srs-buttons')
            if (!isFlipped) {
                cardEl.classList.add('flipped')
                isFlipped = true
                srsBtns.style.transitionDuration = '120ms'
                srsBtns.style.opacity = '1'
                srsBtns.style.pointerEvents = 'all'
            } else {
                cardEl.classList.remove('flipped')
                isFlipped = false
                srsBtns.style.opacity = '0.25'
                srsBtns.style.pointerEvents = 'none'
            }
        }

        function rateCard(rating) {
            if (!currentSessionCards.length) return
            const card = currentSessionCards[currentCardIndex]
            const oldInterval = card.interval || 1

            if (rating === 1) {
                card.interval = 1
                card.ease = Math.max(1.3, card.ease - 0.2)
            } else if (rating === 2) {
                card.interval = Math.max(2, Math.floor(oldInterval * 1.2))
                card.ease = Math.max(1.3, card.ease - 0.15)
            } else if (rating === 3) {
                if (oldInterval < 2) card.interval = 3
                else card.interval = Math.floor(oldInterval * card.ease)
                card.ease = Math.min(3.0, card.ease + 0.05)
            } else if (rating === 4) {
                card.interval = Math.floor(oldInterval * (card.ease * 1.3))
                card.ease = Math.min(3.2, card.ease + 0.15)
            }

            card.interval = Math.min(card.interval, 120)
            card.nextReview = Date.now() + (card.interval * 86400000)
            card.reviews = (card.reviews || 0) + 1

            markDirty(card.id)
            saveCardData()

            const feedback = document.createElement('div')
            feedback.style.cssText = 'position:absolute;bottom:13px;right:13px;'
            feedback.innerHTML = '<div class="px-3 py-1 bg-emerald-700/60 rounded-2xl text-xs font-bold flex items-center text-center justify-center" style="font-size:.7rem"><i class="fa-solid fa-check mr-1.5"></i> REVIEWED</div>'
            const cardContainer = document.getElementById('anki-card')
            cardContainer.appendChild(feedback)

            setTimeout(() => {
                feedback.remove()
                currentCardIndex++
                if (currentCardIndex < currentSessionCards.length) {
                    renderCurrentCard()
                } else {
                    finishAnkiSession()
                }
            }, 800)
        }

        function finishAnkiSession() {
            document.getElementById('anki-modal').style.display = 'none'
            toast('Session complete! <span class="text-emerald-300 font-medium">+' + (currentSessionCards.length * 3) + ' XP</span>')
        }

        function closeAnkiModal() {
            document.getElementById('anki-modal').style.display = 'none'
        }

        function previewCard(cardId) {
            const card = cards.find(c => c.id === cardId)
            if (!card) return

            document.getElementById('anki-modal').style.display = 'flex'
            currentSessionCards = [card]
            currentCardIndex = 0
            isFlipped = false

            renderCurrentCard()

            setTimeout(() => {
                const srsContainer = document.getElementById('srs-buttons')
                srsContainer.innerHTML =
                    '<div onclick="closeAnkiModal(); showAllDeck()" class="col-span-4 px-4 py-[9px] text-xs flex items-center justify-center font-bold bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 transition-colors text-center text-white rounded-3xl cursor-pointer">' +
                    '<span class="font-extrabold">OPEN FULL DECK</span></div>'
                srsContainer.style.opacity = '1'
                srsContainer.style.pointerEvents = 'all'
            }, 500)
        }

        // =====================================================================
        // DECK TABLE
        // =====================================================================
        function showAllDeck() {
            document.getElementById('deck-modal').style.display = 'flex'
            renderDeckTable(cards)
        }

        function closeDeckModal() {
            document.getElementById('deck-modal').style.display = 'none'
        }

        function cardStatusHTML(card) {
            if (card.interval >= 10) return '<span class="px-2.5 py-[1px] text-xs font-extrabold bg-emerald-900/40 text-emerald-300 rounded-[2rem]">MATURE</span>'
            if (card.reviews < 3) return '<span class="px-2.5 py-[1px] text-xs font-extrabold bg-sky-900/30 text-sky-300 rounded-[2rem]">NEW</span>'
            return '<span class="px-2.5 py-[1px] text-xs font-extrabold bg-orange-900/30 text-orange-300 rounded-[2rem]">LEARNING</span>'
        }

        const PAGE_SIZE = 50
        let deckList = [], deckPage = 0
        let vocabList = [], vocabPage = 0

        function renderDeckTable(filteredCards) {
            deckList = filteredCards || []
            deckPage = 0
            paintDeckPage()
        }

        function paintDeckPage() {
            const tbody = document.getElementById('deck-table-body')
            tbody.innerHTML = ''
            const now = Date.now()
            const start = deckPage * PAGE_SIZE
            const slice = deckList.slice(start, start + PAGE_SIZE)

            slice.forEach(card => {
                const due = card.nextReview < now
                    ? '<span class="text-red-300 text-xs font-medium">Due</span>'
                    : '<span class="text-emerald-300 text-xs font-medium">' + Math.ceil((card.nextReview - now) / (86400000)) + 'd</span>'
                const row = document.createElement('tr')
                row.className = 'phrase-row border-b border-slate-700 last:border-none'
                row.innerHTML =
                    '<td class="px-4 py-[9.5px]"><div class="font-semibold">' + esc(card.english) + '</div></td>' +
                    '<td class="px-4 py-[9.5px]"><div class="arabic-text text-xl font-extrabold leading-none">' + esc(card.arabic) + '</div></td>' +
                    '<td class="px-4 py-[9.5px]"><div class="font-extrabold text-indigo-300">' + esc(card.translit) + '</div></td>' +
                    '<td class="px-4 py-[9.5px]"><div class="flex items-center">' + cardStatusHTML(card) + due + '</div></td>' +
                    '<td class="px-3 py-[9.5px]"><div class="flex items-center gap-x-1">' +
                    '<button onclick="window.__playCard(' + card.id + ')" class="px-2.5 py-[3px] text-xs font-extrabold bg-slate-800 hover:bg-slate-700 transition-colors rounded-[2.25rem] text-slate-300 text-[10px]"><i class="fa-solid fa-volume-up"></i></button>' +
                    '<button onclick="previewFromTable(' + card.id + '); event.stopImmediatePropagation()" class="px-3 py-[3px] text-xs font-extrabold bg-indigo-900/30 hover:bg-indigo-800/40 transition-colors px-3 rounded-[2.25rem] text-indigo-300 text-[10px]">REVIEW</button>' +
                    '</div></td>'
                tbody.appendChild(row)
            })

            document.getElementById('deck-count').innerHTML = deckList.length.toLocaleString('en-US')
            paintPager('deck-pager', deckList, deckPage, 'deckPageMove')
        }

        function deckPageMove(delta) {
            const pages = Math.max(1, Math.ceil(deckList.length / PAGE_SIZE))
            deckPage = Math.min(pages - 1, Math.max(0, deckPage + delta))
            paintDeckPage()
        }

        function paintPager(elId, list, page, moveFn) {
            const el = document.getElementById(elId)
            if (!el) return
            const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE))
            const btn = (dir, label, disabled) =>
                '<button onclick="' + moveFn + '(' + dir + ')" ' + (disabled ? 'disabled' : '') + ' class="px-4 py-[5px] font-extrabold bg-slate-800 hover:bg-slate-700 transition-colors rounded-[2rem] text-slate-200 disabled:opacity-30">' + label + '</button>'
            if (list.length <= PAGE_SIZE) {
                el.innerHTML = '<span class="text-slate-500 font-bold">' + list.length.toLocaleString('en-US') + ' cards</span>'
            } else {
                el.innerHTML =
                    btn(-1, '‹ PREV', page === 0) +
                    '<span class="font-bold text-slate-400">Page ' + (page + 1) + ' / ' + pages.toLocaleString('en-US') + ' · showing ' + (page * PAGE_SIZE + 1) + '–' + Math.min((page + 1) * PAGE_SIZE, list.length) + ' of ' + list.length.toLocaleString('en-US') + '</span>' +
                    btn(1, 'NEXT ›', page >= pages - 1)
            }
        }

        let deckSearchTimer = null
        function filterDeckTable() {
            if (deckSearchTimer) clearTimeout(deckSearchTimer)
            deckSearchTimer = setTimeout(() => {
                const searchVal = document.getElementById('deck-search').value.toLowerCase().trim()
                const filtered = cards.filter(card =>
                    card.english.toLowerCase().includes(searchVal) ||
                    card.arabic.toLowerCase().includes(searchVal) ||
                    (window.translitSearch
                        ? window.translitSearch(card, searchVal)
                        : card.translit.toLowerCase().includes(searchVal))
                )
                renderDeckTable(filtered)
            }, 150)
        }

        function previewFromTable(cardId) {
            closeDeckModal()
            setTimeout(() => previewCard(cardId), 300)
        }

        function filterDeckByCategory(category) {
            document.getElementById('deck-modal').style.display = 'flex'
            const filtered = cards.filter(c => c.category === category)
            renderDeckTable(filtered)
        }

        function resetDeckProgress() {
            if (!confirm('Reset all Anki progress?')) return
            learnCards.forEach(card => {
                card.interval = 1
                card.ease = 2.5
                card.nextReview = Date.now()
                card.reviews = 0
            })
            localStorage.removeItem('lebanese-anki-cards')
            updateAllStats()
            const modal = document.getElementById('deck-modal')
            if (modal.style.display === 'flex') renderDeckTable(cards)
            updateAllStats()
        }

        // =====================================================================
        // VOCAB TABLE
        // =====================================================================
        function buildVocabFilter() {
            const sel = document.getElementById('vocab-filter')
            if (!sel) return
            sel.innerHTML = '<option value="">All Categories (' + cards.length.toLocaleString('en-US') + ')</option>' +
                Object.entries(CATEGORY_META).map(([key, m]) => {
                    const count = catCounts[key] || 0
                    return count ? '<option value="' + key + '">' + m.label + ' (' + count.toLocaleString('en-US') + ')</option>' : ''
                }).join('')
        }

        function renderVocabTable(filtered) {
            vocabList = filtered || []
            vocabPage = 0
            paintVocabPage()
        }

        function paintVocabPage() {
            const tbody = document.getElementById('vocab-table-body')
            tbody.innerHTML = ''
            const start = vocabPage * PAGE_SIZE
            const slice = vocabList.slice(start, start + PAGE_SIZE)
            slice.forEach(card => {
                const row = document.createElement('tr')
                row.className = 'phrase-row border-b border-slate-700 last:border-none'
                row.innerHTML =
                    '<td class="px-4 py-[9px] font-semibold">' + esc(card.english) + '</td>' +
                    '<td class="px-4 py-[9px]"><span class="arabic-text text-xl font-extrabold">' + esc(card.arabic) + '</span></td>' +
                    '<td class="px-4 py-[9px]"><span class="font-extrabold text-indigo-300">' + esc(card.translit) + '</span></td>' +
                    '<td class="px-4 py-[9px]"><span class="px-2.5 text-xs py-[1px] bg-slate-800 rounded-2xl px-3 font-medium">' + esc(card.category) + '</span></td>' +
                    '<td class="px-4 py-[9px]"><div class="flex items-center gap-x-1">' +
                    '<button onclick="window.__playCard(' + card.id + ')" class="text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 transition-colors rounded-[2.25rem] px-3 text-slate-300 font-extrabold text-[10px]"><i class="fa-solid fa-volume-up"></i></button>' +
                    '<button onclick="previewCard(' + card.id + '); event.stopImmediatePropagation()" class="text-xs px-3 py-1 bg-indigo-900/30 hover:bg-indigo-800/40 transition-colors rounded-[2.25rem] px-3 text-indigo-300 font-extrabold text-[10px]">REVIEW</button>' +
                    '</div></td>'
                tbody.appendChild(row)
            })
            paintPager('vocab-pager', vocabList, vocabPage, 'vocabPageMove')
        }

        function vocabPageMove(delta) {
            const pages = Math.max(1, Math.ceil(vocabList.length / PAGE_SIZE))
            vocabPage = Math.min(pages - 1, Math.max(0, vocabPage + delta))
            paintVocabPage()
        }

        let vocabSearchTimer = null
        function filterVocabTable() {
            if (vocabSearchTimer) clearTimeout(vocabSearchTimer)
            vocabSearchTimer = setTimeout(() => {
                const search = document.getElementById('vocab-search').value.toLowerCase().trim()
                const catFilter = document.getElementById('vocab-filter').value
                let filtered = cards
                if (search) {
                    filtered = filtered.filter(c =>
                        c.english.toLowerCase().includes(search) ||
                        (window.translitSearch
                            ? window.translitSearch(c, search)
                            : c.translit.toLowerCase().includes(search)) ||
                        c.arabic.toLowerCase().includes(search)
                    )
                }
                if (catFilter) {
                    filtered = filtered.filter(c => c.category === catFilter)
                }
                renderVocabTable(filtered)
            }, 150)
        }

        // =====================================================================
        // TIPS
        // =====================================================================
        const tips = [
            { title: 'Spaced Repetition Mastery', subtitle: 'Anki SM-2 Algorithm', icon: 'fa-brain', iconBg: 'bg-gradient-to-br from-indigo-400 to-violet-400', body: 'The key to mastering Lebanese Arabic is reviewing right before you forget.<br><br>LebLearn uses the SM-2 algorithm (the same one Anki uses) to calculate optimal intervals.<br><br><strong>Tip:</strong> Always rate honestly. If you hesitated, pick "Hard" or "Again".' },
            { title: 'Shadowing Technique', subtitle: 'Immersive Listening', icon: 'fa-headset', iconBg: 'bg-gradient-to-br from-orange-400 to-amber-400', body: 'Shadowing is the fastest way to sound like a local Beirut speaker.<br><br>1. Play a native audio phrase.<br>2. Repeat immediately — match tone, speed and intonation.<br>3. Do this 10x for each phrase.<br><br>Focus on the guttural sounds: "3ayn" (ع) and "7a" (ح).' },
            { title: 'Contextual Mnemonics', subtitle: 'Memory Hacks', icon: 'fa-comments', iconBg: 'bg-gradient-to-br from-teal-400 to-cyan-400', body: 'Create vivid, personal stories for difficult words.<br><br><strong>Examples:</strong><br>• "Sa7tayn" (صحتين) — picture two healthy hands clapping after a delicious meal.<br>• "Yalla" (يلا) — friends shouting "Yalla!" and running to the beach.<br>• "B3eed" (بعيد) — "B-3eed" → think of a friend 3 streets away.' },
            { title: 'Transliteration First', subtitle: 'Pronunciation First', icon: 'fa-globe', iconBg: 'bg-gradient-to-br from-pink-400 to-rose-400', body: 'Master the Latin script version of each word first.<br><br>It builds pronunciation confidence fast, and Lebanese transliteration is designed to be intuitive for English speakers. Move to the Arabic script once the sound feels automatic.' },
            { title: 'Input Flood', subtitle: 'Passive Immersion', icon: 'fa-tower-broadcast', iconBg: 'bg-gradient-to-br from-cyan-400 to-sky-400', body: 'Surround yourself with Lebanese Arabic even when you\'re not studying.<br><br>• Set your phone to Arabic<br>• Listen to Lebanese music (Wadih, Fairuz) at low volume<br>• Watch a show in the background<br><br>After a few weeks, words start popping out of the noise — that\'s your ear training.' },
            { title: 'The Feynman Method', subtitle: 'Learn By Explaining', icon: 'fa-user-graduate', iconBg: 'bg-gradient-to-br from-violet-400 to-purple-400', body: 'After learning a new word, explain it out loud in simple English.<br><br>"Baddi" means "I want" — it\'s the word a Lebanese person uses more than "I need" or "I\'d like".<br><br>If you can\'t explain it simply, you don\'t know it yet. Re-learn, then try again.' },
            { title: 'Sleep-Based Review', subtitle: 'Memory Consolidation', icon: 'fa-moon', iconBg: 'bg-gradient-to-br from-blue-400 to-indigo-400', body: 'Review 5–10 words right before you sleep.<br><br>What you learn in the last hour before bed gets consolidated during deep sleep — retention jumps dramatically compared to reviewing mid-afternoon.<br><br>Pair it with the Anki session: review in the morning, drill before sleep.' },
            { title: 'Chunking & Phrases', subtitle: 'Learn Whole Pieces', icon: 'fa-cubes', iconBg: 'bg-gradient-to-br from-amber-400 to-orange-400', body: 'Learn phrases as single chunks, not isolated words.<br><br>"El 7esab law sama7it" (the bill, please) is one unit. "Bshufak bukra" is one unit.<br><br>Chunks flow out of your mouth as one sound — that\'s what makes you sound fluent instead of translated.' }
        ]

        function buildTipsGrid() {
            const grid = document.getElementById('tips-grid')
            if (!grid) return
            grid.innerHTML = tips.map((t, i) =>
                '<div onclick="showTipModal(' + i + ')" class="tip-card dark-glass cursor-pointer p-5 rounded-3xl border border-slate-700 hover:border-indigo-700/50">' +
                '<div class="flex gap-x-3">' +
                '<div class="w-8 h-8 flex-shrink-0 ' + t.iconBg + ' flex items-center justify-center rounded-2xl"><i class="fa-solid ' + t.icon + ' text-white"></i></div>' +
                '<div class="flex-1"><div class="font-bold">' + t.title + '</div>' +
                '<div class="mt-1 text-xs text-slate-400">' + t.body.replace(/<br>/g, ' ').split('•')[0].split('<strong>')[0].replace(/<[^>]+>/g, '').slice(0, 95) + '…</div>' +
                '</div></div></div>'
            ).join('')
        }

        function showTipModal(index) {
            const modal = document.getElementById('tip-modal')
            const tip = tips[index]

            document.getElementById('tip-modal-icon').className = 'w-10 h-10 flex items-center justify-center rounded-3xl mb-4 ' + tip.iconBg
            document.getElementById('tip-modal-icon').innerHTML = '<i class="fa-solid ' + tip.icon + ' text-white text-2xl"></i>'
            document.getElementById('tip-modal-title').innerHTML = tip.title
            document.getElementById('tip-modal-subtitle').innerHTML = tip.subtitle
            document.getElementById('tip-modal-body').innerHTML = tip.body

            modal.style.display = 'flex'
        }

        function closeTipModal() {
            document.getElementById('tip-modal').style.display = 'none'
        }

        function showAllTips() {
            const modal = document.getElementById('tip-modal')
            modal.style.display = 'flex'
            document.getElementById('tip-modal-icon').className = 'w-10 h-10 flex items-center justify-center rounded-3xl mb-4 bg-gradient-to-br from-indigo-400 to-violet-400'
            document.getElementById('tip-modal-icon').innerHTML = '<i class="fa-solid fa-lightbulb text-white text-2xl"></i>'
            document.getElementById('tip-modal-title').innerHTML = 'Learning Techniques'
            document.getElementById('tip-modal-subtitle').innerHTML = 'Combine these for best results'
            document.getElementById('tip-modal-body').innerHTML =
                '<div class="space-y-4 text-sm">' +
                '<div><strong>1. Spaced Repetition:</strong> Daily Anki with honest ratings.</div>' +
                '<div><strong>2. Shadowing:</strong> Repeat native audio instantly.</div>' +
                '<div><strong>3. Contextual Mnemonics:</strong> Attach vivid images to transliterations.</div>' +
                '<div><strong>4. Transliteration First:</strong> Master Latin script before the Arabic script.</div>' +
                '<div><strong>5. Input Flood:</strong> Immerse — music, phone language, background shows.</div>' +
                '<div><strong>6. Feynman:</strong> Explain each new word in simple English.</div>' +
                '<div><strong>7. Sleep-Based Review:</strong> Drill 5–10 words right before bed.</div>' +
                '<div><strong>8. Chunking:</strong> Learn whole phrases as single units.</div>' +
                '</div>'
        }

        // =====================================================================
        // ACTIVE RECALL QUIZ (both directions)
        // =====================================================================
        let quizCards = [], quizIndex = 0, quizScore = 0

        function startQuiz() {
            quizCards = shuffle(learnCards).slice(0, 7)
            quizIndex = 0
            quizScore = 0
            showQuizQuestion()
        }

        function showQuizQuestion() {
            const old = document.getElementById('quiz-modal')
            if (old) old.remove()
            const modal = mkModal('quiz-modal')

            const card = quizCards[quizIndex]
            const reverse = Math.random() < 0.5 // true: show translit, pick English
            let options = [card]
            const key = reverse ? 'english' : 'translit'
            const others = shuffle(learnCards.filter(c => c.id !== card.id && c[key] !== card[key]))
            while (options.length < 4 && others.length) {
                const r = others.pop()
                if (!options.some(o => o[key] === r[key])) options.push(r)
            }
            options = shuffle(options)

            const prompt = reverse ? 'What does this transliteration mean?' : 'What is the Lebanese for:'
            const mainText = reverse ? card.translit : card.english

            let html = '<div class="dark-glass border border-slate-700 rounded-3xl overflow-hidden">' +
                '<div class="px-5 pt-4 pb-3 flex justify-between bg-slate-900 items-center">' +
                '<div><span class="font-extrabold text-sm">ACTIVE RECALL QUIZ</span></div>' +
                '<div class="px-4 py-1 text-xs rounded-3xl bg-slate-800 text-center font-bold">' + (quizIndex + 1) + ' / ' + quizCards.length + '</div>' +
                '</div><div class="px-6 pt-6 pb-5">' +
                '<div class="mb-3"><span class="font-medium px-1 text-xs">' + prompt + '</span></div>' +
                '<div class="px-1 mb-6 text-center"><span class="text-3xl font-extrabold tracking-tight">' + esc(mainText) + '</span></div>' +
                '<div class="grid grid-cols-1 gap-2">'
            options.forEach(o => {
                const label = reverse ? o.english : o.translit
                const correct = o.id === card.id ? ' data-correct="true"' : ''
                html += '<div class="quiz-opt cursor-pointer px-5 py-[13px] bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors rounded-2xl flex items-center justify-between text-sm font-bold"' + correct +
                    ' onclick="checkQuizAnswer(' + (o.id === card.id) + ', this)"><span>' + esc(label) + '</span></div>'
            })
            html += '</div></div>' +
                '<div class="px-6 py-4 flex justify-between bg-slate-900 border-t border-slate-700 items-center text-xs">' +
                '<div><span class="font-semibold">Score: <span id="quiz-score">' + quizScore + '</span>/' + quizCards.length + '</span></div>' +
                '<button onclick="this.closest(\'.fixed\').remove()" class="px-4 font-bold py-1 text-xs bg-slate-700 px-3 rounded-3xl">Exit</button>' +
                '</div></div>'
            modal.firstElementChild.innerHTML = html
        }

        function checkQuizAnswer(isCorrect, element) {
            const modal = document.getElementById('quiz-modal')
            if (!modal) return
            const allOptions = modal.querySelectorAll('.quiz-opt')
            allOptions.forEach(el => el.style.pointerEvents = 'none')

            const paint = (el, ok) => {
                el.style.background = ok ? 'rgb(16 185 129 / 0.2)' : 'rgb(239 68 68 / 0.2)'
                el.style.border = '1px solid ' + (ok ? 'rgb(52 211 153)' : 'rgb(248 113 113)')
            }

            if (isCorrect) {
                paint(element, true)
                quizScore++
                const s = document.getElementById('quiz-score')
                if (s) s.innerHTML = quizScore
            } else {
                paint(element, false)
                const correct = modal.querySelector('.quiz-opt[data-correct="true"]')
                if (correct) paint(correct, true)
            }

            setTimeout(() => {
                modal.remove()
                quizIndex++
                if (quizIndex < quizCards.length) showQuizQuestion()
                else showQuizResults()
            }, 1300)
        }

        function showQuizResults() {
            const pct = Math.round((quizScore / quizCards.length) * 100)
            const message = pct > 85 ? 'Excellent! Your recall is strong.' : (pct > 65 ? 'Good work! Keep practicing.' : 'Nice effort. More reviews will help.')
            showResultModal('Quiz complete!', quizScore, quizCards.length, message, startQuiz)
        }

        // =====================================================================
        // AUDIO (browser speech synthesis + fallback)
        // =====================================================================
        function playAudio() {
            const arabicEl = document.getElementById('card-arabic')
            const translitEl = document.getElementById('card-translit')
            if (!arabicEl || !translitEl) return
            playAudioText(arabicEl.innerText.trim(), translitEl.innerText.trim())
        }

        function playAudioForCard(card) {
            playAudioText(card.arabic, card.translit)
        }

        window.__playCard = function (id) {
            const c = cards.find(x => x.id === id)
            if (c) playAudioForCard(c)
        }

        function playAudioText(arabic, translit) {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel()
                const utterance = new SpeechSynthesisUtterance(arabic)
                const voices = window.speechSynthesis.getVoices()
                let arabicVoice = voices.find(v => (v.lang || '').toLowerCase().startsWith('ar'))
                if (!arabicVoice) arabicVoice = voices[0]
                if (arabicVoice) utterance.voice = arabicVoice
                utterance.lang = 'ar-LB'
                utterance.rate = 0.93
                utterance.pitch = 1.03
                window.speechSynthesis.speak(utterance)
            } else {
                const fallback = document.createElement('div')
                fallback.style.cssText = 'position:fixed;bottom:15px;left:50%;transform:translate(-50%,0);z-index:99999'
                fallback.innerHTML = '<div class="px-4 py-2 rounded-[2.5rem] dark-glass border border-slate-700 text-sm px-5"><span class="font-bold">Pronounce: </span> <span class="font-extrabold">' + esc(translit) + '</span></div>'
                document.body.appendChild(fallback)
                setTimeout(() => fallback.remove(), 2600)
            }
        }
        // =====================================================================
        // SENTENCE DATA (fill-in-the-blank + sentence builder)
        // =====================================================================
        const sentences = [
            { s: 'Baddi ahwe sa7a, law sama7it.', blank: 'ahwe', en: 'I want coffee now, please.' },
            { s: 'El 7esab law sama7it.', blank: '7esab', en: 'The bill, please.' },
            { s: 'Wayn el 7emmem, law sama7it?', blank: '7emmem', en: 'Where is the toilet, please?' },
            { s: 'Kifak? Ana mni7.', blank: 'mni7', en: 'How are you? I\'m fine.' },
            { s: 'Tosba7 3a khayr ya habibi.', blank: 'khayr', en: 'Sleep well, my love.' },
            { s: 'Baddi falafel bi tahini.', blank: 'falafel', en: 'I want falafel with tahini.' },
            { s: 'Ana men Kanada, w enta?', blank: 'Kanada', en: 'I\'m from Canada, and you?' },
            { s: 'Mar7aba! Shu el akhbar?', blank: 'akhbar', en: 'Hello! What\'s new?' },
            { s: 'Chokran kteer ya 3omri.', blank: 'Chokran', en: 'Thank you so much, my life.' },
            { s: 'Yalla nrou7, el 7ina!', blank: 'Yalla', en: 'Let\'s go, we\'re late!' },
            { s: 'El akel tayyib kteer.', blank: 'tayyib', en: 'The food is very good.' },
            { s: 'Ana ju3aan, baddi akol.', blank: 'ju3aan', en: 'I\'m hungry, I want to eat.' },
            { s: 'Inshallah, nshufak bukra.', blank: 'bakra', en: 'God willing, see you tomorrow.' },
            { s: 'Shta2tilak kteer ya 3omri.', blank: 'Shta2tilak', en: 'I miss you a lot.' },
            { s: 'Bshufak ba3deen, yalla.', blank: 'ba3deen', en: 'See you later, come on.' },
            { s: 'Ghali kteer, ma beddi.', blank: 'ghali', en: 'Too expensive, I don\'t want it.' },
            { s: 'Tekram, ma fee mushkila.', blank: 'mushkila', en: 'You\'re welcome, no problem.' },
            { s: 'Ana men Lubnan, w inta?', blank: 'Lubnan', en: 'I\'m from Lebanon, and you?' },
            { s: 'El 7ell yekhalek ya 3omri.', blank: '3omri', en: 'May God keep you, my life.' },
            { s: 'Mabrouk! El 3ers kteer helou.', blank: 'Mabrouk', en: 'Congratulations! Lovely sweets.' },
            { s: 'Baddi mayy, min fadlak.', blank: 'mayy', en: 'I want water, please.' },
            { s: 'Saba7 el khayr! Shu akhbarak?', blank: 'Saba7', en: 'Good morning! How are you?' },
            { s: 'Ahla w sahla! Tfaddal.', blank: 'Tfaddal', en: 'Welcome! Go ahead.' },
            { s: 'Ma befham, 3awid men fadlak?', blank: 'befham', en: 'I don\'t understand, again please?' },
            { s: 'B7ebbak kteer ya 3omri.', blank: 'B7ebbak', en: 'I love you so much.' },
            { s: '3an eznak, wayn el 7emmem?', blank: '3an', en: 'Excuse me, where is the toilet?' },
            { s: 'Sa7tayn! El akel tayyib.', blank: 'Sa7tayn', en: 'Enjoy your meal! The food is good.' },
            { s: 'El 7emmem fin?', blank: '7emmem', en: 'Where is the toilet?' },
            { s: 'Adday se3ro? Kteer ghali!', blank: 'Adday', en: 'How much is it? Very expensive!' },
            { s: 'Baddi ahwe sa7a.', blank: 'sa7a', en: 'I want coffee now.' }
        ]

        // =====================================================================
        // DIALOGUE SCENARIOS (branching)
        // =====================================================================
        const scenarios = [
            {
                id: 'cafe', title: 'Café in Beirut', icon: 'fa-mug-hot', desc: 'Ordering coffee with a waiter', start: 0,
                nodes: [
                    { who: 'Ahmad (waiter)', text: 'Mar7aba! Ahla w sahla. Shu baddak?', options: [
                        { t: 'Mar7aba, kifak?', next: 1 },
                        { t: 'Ahla w sahla!', next: 1 }
                    ] },
                    { who: 'Ahmad', text: 'Mni7, elhamdulillah. Shu baddak teshrob? Ahwe wala shai?', options: [
                        { t: 'Ahwe, min fadlak.', next: 2 },
                        { t: 'Shai b lebon.', next: 2 }
                    ] },
                    { who: 'Ahmad', text: 'Tayyib, sa7a. El ahwe el lebnani, bi7balek.', options: [
                        { t: 'Sa7tayn, chokran.', next: 3 }
                    ] },
                    { who: 'Ahmad', text: 'Bi7balek. El 7esab bi 32,000. Kesh wala batte9a?', options: [
                        { t: 'B batte9a, min fadlak.', next: 4 },
                        { t: 'Kash, law sama7it.', next: 4 }
                    ] },
                    { who: 'Ahmad', text: 'Afwan, tekram. Be7a el yaom! Bshufak.', options: [
                        { t: 'Tosba7 3a khayr, bshufak.', next: -1 }
                    ] }
                ]
            },
            {
                id: 'souq', title: 'Bargaining at the Souq', icon: 'fa-shopping-basket', desc: 'Haggling for fresh olives', start: 0,
                nodes: [
                    { who: 'Souda (shop owner)', text: 'Ahlan! Shu baddak? El zeytoun helou el-yom.', options: [
                        { t: 'Baddi kilo zeytoun, min fadlak.', next: 1 },
                        { t: 'Adday kilo el zeytoun?', next: 2 }
                    ] },
                    { who: 'Souda', text: 'Kilo el zeytoun bi 15,000. El 3am el-maadi, 7al el a3mal.', options: [
                        { t: 'Kteer ghali... 12,000?', next: 3 },
                        { t: 'Tayyib, abeh.', next: 4 }
                    ] },
                    { who: 'Souda', text: '15,000. Zeytoun 7al eh? Ma feen weh.', options: [
                        { t: 'Baddi kilo zeytoun, min fadlak.', next: 1 },
                        { t: '12,000 w nsewwi.', next: 3 }
                    ] },
                    { who: 'Souda', text: '12,000? 13,000 w ab2elek lebon? Tawfe9, wala?', options: [
                        { t: '13,000, tamam.', next: 5 }
                    ] },
                    { who: 'Souda', text: 'Tayyib, kilo bi 15,000. Kesh wala batte9a?', options: [
                        { t: 'Kash, chokran.', next: 6 }
                    ] },
                    { who: 'Souda', text: 'Tayyib, kilo bi 13,000 w lebon. Kesh wala batte9a?', options: [
                        { t: 'Kash, chokran Souda.', next: 6 }
                    ] },
                    { who: 'Souda', text: 'Afwan! Be7a el yaom. El mod helle, ta3al bukra.', options: [
                        { t: 'Chokran, bshufak. Tosba7 3a khayr.', next: -1 }
                    ] }
                ]
            },
            {
                id: 'taxi', title: 'Hailing a Taxi', icon: 'fa-taxi', desc: 'Getting to the airport', start: 0,
                nodes: [
                    { who: 'Driver', text: 'Ahlan! Fin baddak?', options: [
                        { t: 'Men hon il el matar, min fadlak.', next: 1 },
                        { t: 'Kif nrou7 3a el matar?', next: 1 }
                    ] },
                    { who: 'Driver', text: 'Il matar 30 il 45 dakika. El se3ra bi meter, wala 30,000 Lira w nsewwi?', options: [
                        { t: 'Bi meter, law sama7it.', next: 2 },
                        { t: '30,000, tamam.', next: 2 }
                    ] },
                    { who: 'Driver', text: 'Tayyib. El-bab, tfaddal. Etnabeh — el zohma ktifa houn.', options: [
                        { t: 'Chokran, mni7.', next: 3 }
                    ] },
                    { who: 'Driver', text: 'Wah eh, ell 7allina? Ahlan, es-sa3a. El 7esab bi 32,000.', options: [
                        { t: 'Fadalek el 7esab. Chokran 3al sou9.', next: 4 }
                    ] },
                    { who: 'Driver', text: 'Afwan, tekram. Sa7a! Bshufak.', options: [
                        { t: 'Bshufak, be7a el yaom.', next: -1 }
                    ] }
                ]
            },
            {
                id: 'rest', title: 'At a Restaurant', icon: 'fa-restaurant', desc: 'Ordering kibbeh & the bill', start: 0,
                nodes: [
                    { who: 'Waiter', text: 'Mar7aba! 3la 3omri. Mounassaf lebnayn?', options: [
                        { t: 'Lebnayn, min fadlak.', next: 1 },
                        { t: 'Eh, lebnayn, chokran.', next: 1 }
                    ] },
                    { who: 'Waiter', text: 'Tfaddal el quddame. Baddak hummus w tabboula, wala kibbeh?', options: [
                        { t: 'Hummus w tabboula, min fadlak.', next: 2 },
                        { t: 'Kibbeh bil-furn.', next: 2 }
                    ] },
                    { who: 'Waiter', text: 'W men el mada? El shish tawouk 7al el a3ma el-yom.', options: [
                        { t: 'Shish tawouk b aruzz.', next: 3 },
                        { t: 'Kibbeh nadiya, chokran.', next: 3 }
                    ] },
                    { who: 'Waiter', text: 'Tayyib. El akel jay bi7balek! Sa7tayn.', options: [
                        { t: 'Sa7tayn! Tayyib kteer.', next: 4 },
                        { t: 'Tayyib, chokran.', next: 4 }
                    ] },
                    { who: 'Waiter', text: 'El 7esab, wala baddak 3ers? El 7esab bi 240,000.', options: [
                        { t: 'El 7esab, kash, min fadlak.', next: 5 },
                        { t: '3ers el baklawa, w ba3de el 7esab.', next: 5 }
                    ] },
                    { who: 'Waiter', text: 'Afwan, tekram! Be7a el yaom.', options: [
                        { t: 'Chokran 3al mada. Bshufak.', next: -1 }
                    ] }
                ]
            }
        ]

        // =====================================================================
        // LISTENING + SHADOWING
        // =====================================================================
        function startListeningPractice() {
            const old = document.getElementById('listen-modal')
            if (old) old.remove()
            const modal = mkModal('listen-modal')
            const picks = shuffle(learnCards).slice(0, 9)

            let listHTML = picks.map(card =>
                '<div id="lp-row-' + card.id + '" onclick="playListeningPhrase(' + card.id + ')" class="flex px-4 py-[9px] cursor-pointer items-center gap-x-3 bg-slate-800 hover:bg-slate-700 transition-colors rounded-3xl">' +
                '<div class="flex-1"><div class="font-bold">' + esc(card.english) + '</div><div class="text-xs text-indigo-300">' + esc(card.translit) + '</div></div>' +
                '<button class="px-4 flex items-center text-xs py-[5px] font-extrabold text-white rounded-[2rem] px-5 bg-gradient-to-r from-sky-400 to-teal-300 text-sky-900"><i class="fa-solid fa-play mr-1.5"></i> PLAY</button>' +
                '</div>'
            ).join('')

            modal.firstElementChild.innerHTML =
                '<div class="dark-glass border border-slate-700 rounded-3xl p-1"><div class="bg-slate-900 rounded-[2.25rem] px-6 pt-6 pb-5">' +
                '<div class="flex items-center justify-between">' +
                '<div><div class="font-extrabold text-xl">Listening + Shadowing</div><div class="text-xs text-emerald-300 font-bold">Native-style audio via your browser</div></div>' +
                '<div onclick="this.closest(\'.fixed\').remove()" class="px-4 cursor-pointer py-1 text-xs font-bold">CLOSE</div>' +
                '</div><div class="mt-6"><div class="mb-4 text-xs font-semibold">Choose a phrase to practice:</div>' +
                '<div class="space-y-2 max-h-[300px] overflow-auto">' + listHTML + '</div></div>' +
                '<div class="text-center px-4 pt-3 text-xs"><div class="flex items-center justify-center gap-x-1"><i class="fa-solid fa-info-circle"></i> <span class="font-medium">Repeat out loud after each playback — shadow the rhythm.</span></div></div>' +
                '</div></div>'
        }

        function playListeningPhrase(cardId) {
            const card = cards.find(c => c.id === cardId)
            if (!card) return
            playAudioText(card.arabic, card.translit)
            const row = document.getElementById('lp-row-' + cardId)
            if (!row) return
            row.style.transitionDuration = '100ms'
            row.style.opacity = '0.6'
            setTimeout(() => {
                row.style.opacity = '1'
                let prompt = row.querySelector('.shadow-prompt')
                if (!prompt) {
                    prompt = document.createElement('div')
                    prompt.className = 'shadow-prompt'
                    prompt.style.cssText = 'font-size:.75rem;margin-top:3px;'
                    prompt.innerHTML = '<span class="px-3 py-px bg-sky-900 text-sky-300 px-4 rounded-[3rem] font-extrabold text-xs">Now shadow: repeat out loud!</span>'
                    row.appendChild(prompt)
                }
                setTimeout(() => { if (prompt.parentNode) prompt.remove() }, 2800)
            }, 2100)
        }

        // =====================================================================
        // DIALOGUE SIMULATOR (scenario engine)
        // =====================================================================
        function startConversation(scId) {
            const old = document.getElementById('convo-modal')
            if (old) old.remove()
            const modal = mkModal('convo-modal')

            if (!scId) {
                const grid = scenarios.map(s =>
                    '<div onclick="startConversation(\'' + s.id + '\')" class="cursor-pointer px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl">' +
                    '<div class="flex items-center gap-x-3">' +
                    '<div class="w-9 h-9 flex-shrink-0 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center"><i class="fa-solid ' + s.icon + ' text-white"></i></div>' +
                    '<div><div class="font-bold text-sm">' + esc(s.title) + '</div><div class="text-xs text-slate-400">' + esc(s.desc) + '</div></div>' +
                    '</div></div>'
                ).join('')
                modal.firstElementChild.innerHTML =
                    '<div class="dark-glass border border-slate-700 rounded-3xl overflow-hidden">' +
                    '<div class="px-6 py-4 bg-slate-900 flex justify-between items-center">' +
                    '<div><span class="font-extrabold">Pick a scenario</span></div>' +
                    '<div onclick="this.closest(\'.fixed\').remove()" class="px-3 text-xs font-extrabold cursor-pointer">CLOSE</div>' +
                    '</div><div class="p-5 space-y-2">' + grid + '</div></div>'
                return
            }
            runScenario(scId)
        }

        function runScenario(scId) {
            const sc = scenarios.find(s => s.id === scId)
            const modal = document.getElementById('convo-modal')
            if (!sc || !modal) return

            let node = sc.start
            modal.firstElementChild.innerHTML =
                '<div class="dark-glass border border-slate-700 rounded-3xl overflow-hidden">' +
                '<div class="px-6 py-4 bg-slate-900 flex justify-between items-center">' +
                '<div><span class="font-extrabold">Dialogue: ' + esc(sc.title) + '</span></div>' +
                '<div class="flex items-center gap-x-2">' +
                '<button onclick="startConversation()" class="text-xs font-bold px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-3xl">CHANGE</button>' +
                '<div onclick="this.closest(\'.fixed\').remove()" class="px-3 text-xs font-extrabold cursor-pointer">END</div>' +
                '</div></div>' +
                '<div class="px-6 py-5 text-sm" style="min-height:220px;max-height:300px;overflow:auto;"><div id="conversation-log" class="space-y-[14px]"></div></div>' +
                '<div class="px-6 py-4 bg-slate-900 border-t border-slate-700"><div class="text-xs font-semibold px-1 mb-1 text-emerald-300">Your reply:</div>' +
                '<div id="convo-opts" class="flex flex-wrap gap-x-2"></div></div></div>'

            const log = modal.querySelector('#conversation-log')
            const optsBox = modal.querySelector('#convo-opts')

            function appendLine(cls, name, text) {
                const d = document.createElement('div')
                d.className = cls
                d.innerHTML = '<div class="px-3 py-2 rounded-[2.25rem] text-xs ' + (cls.includes('justify-end') ? 'bg-emerald-900/30' : 'bg-slate-700') + ' max-w-[260px]">' +
                    '<div class="font-medium ' + (cls.includes('justify-end') ? 'text-emerald-300' : '') + '">' + name + ':</div><div class="mt-0.5">' + esc(text) + '</div></div>'
                log.appendChild(d)
                log.scrollTop = log.scrollHeight
            }

            function step() {
                const n = sc.nodes[node]
                appendLine('flex', n.who, n.text)
                optsBox.innerHTML = n.options.map((o, i) =>
                    '<div onclick="window.__convoGo(' + i + ')" class="flex-1 min-w-[140px] cursor-pointer px-3 py-[7px] rounded-[2.25rem] bg-emerald-900/20 border border-emerald-800 text-xs font-medium hover:bg-emerald-900/40 transition-colors text-center">' + esc(o.t) + '</div>'
                ).join('')
            }

            window.__convoGo = function (i) {
                const n = sc.nodes[node]
                const o = n.options[i]
                if (!o) return
                appendLine('flex justify-end', 'You', o.t)
                optsBox.innerHTML = ''
                if (o.next < 0) { setTimeout(finishConvo, 700); return }
                node = o.next
                setTimeout(step, 1000)
            }

            step()
        }

        function finishConvo() {
            const modal = document.getElementById('convo-modal')
            if (!modal) return
            const log = modal.querySelector('#conversation-log')
            const f = document.createElement('div')
            f.innerHTML = '<div class="px-4 py-2 bg-gradient-to-r from-emerald-900/40 to-teal-900/20 rounded-[2.25rem] text-xs text-center"><span class="font-extrabold">Conversation complete! +15 XP</span><br><span class="text-slate-300">You sounded natural — try another scenario!</span></div>'
            log.appendChild(f)
            setTimeout(() => {
                modal.remove()
                toast('Great job! Real dialogues build fluency.')
            }, 2300)
        }

        // =====================================================================
        // FILL IN THE BLANK
        // =====================================================================
        function startFillBlank() {
            const picks = shuffle(sentences).slice(0, 8)
            let i = 0, score = 0
            const modal = mkModal('fb-modal')

            function render() {
                const s = picks[i]
                const idx = s.s.toLowerCase().indexOf(s.blank.toLowerCase())
                const before = s.s.slice(0, idx)
                const after = s.s.slice(idx + s.blank.length)

                modal.firstElementChild.innerHTML =
                    '<div class="dark-glass border border-slate-700 rounded-3xl overflow-hidden">' +
                    '<div class="px-5 pt-4 pb-3 flex justify-between bg-slate-900 items-center">' +
                    '<span class="font-extrabold text-sm">FILL IN THE BLANK</span>' +
                    '<span class="px-4 py-1 text-xs rounded-3xl bg-slate-800 font-bold">' + (i + 1) + ' / ' + picks.length + '</span></div>' +
                    '<div class="px-6 pt-5 pb-4">' +
                    '<div class="text-xs text-slate-300 mb-2">Complete the sentence (type the missing word):</div>' +
                    '<div class="text-xl font-bold leading-relaxed">' + esc(before) + ' <span class="text-indigo-300 font-extrabold border-b-2 border-dashed border-indigo-400 px-2">________</span> ' + esc(after) + '</div>' +
                    '<div class="text-xs text-slate-400 mt-2 mb-3">' + esc(s.en) + '</div>' +
                    '<input id="fb-input" autocomplete="off" type="text" placeholder="Type the missing word..." class="w-full bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-2xl text-sm focus:outline-none focus:border-indigo-500">' +
                    '<div class="flex gap-2 mt-3">' +
                    '<button onclick="window.__fbCheck()" class="flex-1 py-2.5 bg-emerald-300 text-emerald-900 rounded-3xl font-extrabold text-sm">CHECK</button>' +
                    '<button onclick="window.__fbSkip()" class="px-5 py-2.5 bg-slate-700 rounded-3xl font-bold text-sm">SKIP</button>' +
                    '<button onclick="this.closest(\'.fixed\').remove()" class="px-5 py-2.5 bg-slate-800 rounded-3xl font-bold text-sm">Exit</button></div>' +
                    '<div id="fb-feedback" class="text-xs mt-2 font-semibold h-4"></div>' +
                    '</div></div>'

                setTimeout(() => document.getElementById('fb-input') && document.getElementById('fb-input').focus(), 80)
                document.getElementById('fb-input').addEventListener('keydown', e => { if (e.key === 'Enter') window.__fbCheck() })
            }

            function next() {
                i++
                if (i < picks.length) render()
                else showResultModal('Fill-in-the-blank done!', score, picks.length, 'Context is the best teacher — run this after each Anki session.', startFillBlank)
            }

            window.__fbCheck = function () {
                const inp = document.getElementById('fb-input')
                const fb = modal.querySelector('#fb-feedback')
                const s = picks[i]
                if (norm(inp.value) === norm(s.blank) ||
                    (window.TranslitMode && norm(inp.value) === norm(window.TranslitMode.convert(s.__blank || s.blank)))) {
                    score++
                    fb.innerHTML = '<span class="text-emerald-300">✓ Correct: ' + esc(s.blank) + '</span>'
                    inp.style.borderColor = '#34d399'
                    setTimeout(next, 900)
                } else {
                    fb.innerHTML = '<span class="text-red-300">✗ Not quite — try again or SKIP</span>'
                    inp.style.borderColor = '#f87171'
                    inp.select()
                }
            }

            window.__fbSkip = function () {
                const s = picks[i]
                modal.querySelector('#fb-feedback').innerHTML = '<span class="text-indigo-300">Answer: ' + esc(s.blank) + '</span>'
                setTimeout(next, 1400)
            }

            render()
        }

        // =====================================================================
        // SENTENCE BUILDER
        // =====================================================================
        function startSentenceBuilder() {
            const picks = shuffle(sentences).slice(0, 6)
            let i = 0, done = 0
            const modal = mkModal('sb-modal')
            const st = { expected: [], built: [], tries: 0, full: '', en: '' }

            function render() {
                const s = picks[i]
                st.expected = s.s.split(' ')
                st.built = []
                st.tries = 0
                st.full = s.s
                st.en = s.en

                modal.firstElementChild.innerHTML =
                    '<div class="dark-glass border border-slate-700 rounded-3xl overflow-hidden">' +
                    '<div class="px-5 pt-4 pb-3 flex justify-between bg-slate-900 items-center">' +
                    '<span class="font-extrabold text-sm">SENTENCE BUILDER</span>' +
                    '<span class="px-4 py-1 text-xs rounded-3xl bg-slate-800 font-bold">' + (i + 1) + ' / ' + picks.length + '</span></div>' +
                    '<div class="px-6 pt-5 pb-4">' +
                    '<div class="text-xs text-slate-300 mb-1">Tap the words in the right order to build:</div>' +
                    '<div class="text-lg font-extrabold mb-4">' + esc(s.en) + '</div>' +
                    '<div id="sb-built" class="flex flex-wrap gap-1.5 min-h-[46px] p-2 bg-slate-900 border border-slate-700 rounded-2xl mb-3"></div>' +
                    '<div id="sb-bank" class="flex flex-wrap gap-1.5"></div></div>' +
                    '<div class="px-5 py-4 flex justify-between bg-slate-900 border-t border-slate-700 text-xs">' +
                    '<span id="sb-tries" class="font-semibold">Mistakes: 0</span>' +
                    '<button onclick="this.closest(\'.fixed\').remove()" class="px-4 py-1 bg-slate-700 rounded-3xl font-bold">Exit</button></div></div>'

                const bank = modal.querySelector('#sb-bank')
                shuffle(s.s.split(' ')).forEach(w => {
                    const b = document.createElement('button')
                    b.textContent = w
                    b.className = 'px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl text-sm font-bold cursor-pointer'
                    b.onclick = () => pickWord(b, w)
                    bank.appendChild(b)
                })
            }

            function pickWord(b, w) {
                if (st.built.length >= st.expected.length) return
                const built = modal.querySelector('#sb-built')
                if (st.built[st.built.length] === w) {
                    st.built.push(w)
                    b.remove()
                    const chip = document.createElement('button')
                    chip.textContent = w
                    chip.className = 'px-3 py-1 bg-indigo-900/50 border border-indigo-700 rounded-2xl text-sm font-bold text-indigo-200 cursor-pointer'
                    chip.onclick = () => {
                        st.built.pop()
                        chip.remove()
                        const btn = document.createElement('button')
                        btn.textContent = w
                        btn.className = 'px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl text-sm font-bold cursor-pointer'
                        btn.onclick = () => pickWord(btn, w)
                        modal.querySelector('#sb-bank').appendChild(btn)
                    }
                    built.appendChild(chip)
                    if (st.built.join(' ') === st.full) {
                        built.style.borderColor = '#34d399'
                        done++
                        setTimeout(() => {
                            i++
                            if (i < picks.length) render()
                            else showResultModal('Sentence builder complete!', done, picks.length, 'You built every sentence correctly — word order is locked in.', startSentenceBuilder)
                        }, 900)
                    }
                } else {
                    st.tries++
                    modal.querySelector('#sb-tries').textContent = 'Mistakes: ' + st.tries
                    built.style.animation = 'none'
                    void built.offsetWidth
                    built.style.animation = 'shake .35s'
                    b.style.borderColor = '#f87171'
                    setTimeout(() => b.style.borderColor = '', 500)
                }
            }

            render()
        }

        // =====================================================================
        // MATCH THE PAIRS (memory game)
        // =====================================================================
        function startMatchPairs() {
            const old = document.getElementById('match-modal')
            if (old) old.remove()
            const pairs = shuffle(learnCards).slice(0, 6)
            let tiles = []
            pairs.forEach(p => {
                tiles.push({ k: p.id, t: 'en', l: p.english })
                tiles.push({ k: p.id, t: 'ar', l: p.arabic })
            })
            tiles = shuffle(tiles)

            let sel = null, matched = 0, moves = 0
            const t0 = Date.now()
            const modal = mkModal('match-modal')
            const timer = setInterval(() => {
                const el = modal.querySelector('#match-time')
                if (el) el.textContent = fmtTime((Date.now() - t0) / 1000)
            }, 500)

            function fmtTime(s) { return Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0') }

            function onTile(d) {
                if (d.classList.contains('matched') || d.classList.contains('sel')) return
                d.classList.add('sel')
                d.style.borderColor = '#818cf8'
                d.style.background = '#312e8155'

                if (!sel) { sel = d; return }
                moves++
                const mv = modal.querySelector('#match-moves')
                if (mv) mv.textContent = moves + ' moves'

                if (sel.dataset.k === d.dataset.k && sel.dataset.t !== d.dataset.t) {
                    matched++
                    ;[sel, d].forEach(x => {
                        x.classList.remove('sel')
                        x.classList.add('matched')
                        x.style.borderColor = '#34d39988'
                        x.style.background = '#065f4633'
                        x.style.opacity = '.45'
                        x.style.pointerEvents = 'none'
                    })
                    sel = null
                    if (matched === tiles.length / 2) {
                        clearInterval(timer)
                        setTimeout(() => {
                            modal.firstElementChild.innerHTML =
                                '<div class="dark-glass border border-slate-700 rounded-3xl p-8 text-center">' +
                                '<div class="font-extrabold text-3xl">All matched! 🎉</div>' +
                                '<div class="text-sm text-slate-300 mt-2">' + moves + ' moves • ' + fmtTime((Date.now() - t0) / 1000) + '</div>' +
                                '<div class="mt-6 flex gap-2">' +
                                '<button onclick="this.closest(\'.fixed\').remove(); startMatchPairs()" class="flex-1 py-3 bg-emerald-300 text-emerald-900 rounded-3xl font-extrabold text-sm">PLAY AGAIN</button>' +
                                '<button onclick="this.closest(\'.fixed\').remove()" class="flex-1 py-3 bg-slate-700 rounded-3xl font-extrabold text-sm">DONE</button></div></div>'
                        }, 600)
                    }
                } else {
                    const a = sel
                    sel = null
                    setTimeout(() => {
                        ;[a, d].forEach(x => {
                            if (!x || !x.parentNode) return
                            x.classList.remove('sel')
                            x.style.borderColor = ''
                            x.style.background = ''
                        })
                    }, 650)
                }
            }

            modal.firstElementChild.innerHTML =
                '<div class="dark-glass border border-slate-700 rounded-3xl overflow-hidden">' +
                '<div class="px-5 pt-4 pb-3 flex justify-between bg-slate-900 items-center">' +
                '<span class="font-extrabold text-sm">MATCH THE PAIRS</span>' +
                '<div class="flex gap-2 text-xs font-bold"><span id="match-time" class="px-3 py-1 rounded-3xl bg-slate-800">0:00</span><span id="match-moves" class="px-3 py-1 rounded-3xl bg-slate-800">0 moves</span></div></div>' +
                '<div class="p-4"><div class="grid grid-cols-3 gap-2" id="match-grid"></div>' +
                '<div class="mt-3 text-center text-[11px] text-slate-400">Match each English word with its Lebanese Arabic</div></div></div>'

            const grid = modal.querySelector('#match-grid')
            tiles.forEach(tl => {
                const d = document.createElement('div')
                d.dataset.k = tl.k
                d.dataset.t = tl.t
                d.className = 'cursor-pointer select-none flex items-center justify-center text-center bg-slate-800 border border-slate-700 rounded-2xl h-[74px] px-2 transition-colors ' + (tl.t === 'ar' ? 'arabic-text text-xl' : 'font-bold text-sm')
                d.textContent = tl.l
                d.onclick = () => onTile(d)
                grid.appendChild(d)
            })
        }

        // =====================================================================
        // TYPE THE TRANSLITERATION (Arabic → type pronunciation)
        // =====================================================================
        function startTypeTranslit() {
            const old = document.getElementById('tt-modal')
            if (old) old.remove()
            const pool = learnCards.filter(c => !c.translit.includes(' ') && !c.translit.includes('/'))
            const picks = shuffle(pool).slice(0, 6)
            let i = 0, score = 0
            const modal = mkModal('tt-modal')

            function render() {
                const c = picks[i]
                modal.firstElementChild.innerHTML =
                    '<div class="dark-glass border border-slate-700 rounded-3xl overflow-hidden">' +
                    '<div class="px-5 pt-4 pb-3 flex justify-between bg-slate-900 items-center">' +
                    '<span class="font-extrabold text-sm">TYPE THE TRANSLITERATION</span>' +
                    '<span class="px-4 py-1 text-xs rounded-3xl bg-slate-800 font-bold">' + (i + 1) + ' / ' + picks.length + '</span></div>' +
                    '<div class="px-6 pt-5 pb-4">' +
                    '<div class="text-xs text-slate-300 mb-2">How do you pronounce this?</div>' +
                    '<div class="text-center"><div class="arabic-text text-5xl font-extrabold text-white">' + esc(c.arabic) + '</div>' +
                    '<div class="text-sm font-semibold mt-2 text-slate-300">' + esc(c.english) + '</div></div>' +
                    '<input id="tt-input" autocomplete="off" type="text" placeholder="e.g. Mar7aba" class="mt-4 w-full bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-2xl text-sm focus:outline-none focus:border-indigo-500">' +
                    '<div class="flex gap-2 mt-3">' +
                    '<button onclick="window.__ttCheck()" class="flex-1 py-2.5 bg-emerald-300 text-emerald-900 rounded-3xl font-extrabold text-sm">CHECK</button>' +
                    '<button onclick="window.__ttSkip()" class="px-5 py-2.5 bg-slate-700 rounded-3xl font-bold text-sm">SKIP</button>' +
                    '<button onclick="this.closest(\'.fixed\').remove()" class="px-5 py-2.5 bg-slate-800 rounded-3xl font-bold text-sm">Exit</button></div>' +
                    '<div id="tt-feedback" class="text-xs mt-2 font-semibold h-4"></div>' +
                    '</div></div>'

                setTimeout(() => { const el = document.getElementById('tt-input'); if (el) el.focus() }, 80)
                const el = document.getElementById('tt-input')
                if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') window.__ttCheck() })
            }

            function next() {
                i++
                if (i < picks.length) render()
                else showResultModal('Translit typing done!', score, picks.length, 'Arabic script → sound is the key to reading menus, signs and messages.', startTypeTranslit)
            }

            window.__ttCheck = function () {
                const inp = document.getElementById('tt-input')
                const c = picks[i]
                const fb = modal.querySelector('#tt-feedback')
                if (window.translitMatch
                        ? window.translitMatch(inp.value, c)
                        : norm(inp.value) === norm(c.translit)) {
                    score++
                    fb.innerHTML = '<span class="text-emerald-300">✓ Correct: ' + esc(c.translit) + '</span>'
                    inp.style.borderColor = '#34d399'
                    setTimeout(next, 900)
                } else {
                    fb.innerHTML = '<span class="text-red-300">✗ Not quite — try again or SKIP</span>'
                    inp.style.borderColor = '#f87171'
                    inp.select()
                }
            }

            window.__ttSkip = function () {
                const c = picks[i]
                modal.querySelector('#tt-feedback').innerHTML = '<span class="text-indigo-300">Answer: ' + esc(c.translit) + '</span>'
                setTimeout(next, 1400)
            }

            render()
        }

        // =====================================================================
        // LISTEN & PICK (audio multiple choice)
        // =====================================================================
        function startListenPick() {
            const old = document.getElementById('lp-modal')
            if (old) old.remove()
            const pool = learnCards.filter(c => !c.translit.includes('/'))
            const picks = shuffle(pool).slice(0, 6)
            let i = 0, score = 0
            const modal = mkModal('lp-modal')
            const noTTS = !('speechSynthesis' in window)

            function render() {
                const c = picks[i]
                const others = shuffle(pool.filter(x => x.id !== c.id && x.translit !== c.translit))
                const opts = shuffle([c].concat(others.slice(0, 3)))
                window.__lpOpts = opts

                modal.firstElementChild.innerHTML =
                    '<div class="dark-glass border border-slate-700 rounded-3xl overflow-hidden">' +
                    '<div class="px-5 pt-4 pb-3 flex justify-between bg-slate-900 items-center">' +
                    '<span class="font-extrabold text-sm">LISTEN &amp; PICK</span>' +
                    '<span class="px-4 py-1 text-xs rounded-3xl bg-slate-800 font-bold">' + (i + 1) + ' / ' + picks.length + '</span></div>' +
                    '<div class="px-6 pt-5 pb-4">' +
                    '<div class="flex items-center justify-center mb-3"><button onclick="window.__lpPlay()" class="w-14 h-14 rounded-full bg-gradient-to-br from-sky-400 to-teal-300 text-sky-900 text-2xl hover:scale-105 transition-transform"><i class="fa-solid fa-volume-up"></i></button></div>' +
                    '<div class="text-center text-xs text-slate-400 mb-3">' + (noTTS ? 'No audio in this browser — read the word, then pick.' : 'Tap to hear it (again if needed), then pick the transliteration.') + '</div>' +
                    (noTTS ? '<div class="text-center arabic-text text-3xl font-extrabold mb-3">' + esc(c.arabic) + '</div>' : '') +
                    '<div class="grid gap-2" id="lp-opts">' +
                    opts.map((o, j) => '<div class="lp-opt cursor-pointer px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-2xl text-sm font-bold" data-i="' + j + '">' + esc(o.translit) + '</div>').join('') +
                    '</div><div class="mt-3 flex justify-between text-xs">' +
                    '<span class="font-semibold">Score: <span id="lp-score">' + score + '</span></span>' +
                    '<button onclick="this.closest(\'.fixed\').remove()" class="px-4 py-1 bg-slate-700 rounded-3xl font-bold">Exit</button></div>' +
                    '</div></div>'

                modal.querySelectorAll('.lp-opt').forEach(el => {
                    el.onclick = () => pickLp(+el.dataset.i)
                })
                setTimeout(() => window.__lpPlay(), 400)
            }

            window.__lpPlay = function () {
                const c = picks[i]
                if (c) playAudioText(c.arabic, c.translit)
            }

            function pickLp(j) {
                const c = picks[i]
                const els = modal.querySelectorAll('.lp-opt')
                els.forEach(el => el.style.pointerEvents = 'none')
                const ok = window.__lpOpts[j].id === c.id
                if (ok) score++
                els.forEach(el => {
                    const k = +el.dataset.i
                    if (window.__lpOpts[k].id === c.id) {
                        el.style.background = 'rgb(16 185 129 / 0.2)'
                        el.style.borderColor = '#34d399'
                    } else if (!ok && k === j) {
                        el.style.background = 'rgb(239 68 68 / 0.2)'
                        el.style.borderColor = '#f87171'
                    }
                })
                const s = document.getElementById('lp-score')
                if (s) s.innerHTML = score
                setTimeout(() => {
                    i++
                    if (i < picks.length) render()
                    else showResultModal('Listen & pick done!', score, picks.length, 'Ear training is your superpower — run this daily.', startListenPick)
                }, 1100)
            }

            render()
        }

        // =====================================================================
        // SPEED ROUND (timed quiz)
        // =====================================================================
        function startSpeedRound() {
            const old = document.getElementById('speed-modal')
            if (old) old.remove()
            const picks = shuffle(learnCards).slice(0, 8)
            let i = 0, score = 0, timer = null
            const modal = mkModal('speed-modal')

            function render() {
                const c = picks[i]
                const others = shuffle(learnCards.filter(x => x.id !== c.id && x.translit !== c.translit))
                const opts = shuffle([c].concat(others.slice(0, 3)))
                window.__spOpts = opts

                modal.firstElementChild.innerHTML =
                    '<div class="dark-glass border border-slate-700 rounded-3xl overflow-hidden">' +
                    '<div class="px-5 pt-4 pb-3 flex justify-between bg-slate-900 items-center">' +
                    '<span class="font-extrabold text-sm">⚡ SPEED ROUND</span>' +
                    '<div class="flex gap-2 text-xs font-bold"><span class="px-3 py-1 rounded-3xl bg-slate-800">' + (i + 1) + ' / ' + picks.length + '</span><span class="px-3 py-1 rounded-3xl bg-slate-800">Score ' + score + '</span></div></div>' +
                    '<div class="px-6 pt-5 pb-4">' +
                    '<div class="mb-1 text-xs text-slate-300">Lebanese for:</div>' +
                    '<div class="text-2xl font-extrabold mb-3">' + esc(c.english) + '</div>' +
                    '<div class="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-3"><div id="speed-bar" class="h-full bg-gradient-to-r from-amber-400 to-red-400" style="width:100%"></div></div>' +
                    '<div class="grid gap-2">' +
                    opts.map((o, j) => '<div class="sp-opt cursor-pointer px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-2xl text-sm font-bold" data-i="' + j + '">' + esc(o.translit) + '</div>').join('') +
                    '</div></div></div>'

                const bar = modal.querySelector('#speed-bar')
                void bar.offsetWidth
                bar.style.transition = 'width 5s linear'
                bar.style.width = '0%'

                modal.querySelectorAll('.sp-opt').forEach(el => {
                    el.onclick = () => pickSp(+el.dataset.i)
                })

                clearTimeout(timer)
                timer = setTimeout(() => {
                    const idx = window.__spOpts.findIndex(o => o.id === c.id)
                    paintSp(idx, -1)
                    timer = setTimeout(nextSp, 900)
                }, 5000)
            }

            function paintSp(correctIdx, chosenIdx) {
                modal.querySelectorAll('.sp-opt').forEach(el => {
                    el.style.pointerEvents = 'none'
                    const k = +el.dataset.i
                    if (k === correctIdx) {
                        el.style.background = 'rgb(16 185 129 / 0.2)'
                        el.style.borderColor = '#34d399'
                    } else if (k === chosenIdx) {
                        el.style.background = 'rgb(239 68 68 / 0.2)'
                        el.style.borderColor = '#f87171'
                    }
                })
            }

            function pickSp(j) {
                const c = picks[i]
                clearTimeout(timer)
                const ok = window.__spOpts[j].id === c.id
                if (ok) score++
                const correctIdx = window.__spOpts.findIndex(o => o.id === c.id)
                paintSp(correctIdx, ok ? -1 : j)
                timer = setTimeout(nextSp, 800)
            }

            function nextSp() {
                i++
                if (i < picks.length) render()
                else showResultModal('Speed round over!', score, picks.length, 'Fast recognition = fluency. Chase that 8/8.', startSpeedRound)
            }

            render()
        }

        // =====================================================================
        // NEW WORDS LESSON (guided intro + mini quiz)
        // =====================================================================
        function startNewWords() {
            const old = document.getElementById('lesson-modal')
            if (old) old.remove()
            let pool = learnCards.filter(c => c.reviews === 0)
            if (pool.length < 4) pool = learnCards
            const words = shuffle(pool).slice(0, 8)
            let i = 0
            const modal = mkModal('lesson-modal')

            function render() {
                if (i < words.length) {
                    const w = words[i]
                    const m = CATEGORY_META[w.category] || { label: w.category }
                    modal.firstElementChild.innerHTML =
                        '<div class="dark-glass border border-slate-700 rounded-3xl overflow-hidden">' +
                        '<div class="px-5 pt-4 pb-3 flex justify-between bg-slate-900 items-center">' +
                        '<span class="font-extrabold text-sm">NEW WORDS • ' + (i + 1) + '/' + words.length + '</span>' +
                        '<span class="px-3 py-1 text-xs rounded-3xl bg-slate-800 font-bold">' + esc(m.label) + '</span></div>' +
                        '<div class="px-6 pt-6 pb-5 text-center">' +
                        '<div class="arabic-text text-5xl font-extrabold text-white">' + esc(w.arabic) + '</div>' +
                        '<div class="text-2xl font-extrabold text-indigo-300 mt-2">' + esc(w.translit) + '</div>' +
                        '<div class="text-lg font-semibold mt-1">' + esc(w.english) + '</div>' +
                        '<div class="mt-4 text-sm text-slate-300 bg-slate-900 border border-slate-700 rounded-2xl p-3"><span class="text-xs font-bold text-slate-500">EXAMPLE · </span>' + esc(w.example) + '</div>' +
                        '<div class="mt-5 flex items-center justify-center gap-2">' +
                        '<button onclick="window.__playCard(' + w.id + ')" class="px-5 py-2 bg-slate-800 hover:bg-slate-700 rounded-3xl text-sm font-bold"><i class="fa-solid fa-volume-up mr-2"></i>Listen</button>' +
                        '<button onclick="window.__lessonNext()" class="px-7 py-2 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 rounded-3xl text-sm font-extrabold">' + (i === words.length - 1 ? 'Start mini-quiz →' : 'Next →') + '</button>' +
                        '</div></div></div>'
                } else {
                    lessonQuiz()
                }
            }

            window.__lessonNext = function () { i++; render() }

            function lessonQuiz() {
                const q = shuffle(words).slice(0, 3)
                let qi = 0, qs = 0

                function showQ() {
                    if (qi >= q.length) {
                        showResultModal('Lesson complete!', qs, q.length, 'Now lock these in with an Anki session — they\'re already half-learned.', startNewWords)
                        return
                    }
                    const w = q[qi]
                    const others = shuffle(learnCards.filter(c => c.id !== w.id && c.english !== w.english))
                    const opts = shuffle([w].concat(others.slice(0, 3)))
                    window.__lqOpts = opts
                    modal.firstElementChild.innerHTML =
                        '<div class="dark-glass border border-slate-700 rounded-3xl overflow-hidden">' +
                        '<div class="px-5 pt-4 pb-3 flex justify-between bg-slate-900 items-center">' +
                        '<span class="font-extrabold text-sm">NEW WORDS • QUIZ ' + (qi + 1) + '/' + q.length + '</span>' +
                        '<span class="px-3 py-1 text-xs rounded-3xl bg-slate-800 font-bold">' + qs + ' correct</span></div>' +
                        '<div class="px-6 pt-5 pb-4">' +
                        '<div class="text-xs text-slate-300 mb-1">What does this word mean?</div>' +
                        '<div class="text-center mb-4"><div class="arabic-text text-3xl font-extrabold">' + esc(w.arabic) + '</div>' +
                        '<div class="text-lg font-extrabold text-indigo-300 mt-1">' + esc(w.translit) + '</div></div>' +
                        '<div class="grid gap-2">' +
                        opts.map((o, j) => '<div class="lq-opt cursor-pointer px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-2xl text-sm font-bold" data-i="' + j + '">' + esc(o.english) + '</div>').join('') +
                        '</div></div></div>'
                    modal.querySelectorAll('.lq-opt').forEach(el => {
                        el.onclick = () => {
                            const ok = window.__lqOpts[+el.dataset.i].id === w.id
                            if (ok) qs++
                            modal.querySelectorAll('.lq-opt').forEach(x => {
                                x.style.pointerEvents = 'none'
                                if (window.__lqOpts[+x.dataset.i].id === w.id) {
                                    x.style.background = 'rgb(16 185 129 / 0.2)'
                                    x.style.borderColor = '#34d399'
                                } else if (!ok && +x.dataset.i === +el.dataset.i) {
                                    x.style.background = 'rgb(239 68 68 / 0.2)'
                                    x.style.borderColor = '#f87171'
                                }
                            })
                            setTimeout(() => { qi++; showQ() }, 900)
                        }
                    })
                }
                showQ()
            }

            render()
        }

        // =====================================================================
        // TRANSLITERATION DRILL (original: translit → English meaning)
        // =====================================================================
        function startTranslitDrill() {
            const old = document.getElementById('drill-modal')
            if (old) old.remove()
            const drillCards = shuffle(learnCards).slice(0, 5)
            let current = 0
            let score = 0
            const modal = mkModal('drill-modal')

            function renderDrill() {
                const card = drillCards[current]
                modal.firstElementChild.innerHTML =
                    '<div class="dark-glass border border-slate-700 rounded-3xl p-6">' +
                    '<div class="flex justify-between items-center mb-4">' +
                    '<div class="font-extrabold">Transliteration Drill</div>' +
                    '<div class="text-xs font-bold">' + (current + 1) + ' / 5</div></div>' +
                    '<div class="mb-4"><div class="text-xs text-slate-300">What does this transliteration mean?</div>' +
                    '<div class="mt-3 text-center text-4xl font-extrabold tracking-tight">' + esc(card.translit) + '</div>' +
                    '<div class="mt-1 text-center text-sm text-indigo-300">' + esc(card.arabic) + '</div></div>' +
                    '<input id="translit-input" autocomplete="off" type="text" placeholder="Type the English meaning..." class="w-full bg-slate-800 border border-slate-700 px-4 py-[9px] rounded-2xl text-sm">' +
                    '<div class="flex gap-x-3 mt-4">' +
                    '<button onclick="window.__drillCheck()" class="flex-1 py-3 text-sm font-extrabold bg-emerald-300 text-emerald-900 rounded-3xl">CHECK</button>' +
                    '<button onclick="window.__drillSkip()" class="px-5 py-3 text-sm font-extrabold bg-slate-700 rounded-3xl">SKIP</button>' +
                    '<button onclick="this.closest(\'.fixed\').remove()" class="px-5 py-3 text-sm font-extrabold bg-slate-800 rounded-3xl">QUIT</button></div>' +
                    '<div id="drill-feedback" class="text-xs mt-2 font-semibold h-4"></div></div>'

                setTimeout(() => { const el = document.getElementById('translit-input'); if (el) el.focus() }, 80)
            }

            function next() {
                current++
                if (current < drillCards.length) renderDrill()
                else showResultModal('Drill complete!', score, drillCards.length, 'Strong transliteration recall. Keep the streak alive.', startTranslitDrill)
            }

            window.__drillCheck = function () {
                const input = document.getElementById('translit-input')
                const card = drillCards[current]
                const fb = modal.querySelector('#drill-feedback')
                const val = input.value.trim().toLowerCase()
                if (val === card.english.toLowerCase() || norm(val) === norm(card.english)) {
                    score++
                    fb.innerHTML = '<span class="text-emerald-300">✓ CORRECT!</span>'
                    input.style.borderColor = '#34d399'
                    setTimeout(next, 1000)
                } else {
                    fb.innerHTML = '<span class="text-red-300">✗ Not quite — try again or SKIP</span>'
                    input.style.borderColor = '#f87171'
                    input.select()
                }
            }

            window.__drillSkip = function () {
                const card = drillCards[current]
                modal.querySelector('#drill-feedback').innerHTML = '<span class="text-indigo-300">Answer: ' + esc(card.english) + '</span>'
                setTimeout(next, 1400)
            }

            renderDrill()
        }

        // =====================================================================
        // SETTINGS + MOBILE NAV
        // =====================================================================
        function showSettings() {
            const old = document.getElementById('settings-modal')
            if (old) old.remove()
            const modal = mkModal('settings-modal')
            modal.firstElementChild.innerHTML =
                '<div class="dark-glass border border-slate-700 rounded-3xl p-6">' +
                '<div class="font-extrabold text-xl mb-4">Anki Settings</div>' +
                '<div class="space-y-4 text-sm">' +
                '<div><label class="block text-xs font-bold mb-1">Daily new cards</label>' +
                '<input type="number" value="12" class="bg-slate-800 px-3 py-2 text-sm border border-slate-700 rounded-2xl w-full"></div>' +
                '<div><label class="block text-xs font-bold mb-1">Max reviews per day</label>' +
                '<input type="number" value="80" class="bg-slate-800 px-3 py-2 text-sm border border-slate-700 rounded-2xl w-full"></div>' +
                '<div class="flex items-center justify-between text-xs"><span class="font-bold">Focus on transliterations</span>' +
                '<input type="checkbox" checked class="w-4 h-4 accent-indigo-400"></div></div>' +
                '<div class="flex gap-x-2 mt-6">' +
                '<button onclick="this.closest(\'.fixed\').remove()" class="flex-1 py-3 bg-slate-700 rounded-3xl font-bold">Cancel</button>' +
                '<button onclick="this.closest(\'.fixed\').remove(); toast(\'Settings saved (demo)\')" class="flex-1 py-3 bg-indigo-500 text-white rounded-3xl font-extrabold">Save</button></div></div>'
        }

        function showMobileNav() {
            let m = document.getElementById('mobile-menu')
            if (!m) {
                m = document.createElement('div')
                m.id = 'mobile-menu'
                m.className = 'absolute top-full right-4 mt-2 dark-glass border border-slate-700 rounded-3xl p-2 w-48 z-50 hidden'
                ;[['dashboard', 'Dashboard'], ['anki', 'Anki SRS'], ['translit', 'Transliteration Lab'], ['practice', 'Practice'], ['vocab', 'Vocabulary']].forEach(x => {
                    const a = document.createElement('a')
                    a.href = '#' + x[0]
                    a.textContent = x[1]
                    a.className = 'block px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-2xl'
                    a.onclick = () => m.classList.add('hidden')
                    m.appendChild(a)
                })
                document.querySelector('nav').appendChild(m)
            }
            m.classList.toggle('hidden')
        }

        // =====================================================================
        // INIT
        // =====================================================================
        function initializeApp() {
            initializeTailwind()
            buildCategoryGrid()
            buildVocabFilter()
            buildTipsGrid()
            loadCardData()
            renderVocabTable(cards)
            updateAllStats()

            // Demo: force a few cards due so the dashboard feels alive on first visit
            cards[8].nextReview = Date.now() - 100000
            cards[11].nextReview = Date.now() - 100000
            cards[22].nextReview = Date.now() - 100000
            updateAllStats()

            // Keyboard support for the Anki modal
            document.addEventListener('keydown', function (e) {
                const modal = document.getElementById('anki-modal')
                if (modal && modal.style.display === 'flex') {
                    if (e.key === 'Escape') closeAnkiModal()
                    if (e.key === '/') {
                        e.preventDefault()
                        flipCard()
                    }
                }
            })

            // Warm up TTS voices (async in some browsers)
            if ('speechSynthesis' in window) window.speechSynthesis.getVoices()

            console.log('%c[LebLearn] Full dictionary + 10 learning methods ready. Cards: ' + cards.length, 'color:#64748b')
        }

        window.onload = initializeApp

        // Global helpers
        window.LebLearn = {
            resetAll: () => {
                localStorage.removeItem('lebanese-anki-cards')
                window.location.reload()
            }
        }

        