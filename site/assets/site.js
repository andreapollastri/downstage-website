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
