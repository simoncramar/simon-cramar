/* Portfolio: un seul filtre à la fois + réorganisation dynamique de la grille */
function initPortfolioFilters() {
  const root = document.querySelector("[data-portfolio]");
  if (!root) return;

  const gallery = root.querySelector(".gallery-grid");
  const items = Array.from(root.querySelectorAll(".gallery-item--video"));
  const resetBtn = root.querySelector("[data-filter-reset]");
  const emptyMsg = root.querySelector("[data-portfolio-empty]");
  const chips = Array.from(root.querySelectorAll(".portfolio-chip"));

  let active = null; // { group: "roles"|"secteurs", value: string } | null

  function syncChips() {
    chips.forEach((chip) => {
      const group = chip.closest("[data-filter-group]")?.dataset.filterGroup;
      const isActive = active && group === active.group && chip.dataset.filter === active.value;
      chip.classList.toggle("is-active", Boolean(isActive));
      chip.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }

  function applyFilters() {
    let visible = 0;

    items.forEach((item) => {
      const itemRoles = (item.dataset.roles || "").split(/\s+/).filter(Boolean);
      const itemSecteurs = (item.dataset.secteurs || "").split(/\s+/).filter(Boolean);

      let show = true;
      if (active) {
        if (active.group === "roles") {
          show = itemRoles.includes(active.value);
        } else if (active.group === "secteurs") {
          show = itemSecteurs.includes(active.value);
        }
      }

      item.classList.toggle("is-filtered-out", !show);
      if (show) visible += 1;
    });

    syncChips();

    if (resetBtn) resetBtn.hidden = !active;
    if (emptyMsg) emptyMsg.hidden = visible !== 0;

    if (gallery) {
      gallery.dataset.needsRelayout = "true";
      gallery.dispatchEvent(new Event("gallery:relayout"));
    }
  }

  function onChipClick(event) {
    const chip = event.target.closest(".portfolio-chip");
    if (!chip) return;
    const group = chip.closest("[data-filter-group]")?.dataset.filterGroup;
    const value = chip.dataset.filter;
    if (!group || !value) return;

    if (active && active.group === group && active.value === value) {
      active = null;
    } else {
      active = { group, value };
    }
    applyFilters();
  }

  root.querySelectorAll("[data-filter-group]").forEach((group) => {
    group.addEventListener("click", onChipClick);
  });

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      active = null;
      applyFilters();
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPortfolioFilters);
} else {
  initPortfolioFilters();
}
