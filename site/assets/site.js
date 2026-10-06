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
})();
