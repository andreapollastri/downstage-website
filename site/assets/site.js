// Downstage website: download only after the license is accepted, and the
// current year in the footer. No tracking, no cookies.
(function () {
  var button = document.getElementById("download-button");
  var boxes = [document.getElementById("agree-license"), document.getElementById("agree-clauses")].filter(Boolean);

  function update() {
    var ok = boxes.length > 0 && boxes.every(function (box) { return box.checked; });
    if (!button) return;
    button.setAttribute("aria-disabled", ok ? "false" : "true");
    button.tabIndex = ok ? 0 : -1;
  }

  boxes.forEach(function (box) { box.addEventListener("change", update); });
  if (button) {
    button.addEventListener("click", function (event) {
      if (button.getAttribute("aria-disabled") === "true") event.preventDefault();
    });
  }
  update();

  document.querySelectorAll("[data-year]").forEach(function (node) {
    node.textContent = String(new Date().getFullYear());
  });

  var header = document.querySelector(".top");
  var nav = header && header.querySelector(".nav");
  var wrap = header && header.querySelector(".wrap");
  if (header && nav && wrap) {
    var code = (document.documentElement.lang || "en").slice(0, 2);
    var labels = {
      en: ["Menu", "Close menu"],
      it: ["Menu", "Chiudi menu"],
      fr: ["Menu", "Fermer le menu"],
      de: ["Menü", "Menü schließen"],
      es: ["Menú", "Cerrar menú"],
      pt: ["Menu", "Fechar menu"]
    };
    var pair = labels[code] || labels.en;
    if (!nav.id) nav.id = "site-nav";
    var toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "nav-toggle";
    toggle.setAttribute("aria-controls", nav.id);
    toggle.innerHTML = "<span></span>";
    wrap.appendChild(toggle);
    header.classList.add("has-toggle");

    function setOpen(open) {
      header.classList.toggle("nav-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? pair[1] : pair[0]);
    }
    setOpen(false);
    toggle.addEventListener("click", function () {
      setOpen(!header.classList.contains("nav-open"));
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () { setOpen(false); });
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") setOpen(false);
    });
    document.addEventListener("click", function (event) {
      if (!header.classList.contains("nav-open")) return;
      if (header.contains(event.target)) return;
      setOpen(false);
    });
  }
})();

// The screenshots strip: previous/next, the counter and the bar follow the
// scroll; a click on a shot opens it full size in a dialog (← → to move).
(function () {
  var strip = document.querySelector(".strip");
  if (!strip) return;
  var slides = Array.prototype.slice.call(strip.querySelectorAll(".slide"));
  var prev = document.querySelector("[data-shots-prev]");
  var next = document.querySelector("[data-shots-next]");
  var count = document.querySelector("[data-shots-count]");
  var thumb = document.querySelector(".shots-bar i");
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function two(n) { return (n < 10 ? "0" : "") + n; }
  function edge() { return parseFloat(getComputedStyle(strip).paddingLeft) || 0; }
  function offsetOf(slide) { return slide.getBoundingClientRect().left - strip.getBoundingClientRect().left - edge(); }
  function current() {
    var best = 0, dist = Infinity;
    slides.forEach(function (slide, k) {
      var d = Math.abs(offsetOf(slide));
      if (d < dist) { dist = d; best = k; }
    });
    return best;
  }
  function update() {
    var k = current();
    var max = strip.scrollWidth - strip.clientWidth;
    if (count) count.textContent = two(k + 1) + " / " + two(slides.length);
    if (prev) prev.disabled = strip.scrollLeft <= 2;
    if (next) next.disabled = strip.scrollLeft >= max - 2;
    if (thumb && strip.scrollWidth) {
      thumb.style.width = (strip.clientWidth / strip.scrollWidth * 100) + "%";
      thumb.style.transform = "translateX(" + (strip.scrollLeft / strip.clientWidth * 100) + "%)";
    }
    return k;
  }
  // Quick clicks add up: the target index survives the smooth scroll and
  // is forgotten once the strip has settled.
  var target = null, settle = null;
  function go(delta) {
    var k = Math.max(0, Math.min(slides.length - 1, (target == null ? current() : target) + delta));
    target = k;
    strip.scrollTo({ left: strip.scrollLeft + offsetOf(slides[k]), behavior: reduced ? "auto" : "smooth" });
  }
  if (prev) prev.addEventListener("click", function () { go(-1); });
  if (next) next.addEventListener("click", function () { go(1); });
  strip.addEventListener("keydown", function (event) {
    if (event.key === "ArrowRight") { event.preventDefault(); go(1); }
    if (event.key === "ArrowLeft") { event.preventDefault(); go(-1); }
  });
  strip.addEventListener("scroll", function () {
    update();
    clearTimeout(settle);
    settle = setTimeout(function () { target = null; }, 160);
  }, { passive: true });
  window.addEventListener("resize", update);
  update();

  var box = document.getElementById("lightbox");
  if (!box || typeof box.showModal !== "function") return;
  var image = box.querySelector("img");
  var caption = box.querySelector("p");
  var shown = 0;
  function show(k) {
    shown = (k + slides.length) % slides.length;
    var source = slides[shown].querySelector("img");
    var text = slides[shown].querySelector("figcaption");
    image.src = source.currentSrc || source.src;
    image.alt = source.alt;
    caption.innerHTML = "";
    var title = document.createElement("b");
    title.textContent = text.querySelector("b").textContent;
    caption.appendChild(title);
    caption.appendChild(document.createTextNode(text.querySelector("span").textContent));
    if (!box.open) box.showModal();
  }
  slides.forEach(function (slide, k) {
    var button = slide.querySelector("button.shot");
    if (button) button.addEventListener("click", function () { show(k); });
  });
  box.addEventListener("click", function (event) {
    if (event.target === box || event.target.closest(".lb-close")) box.close();
  });
  box.addEventListener("keydown", function (event) {
    if (event.key === "ArrowRight") { event.preventDefault(); show(shown + 1); }
    if (event.key === "ArrowLeft") { event.preventDefault(); show(shown - 1); }
  });
  box.addEventListener("close", function () { image.removeAttribute("src"); });
})();
