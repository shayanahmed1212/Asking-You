/* =====================================================
   PASSWORD LOCK
   Must be the FIRST <script> in <head> of every page.

   - Locked page: the real page is hidden (display:none) and
     audio/video playback is blocked until the password is right,
     so nothing can be seen, clicked or heard behind the lock.
   - Unlocking happens IN PLACE (no reload), so the click / Enter key
     on the lock screen counts as the user gesture browsers require,
     and the music starts the instant the real page appears.
   - Unlock is remembered only for this tab (sessionStorage),
     so moving index -> quiz -> letter -> hug -> yes works,
     but closing the tab locks it again.
   - The entry page (index.html) has the "data-entry" attribute
     on its lock script, so it ALWAYS asks.
   - Refreshing ANY page locks it again (and unlocking restarts its music).
===================================================== */

(function () {

    var PASSWORD_HASH =
        "ed6863d3eda2d554788cb5a7b4a143424c4b55341d3bbcb29c78aec196b74141";

    var KEY = "pageLockKey";

    function sha256(str) {
        var k = [], H = [];
        var rr = function (v, a) { return (v >>> a) | (v << (32 - a)); };
        var p = 2, n = 0;
        while (n < 64) {
            var prime = true;
            for (var d = 2; d * d <= p; d++) if (p % d === 0) { prime = false; break; }
            if (prime) {
                if (n < 8) H[n] = (Math.pow(p, 1 / 2) % 1 * 4294967296) | 0;
                k[n++] = (Math.pow(p, 1 / 3) % 1 * 4294967296) | 0;
            }
            p++;
        }
        var bytes = unescape(encodeURIComponent(str)).split("").map(function (c) { return c.charCodeAt(0); });
        var bitLen = bytes.length * 8;
        bytes.push(0x80);
        while (bytes.length % 64 !== 56) bytes.push(0);
        for (var i = 7; i >= 0; i--) bytes.push(i > 3 ? 0 : (bitLen >>> (i * 8)) & 255);
        for (var o = 0; o < bytes.length; o += 64) {
            var w = [];
            for (var j = 0; j < 16; j++)
                w[j] = (bytes[o+j*4] << 24) | (bytes[o+j*4+1] << 16) | (bytes[o+j*4+2] << 8) | bytes[o+j*4+3];
            for (var j2 = 16; j2 < 64; j2++) {
                var s0 = rr(w[j2-15], 7) ^ rr(w[j2-15], 18) ^ (w[j2-15] >>> 3);
                var s1 = rr(w[j2-2], 17) ^ rr(w[j2-2], 19) ^ (w[j2-2] >>> 10);
                w[j2] = (w[j2-16] + s0 + w[j2-7] + s1) | 0;
            }
            var a = H[0], b = H[1], c = H[2], dd = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
            for (var m = 0; m < 64; m++) {
                var S1 = rr(e, 6) ^ rr(e, 11) ^ rr(e, 25);
                var t1 = (h + S1 + ((e & f) ^ (~e & g)) + k[m] + w[m]) | 0;
                var S0 = rr(a, 2) ^ rr(a, 13) ^ rr(a, 22);
                var t2 = (S0 + ((a & b) ^ (a & c) ^ (b & c))) | 0;
                h = g; g = f; f = e; e = (dd + t1) | 0; dd = c; c = b; b = a; a = (t1 + t2) | 0;
            }
            H[0] = (H[0]+a)|0; H[1] = (H[1]+b)|0; H[2] = (H[2]+c)|0; H[3] = (H[3]+dd)|0;
            H[4] = (H[4]+e)|0; H[5] = (H[5]+f)|0; H[6] = (H[6]+g)|0; H[7] = (H[7]+h)|0;
        }
        return H.map(function (x) { return (x >>> 0).toString(16).padStart(8, "0"); }).join("");
    }

    /* If the browser still refuses autoplay (no gesture yet, e.g. after a refresh
       on an inner page), start the music on the very first tap / key press. */
    function armMusicFallback() {
        var evs = ["pointerdown", "keydown", "touchstart"];
        function go() {
            evs.forEach(function (ev) { document.removeEventListener(ev, go, true); });
            document.querySelectorAll("audio").forEach(function (a) {
                if (a.paused) { try { a.play().catch(function () {}); } catch (e) {} }
            });
        }
        evs.forEach(function (ev) { document.addEventListener(ev, go, true); });
    }

    var me = document.currentScript;
    var isEntry = !!(me && me.hasAttribute("data-entry"));

    // was this page load a refresh (F5 / reload button / pull-to-refresh)?
    var isReload = false;
    try {
        var nav = performance.getEntriesByType("navigation")[0];
        isReload = !!nav && nav.type === "reload";
    } catch (e) {}
    if (!isReload) {
        try { isReload = performance.navigation && performance.navigation.type === 1; } catch (e) {}
    }

    // entry page always asks; ANY page asks again after a refresh
    if (isEntry || isReload) {
        try { sessionStorage.removeItem(KEY); } catch (e) {}
    }

    var unlocked = false;
    try { unlocked = sessionStorage.getItem(KEY) === PASSWORD_HASH; } catch (e) {}

    if (unlocked) {          // page loads normally
        armMusicFallback();
        return;
    }


    /* ---------- LOCKED: build the lock screen ---------- */

    var css =
        "html{background:linear-gradient(135deg,#f9e3e3 0%,#d6eaf8 100%);}" +
        "#pl-screen{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;" +
        "justify-content:center;overflow:hidden;" +
        "background:linear-gradient(135deg,#f9e3e3 0%,#d6eaf8 100%);" +
        "font-family:'Comic Sans MS','cursive',sans-serif;}" +
        "#pl-box{position:relative;z-index:10;text-align:center;width:min(420px,88vw);box-sizing:border-box;" +
        "padding:38px 34px;background:rgba(255,255,255,.5);border:5px solid #fff;border-radius:40px;" +
        "-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);" +
        "box-shadow:0 10px 30px rgba(255,107,173,.3);animation:plFloat 3s ease-in-out infinite;}" +
        "#pl-icon{font-size:42px;margin-bottom:6px;}" +
        "#pl-label{font-size:1.05em;color:#2e86c1;font-weight:bold;margin-bottom:8px;}" +
        "#pl-box h1{margin:0 0 22px;font-size:2em;line-height:1.25;color:#ff6bad;text-shadow:2px 2px 0 #fff;}" +
        "#pl-input{width:100%;box-sizing:border-box;padding:14px;text-align:center;font-size:1.3em;" +
        "letter-spacing:6px;font-family:inherit;color:#2e86c1;background:rgba(255,255,255,.75);" +
        "border:3px solid #fff;border-radius:50px;outline:none;box-shadow:0 4px 15px rgba(255,107,173,.25);}" +
        "#pl-input::placeholder{color:#f3a6c8;letter-spacing:6px;}" +
        "#pl-input:focus{border-color:#ff6bad;}" +
        "#pl-btn{margin-top:18px;padding:13px 34px;cursor:pointer;font-family:inherit;font-size:1.15em;" +
        "background:#ff6bad;color:#fff;border:3px solid #fff;border-radius:50px;" +
        "box-shadow:0 4px 15px rgba(255,107,173,.4);transition:transform .2s;}" +
        "#pl-btn:hover{transform:scale(1.05);}#pl-btn:active{transform:scale(.95);}" +
        "#pl-err{min-height:22px;margin-top:14px;color:#ff4d94;font-size:.95em;font-weight:bold;}" +
        "#pl-box.shake{animation:plShake .4s;}" +
        ".pl-heart{position:fixed;top:-10px;font-size:25px;color:#ff6bad;opacity:.5;z-index:1;" +
        "pointer-events:none;animation:plFall linear forwards;}" +
        "@keyframes plFall{to{transform:translateY(105vh) rotate(360deg);}}" +
        "@keyframes plFloat{0%,100%{transform:translateY(0);}50%{transform:translateY(-12px);}}" +
        "@keyframes plShake{25%{transform:translateX(-8px);}75%{transform:translateX(8px);}}";

    // hide the real page + make sure no music can start behind the lock
    css += "html body{display:none !important;}";
    var realPlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
        return Promise.reject(new Error("locked"));
    };

    // hold back the page's own start-up code (window.onload = ...: fade-in,
    // typewriter, quiz, music...) until the password is correct
    var deferredLoad = null;
    try {
        Object.defineProperty(window, "onload", {
            configurable: true,
            get: function () { return deferredLoad; },
            set: function (fn) { deferredLoad = fn; }
        });
    } catch (e) {}

    var style = document.createElement("style");
    style.textContent = css;
    document.documentElement.appendChild(style);

    var screen = document.createElement("div");
    screen.id = "pl-screen";
    screen.innerHTML =
        '<div id="pl-box">' +
        '<div id="pl-icon">🔒</div>' +
        
        '<h1>Secret password, please!</h1>' +
        '<input id="pl-input" type="password" inputmode="numeric" autocomplete="off" placeholder="• • • • • • •">' +
        '<button id="pl-btn">Unlock 💗</button>' +
        '<div id="pl-err"></div>' +
        '</div>';
    document.documentElement.appendChild(screen);

    var input = document.getElementById("pl-input");
    var btn = document.getElementById("pl-btn");
    var err = document.getElementById("pl-err");
    var box = document.getElementById("pl-box");

    var heartTimer;

    function unlockInPlace() {
        try { sessionStorage.setItem(KEY, PASSWORD_HASH); } catch (e) {}

        clearInterval(heartTimer);
        HTMLMediaElement.prototype.play = realPlay;   // audio allowed again
        screen.remove();
        style.remove();                               // page becomes visible

        // run the page's own start-up code now, inside the click / Enter gesture
        try { delete window.onload; } catch (e) {}
        if (typeof deferredLoad === "function") {
            try { deferredLoad.call(window); } catch (e) { console.error(e); }
        }

        // make sure the music is playing (e.g. index page has no auto-start of its own)
        document.querySelectorAll("audio").forEach(function (a) {
            if (a.paused) { try { a.play().catch(function () {}); } catch (e) {} }
        });

        armMusicFallback();
    }

    function tryUnlock() {
        if (sha256(input.value.trim()) === PASSWORD_HASH) {
            unlockInPlace();
        } else {
            err.textContent = "Hehe nope, try again 💌";
            input.value = "";
            box.classList.remove("shake");
            void box.offsetWidth;
            box.classList.add("shake");
        }
    }

    btn.addEventListener("click", tryUnlock);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") tryUnlock(); });
    input.focus();

    // falling hearts, same as the rest of the site
    function lockHeart() {
        var h = document.createElement("div");
        h.className = "pl-heart";
        h.textContent = "❤️";
        h.style.left = Math.random() * 100 + "vw";
        h.style.animationDuration = (Math.random() * 3 + 6) + "s";
        screen.appendChild(h);
        setTimeout(function () { h.remove(); }, 9000);
    }
    heartTimer = setInterval(lockHeart, 600);
    lockHeart(); lockHeart();

})();