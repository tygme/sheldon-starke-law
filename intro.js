// Home intro: flies the seal from centre-stage into the masthead as the visitor scrolls,
// then keeps it docked top-left. The masthead bar slides away on scroll down and returns on
// scroll up; the medal stays, and fades back whenever it would sit over text.
(function () {
  var intro = document.getElementById('intro');
  var stage = document.getElementById('intro-stage');
  var flyer = document.getElementById('flying-seal');
  var target = document.querySelector('.masthead .seal');
  var mast = document.querySelector('.masthead');
  var menu = document.querySelector('.masthead .menu');
  if (!intro || !flyer || !target) return;
  var root = document.documentElement;
  root.classList.add('has-intro');
  var ease = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var TEXT = 'p, h1, h2, h3, li, blockquote, figcaption, img, a, strong, dt, dd, label, input, textarea, select, button';
  var base = 0, lastY = scrollY;

  // Hide the bar on scroll down once past the intro; bring it back on scroll up or near the top.
  function updateBar() {
    var y = scrollY, dy = y - lastY;
    var pastIntro = y > intro.offsetTop + intro.offsetHeight;
    if (!pastIntro || (menu && menu.open)) mast.classList.remove('is-tucked');
    else if (dy > 6) mast.classList.add('is-tucked');
    else if (dy < -6) mast.classList.remove('is-tucked');
    if (Math.abs(dy) > 6 || !pastIntro) lastY = y;
  }

  // True when text, a photo or a control lies under the docked medal (and the bar is not behind it).
  function overText(cx, cy, r) {
    var pts = [[0, 0], [-r, 0], [r, 0], [0, -r], [0, r]];
    for (var i = 0; i < pts.length; i++) {
      var hit = document.elementsFromPoint(cx + pts[i][0], cy + pts[i][1]);
      for (var j = 0; j < hit.length; j++) {
        var el = hit[j];
        if (flyer.contains(el)) continue;
        if (mast.contains(el)) break;           // the bar is showing behind the medal
        if (el.closest(TEXT)) return true;
        break;                                  // a plain section background
      }
    }
    return false;
  }

  function frame() {
    var vw = innerWidth;
    var mh = mast.offsetHeight;
    root.style.setProperty('--mh', mh + 'px');
    var st = stage.getBoundingClientRect();
    var startSize = Math.min(vw * .62, st.height * .52, 400);
    if (base !== startSize) { base = startSize; flyer.style.width = flyer.style.height = startSize + 'px'; }

    var travel = Math.max(1, st.height * .75);  // the hero rises into view while the seal flies
    var scrolled = clamp(-intro.getBoundingClientRect().top + mh, 0, Infinity);
    var raw = clamp(scrolled / travel, 0, 1);
    var p = ease(raw);

    updateBar();
    // Dock where the masthead seal sits, even while the bar itself is tucked away.
    var tr = target.getBoundingClientRect();
    var shift = mast.getBoundingClientRect().top - (parseFloat(getComputedStyle(mast).top) || 0);
    var sx = vw / 2, sy = st.top + st.height * .42;
    var ex = tr.left + tr.width / 2, ey = tr.top + tr.height / 2 - Math.min(0, shift);
    var x = sx + (ex - sx) * p, y = sy + (ey - sy) * p;
    var size = startSize + (tr.width - startSize) * p;
    flyer.style.transform = 'translate(' + (x - size / 2) + 'px,' + (y - size / 2) + 'px) scale(' + size / startSize + ')';
    flyer.firstElementChild.style.rotate = (-p * 360) + 'deg';
    flyer.classList.toggle('is-faded', raw >= 1 && overText(x, y, size * .38));

    root.style.setProperty('--p', raw.toFixed(4));
    root.style.setProperty('--row-top', ((sy - st.top + startSize / 2 + 30) / st.height * 100).toFixed(2) + '%');
    root.style.setProperty('--word', clamp((p - .75) / .25, 0, 1).toFixed(3));
  }

  var queued = false;
  function tick() { if (!queued) { queued = true; requestAnimationFrame(function () { queued = false; frame(); }); } }
  addEventListener('scroll', tick, { passive: true });
  addEventListener('resize', tick);
  mast.addEventListener('transitionend', tick);
  if (menu) menu.addEventListener('toggle', tick);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(tick);
  frame();
})();
