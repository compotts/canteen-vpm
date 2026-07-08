import { useEffect } from "react";

const SVG_NS = "http://www.w3.org/2000/svg";
let uid = 0;

function isChromium() {
  return (
    Boolean(navigator.userAgentData?.brands?.some((b) => /Chromium/i.test(b.brand))) ||
    Boolean(window.chrome)
  );
}

function makeDisplacementMap(w, h, edge, radius) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w));
  canvas.height = Math.max(1, Math.round(h));
  const ctx = canvas.getContext("2d");

  const gx = ctx.createLinearGradient(0, 0, w, 0);
  gx.addColorStop(0, "#000");
  gx.addColorStop(1, "#f00");
  ctx.fillStyle = gx;
  ctx.fillRect(0, 0, w, h);

  ctx.globalCompositeOperation = "screen";
  const gy = ctx.createLinearGradient(0, 0, 0, h);
  gy.addColorStop(0, "#000");
  gy.addColorStop(1, "#0f0");
  ctx.fillStyle = gy;
  ctx.fillRect(0, 0, w, h);

  ctx.globalCompositeOperation = "source-over";
  ctx.filter = `blur(${edge / 2}px)`;
  ctx.fillStyle = "rgb(127,127,127)";
  ctx.beginPath();
  const r = Math.max(0, Math.min(radius, (Math.min(w, h) - edge * 2) / 2));
  ctx.roundRect(edge, edge, w - edge * 2, h - edge * 2, r);
  ctx.fill();

  return canvas.toDataURL();
}

export default function useLiquidLens(ref, { scale = -32, blur = 13, saturate = 1.8 } = {}) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !isChromium()) return undefined;
    if (window.matchMedia("(prefers-reduced-transparency: reduce)").matches) return undefined;

    const id = `liquid-lens-${++uid}`;
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("aria-hidden", "true");
    svg.style.cssText = "position:absolute;width:0;height:0";

    const filter = document.createElementNS(SVG_NS, "filter");
    filter.setAttribute("id", id);
    filter.setAttribute("filterUnits", "userSpaceOnUse");
    filter.setAttribute("color-interpolation-filters", "sRGB");
    filter.setAttribute("x", "0");
    filter.setAttribute("y", "0");

    const feImage = document.createElementNS(SVG_NS, "feImage");
    feImage.setAttribute("result", "map");
    feImage.setAttribute("preserveAspectRatio", "none");
    feImage.setAttribute("x", "0");
    feImage.setAttribute("y", "0");

    const feBlur = document.createElementNS(SVG_NS, "feGaussianBlur");
    feBlur.setAttribute("in", "SourceGraphic");
    feBlur.setAttribute("stdDeviation", String(blur));
    feBlur.setAttribute("result", "frost");

    const feSat = document.createElementNS(SVG_NS, "feColorMatrix");
    feSat.setAttribute("in", "frost");
    feSat.setAttribute("type", "saturate");
    feSat.setAttribute("values", String(saturate));
    feSat.setAttribute("result", "tuned");

    const feDisp = document.createElementNS(SVG_NS, "feDisplacementMap");
    feDisp.setAttribute("in", "tuned");
    feDisp.setAttribute("in2", "map");
    feDisp.setAttribute("scale", String(scale));
    feDisp.setAttribute("xChannelSelector", "R");
    feDisp.setAttribute("yChannelSelector", "G");

    filter.append(feImage, feBlur, feSat, feDisp);
    svg.appendChild(filter);
    document.body.appendChild(svg);

    const sync = () => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      if (!w || !h) return;
      const edge = Math.max(8, Math.min(w, h) * 0.25);
      const radius = Math.min(w, h) / 2 - edge;
      filter.setAttribute("width", String(w));
      filter.setAttribute("height", String(h));
      feImage.setAttribute("width", String(w));
      feImage.setAttribute("height", String(h));
      feImage.setAttribute("href", makeDisplacementMap(w, h, edge, radius));
      el.style.backdropFilter = `url(#${id})`;
    };

    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);

    return () => {
      ro.disconnect();
      el.style.backdropFilter = "";
      svg.remove();
    };
  }, [ref, scale, blur, saturate]);
}
