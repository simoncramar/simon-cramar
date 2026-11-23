import justifiedLayout from "./justified-layout.js";
import * as params from "@params";

const getAspectRatio = (item) => {
  const img = item.querySelector("img");

  if (img) {
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";
    img.style.objectPosition = "center";
    return parseFloat(img.getAttribute("width")) / parseFloat(img.getAttribute("height"));
  }

  const aspectRatioStyle =
    item.style.aspectRatio || item.getAttribute("style")?.match(/aspect-ratio:\s*([\d.]+)\s*\/\s*([\d.]+)/);
  if (aspectRatioStyle) {
    if (typeof aspectRatioStyle === "string" && aspectRatioStyle.includes("/")) {
      const [width, height] = aspectRatioStyle.split("/").map(parseFloat);
      return width / height;
    }
    if (Array.isArray(aspectRatioStyle)) {
      return parseFloat(aspectRatioStyle[1]) / parseFloat(aspectRatioStyle[2]);
    }
  }

  return 16 / 9;
};

const initGallery = (gallery) => {
  let containerWidth = 0;
  const allItems = Array.from(gallery.querySelectorAll(".gallery-item"));

  function updateGallery(force = false) {
    const visibleItems = allItems.filter((item) => !item.classList.contains("is-filtered-out"));

    allItems.forEach((item) => {
      if (item.classList.contains("is-filtered-out")) {
        item.style.display = "none";
      } else {
        item.style.display = "";
      }
    });

    const width = gallery.getBoundingClientRect().width;
    if (!force && containerWidth === width && !gallery.dataset.needsRelayout) return;
    containerWidth = width;
    delete gallery.dataset.needsRelayout;

    if (visibleItems.length === 0) {
      gallery.style.height = "0px";
      gallery.classList.remove("gallery-grid--pending");
      return;
    }

    const spacing = Number.isInteger(params.boxSpacing) ? params.boxSpacing : 8;
    const singleColumn = gallery.dataset.singleColumn === "true";

    if (singleColumn) {
      let top = 0;
      visibleItems.forEach((item) => {
        const ratio = getAspectRatio(item);
        const boxWidth = containerWidth;
        const height = boxWidth / ratio;
        item.style.position = "absolute";
        item.style.width = boxWidth + "px";
        item.style.height = height + "px";
        item.style.top = top + "px";
        item.style.left = "0px";
        item.style.overflow = "hidden";
        top += height + spacing;
      });

      gallery.style.position = "relative";
      gallery.style.height = Math.max(0, top - spacing) + "px";
      gallery.classList.remove("gallery-grid--pending");
      return;
    }

    const aspectRatios = visibleItems.map(getAspectRatio);

    const layout = justifiedLayout(aspectRatios, {
      rowWidth: containerWidth,
      spacing,
      rowHeight: params.targetRowHeight || 288,
      heightTolerance: Number.isInteger(params.targetRowHeightTolerance)
        ? params.targetRowHeightTolerance
        : 0.25,
    });

    visibleItems.forEach((item, i) => {
      const { width: boxWidth, height, top, left } = layout.boxes[i];
      item.style.position = "absolute";
      item.style.width = boxWidth + "px";
      item.style.height = height + "px";
      item.style.top = top + "px";
      item.style.left = left + "px";
      item.style.overflow = "hidden";
    });

    gallery.style.position = "relative";
    gallery.style.height = layout.containerHeight + "px";
    gallery.classList.remove("gallery-grid--pending");
  }

  window.addEventListener("resize", () => updateGallery(false));
  window.addEventListener("orientationchange", () => updateGallery(true));
  gallery.addEventListener("gallery:relayout", () => updateGallery(true));

  updateGallery(true);
  updateGallery(true);
};

document.querySelectorAll(".gallery-grid").forEach(initGallery);
