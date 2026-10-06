// Guide pages: language menu, chapter jump, enlarged screenshots.
(function () {
  var lang = document.getElementById("langpick");
  if (lang) {
    lang.addEventListener("change", function () {
      var opt = lang.options[lang.selectedIndex];
      var code = (opt && opt.getAttribute("data-lang")) || "en";
      document.cookie = "nf_lang=" + code + "; Path=/; Max-Age=31536000; SameSite=Lax";
      location.href = lang.value + location.hash;
    });
  }

  var dialog = document.getElementById("zoom");
  var picture = dialog && dialog.querySelector("img");

  document.querySelectorAll("[data-zoom]").forEach(function (button) {
    button.addEventListener("click", function () {
      if (!dialog || !picture) return;
      var image = button.querySelector("img");
      picture.src = button.getAttribute("data-zoom");
      picture.alt = image ? image.alt : "";
      dialog.showModal();
    });
  });

  if (dialog) {
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener("close", function () {
      if (picture) picture.removeAttribute("src");
    });
  }

  var links = Array.prototype.slice.call(document.querySelectorAll(".docs-toc a"));
  var jump = document.querySelector(".docs-jump select");
  var nav = document.querySelector(".docs-nav");
  if (jump && links.length) {
    links.forEach(function (link) {
      var option = document.createElement("option");
      option.value = link.getAttribute("href");
      option.textContent = link.textContent;
      jump.appendChild(option);
    });
    if (nav) nav.classList.add("is-ready");
    jump.addEventListener("change", function () {
      if (jump.value) location.hash = jump.value;
    });
  }

  var sections = links.map(function (link) {
    return document.getElementById(link.getAttribute("href").slice(1));
  }).filter(Boolean);
  if (!sections.length || !("IntersectionObserver" in window)) return;

  var visible = new Map();
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) visible.set(entry.target.id, entry.intersectionRatio);
      else visible.delete(entry.target.id);
    });
    var current = sections.reduce(function (best, section) {
      if (!visible.has(section.id)) return best;
      if (!best || visible.get(section.id) > visible.get(best)) return section.id;
      return best;
    }, null);
    links.forEach(function (link) {
      var on = link.getAttribute("href") === "#" + current;
      link.classList.toggle("is-current", on);
      if (on) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
    if (jump && current) jump.value = "#" + current;
  }, { rootMargin: "-20% 0px -55% 0px", threshold: [0, 0.15, 0.4] });

  sections.forEach(function (section) { observer.observe(section); });
})();
