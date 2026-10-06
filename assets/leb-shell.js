/* ---------------------------------------------------------------------------
   LebLearn shell — tiny script injected into every merged page.

   * inside the hub's in-app viewer (iframe): stays out of the way
   * opened directly: adds a floating "Back to LebLearn Hub" pill so no page in
     the merged site is ever a dead end
   --------------------------------------------------------------------------- */
(function () {
    'use strict'

    if (window.self !== window.top) return           // rendered inside the hub viewer
    if (document.getElementById('leb-shell-pill')) return

    var src = (document.currentScript && document.currentScript.src) || ''
    var root = src.replace(/assets\/leb-shell\.js.*$/, '')
    var hub = root + 'index.html'
    var here = location.pathname.split('/').slice(-2).join('/')

    function mount() {
        var style = document.createElement('style')
        style.textContent =
            '#leb-shell-pill{position:fixed;right:16px;bottom:16px;z-index:2147483000;' +
            'display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:999px;' +
            'background:rgba(15,23,42,.92);color:#e2e8f0;border:1px solid rgba(148,163,184,.25);' +
            'font:600 13px/1 Inter,system-ui,-apple-system,Segoe UI,sans-serif;text-decoration:none;' +
            'box-shadow:0 10px 25px -5px rgba(0,0,0,.45);backdrop-filter:blur(12px);' +
            'transition:transform .2s ease,border-color .2s ease}' +
            '#leb-shell-pill:hover{transform:translateY(-2px);border-color:#6366f1;color:#fff}' +
            '#leb-shell-pill .dot{width:7px;height:7px;border-radius:999px;' +
            'background:linear-gradient(135deg,#6366f1,#a855f7)}' +
            '@media print{#leb-shell-pill{display:none}}'
        document.head.appendChild(style)

        var a = document.createElement('a')
        a.id = 'leb-shell-pill'
        a.href = hub + '#view=' + encodeURIComponent(here)
        a.title = 'Back to the LebLearn hub (all modules, Anki SRS, dictionary)'
        a.innerHTML = '<span class="dot"></span><span>LebLearn Hub</span>'
        document.body.appendChild(a)
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mount)
    } else {
        mount()
    }
})()
