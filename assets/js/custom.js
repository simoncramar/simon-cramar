/* Scale page titles down so they stay on one line within their panel */
function initFitTitles() {
  const titles = Array.from(document.querySelectorAll("[data-fit-title]"));
  if (!titles.length) return;

  const fit = (el) => {
    el.style.fontSize = "";
    const maxPx = parseFloat(getComputedStyle(el).fontSize);
    if (!maxPx) return;

    // Block title takes the panel content width; compare text vs that box
    const available = el.clientWidth;
    if (!available) return;

    el.style.fontSize = `${maxPx}px`;
    if (el.scrollWidth <= available) return;

    let lo = 12;
    let hi = maxPx;
    let best = lo;
    while (hi - lo > 0.25) {
      const mid = (lo + hi) / 2;
      el.style.fontSize = `${mid}px`;
      if (el.scrollWidth <= available) {
        best = mid;
        lo = mid;
      } else {
        hi = mid;
      }
    }
    el.style.fontSize = `${best}px`;
  };

  const schedule = (el) => {
    requestAnimationFrame(() => fit(el));
  };

  titles.forEach((el) => {
    schedule(el);
    if (typeof ResizeObserver === "undefined") return;
    const parent = el.parentElement;
    if (!parent) return;
    new ResizeObserver(() => schedule(el)).observe(parent);
  });

  window.addEventListener("resize", () => titles.forEach(schedule), { passive: true });
}

/* Portfolio: un seul filtre à la fois + réorganisation dynamique de la grille */
function initPortfolioFilters() {
  const root = document.querySelector("[data-portfolio]");
  if (!root) return;

  const gallery = root.querySelector(".gallery-grid");
  const items = Array.from(root.querySelectorAll(".gallery-item--video"));
  const emptyMsg = root.querySelector("[data-portfolio-empty]");
  const chips = Array.from(root.querySelectorAll(".portfolio-chip"));
  const inlineFilters = root.querySelector("[data-portfolio-filters]");
  const toggle = root.querySelector("#filter-toggle");
  const panel = root.querySelector("#filter-panel");
  const backdrop = root.querySelector("#filter-backdrop");

  let active = null; // { group: "roles"|"technique"|"secteurs", value: string } | null
  let filtersOutOfView = false;
  let closeTimer;

  function syncChips() {
    chips.forEach((chip) => {
      const group = chip.closest("[data-filter-group]")?.dataset.filterGroup;
      const isActive = active && group === active.group && chip.dataset.filter === active.value;
      chip.classList.toggle("is-active", Boolean(isActive));
      chip.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    if (toggle) {
      toggle.classList.toggle("has-active-filter", Boolean(active));
    }
  }

  function applyFilters() {
    let visible = 0;

    items.forEach((item) => {
      const itemRoles = (item.dataset.roles || "").split(/\s+/).filter(Boolean);
      const itemTechniques = (item.dataset.technique || "").split(/\s+/).filter(Boolean);
      const itemSecteurs = (item.dataset.secteurs || "").split(/\s+/).filter(Boolean);

      let show = true;
      if (active) {
        if (active.group === "roles") {
          show = itemRoles.includes(active.value);
        } else if (active.group === "technique") {
          show = itemTechniques.includes(active.value);
        } else if (active.group === "secteurs") {
          show = itemSecteurs.includes(active.value);
        }
      }

      item.classList.toggle("is-filtered-out", !show);
      if (show) visible += 1;
    });

    syncChips();

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

  if (!toggle || !panel) return;

  function updateToggleVisibility() {
    const open = toggle.getAttribute("aria-expanded") === "true";
    const show = filtersOutOfView || open;
    toggle.classList.toggle("is-visible", show);
    toggle.setAttribute("aria-hidden", String(!show));
    toggle.tabIndex = show ? 0 : -1;
  }

  function setPanelOpen(open) {
    window.clearTimeout(closeTimer);
    toggle.setAttribute("aria-expanded", String(open));
    panel.classList.toggle("is-open", open);
    panel.setAttribute("aria-hidden", String(!open));
    document.body.classList.toggle("filter-panel-open", open);
    updateToggleVisibility();

    if (open) {
      document.dispatchEvent(new CustomEvent("filters:open"));
    }

    if (!backdrop) return;

    if (open) {
      backdrop.hidden = false;
      requestAnimationFrame(() => {
        backdrop.classList.add("is-open");
      });
    } else {
      backdrop.classList.remove("is-open");
      closeTimer = window.setTimeout(() => {
        backdrop.hidden = true;
      }, 300);
    }
  }

  const closePanel = () => setPanelOpen(false);
  const togglePanel = () => setPanelOpen(toggle.getAttribute("aria-expanded") !== "true");

  toggle.addEventListener("click", (event) => {
    event.preventDefault();
    togglePanel();
  });

  backdrop?.addEventListener("click", closePanel);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
      closePanel();
    }
  });

  document.addEventListener("menu:open", closePanel);

  if (inlineFilters && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        filtersOutOfView = !entry.isIntersecting;
        if (!filtersOutOfView) closePanel();
        updateToggleVisibility();
      },
      { threshold: 0, rootMargin: "0px 0px 0px 0px" }
    );
    observer.observe(inlineFilters);
  } else {
    filtersOutOfView = true;
    updateToggleVisibility();
  }
}

function initCustom() {
  initFitTitles();
  initPortfolioFilters();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initCustom);
} else {
  initCustom();
}
