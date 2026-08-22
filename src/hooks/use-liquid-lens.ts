"use client";

import { useEffect, type RefObject } from "react";

const SVG_NS = "http://www.w3.org/2000/svg";
let uid = 0;

type NavigatorUAData = {
  brands?: { brand: string }[];
};

function isChromium(): boolean {
  const uaData = (navigator as Navigator & { userAgentData?: NavigatorUAData })
    .userAgentData;
  return (
    Boolean(uaData?.brands?.some((b) => /Chromium/i.test(b.brand))) ||
    Boolean((window as Window & { chrome?: unknown }).chrome)
  );
}

function makeDisplacementMap(
  width: number,
  height: number,
  edge: number,
  radius: number
): string {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const context = canvas.getContext("2d")!;

  const horizontal = context.createLinearGradient(0, 0, width, 0);
  horizontal.addColorStop(0, "#000");
  horizontal.addColorStop(1, "#f00");
  context.fillStyle = horizontal;
  context.fillRect(0, 0, width, height);

  context.globalCompositeOperation = "screen";
  const vertical = context.createLinearGradient(0, 0, 0, height);
  vertical.addColorStop(0, "#000");
  vertical.addColorStop(1, "#0f0");
  context.fillStyle = vertical;
  context.fillRect(0, 0, width, height);

  context.globalCompositeOperation = "source-over";
  context.filter = `blur(${edge / 2}px)`;
  context.fillStyle = "rgb(127,127,127)";
  context.beginPath();
  const clamped = Math.max(
    0,
    Math.min(radius, (Math.min(width, height) - edge * 2) / 2)
  );
  context.roundRect(edge, edge, width - edge * 2, height - edge * 2, clamped);
  context.fill();

  return canvas.toDataURL();
}

type LiquidLensOptions = {
  scale?: number;
  blur?: number;
  saturate?: number;
};

export function useLiquidLens(
  ref: RefObject<HTMLElement | null>,
  { scale = -32, blur = 13, saturate = 1.8 }: LiquidLensOptions = {}
): void {
  useEffect(() => {
    const element = ref.current;
    if (!element || !isChromium()) return;
    if (window.matchMedia("(prefers-reduced-transparency: reduce)").matches) {
      return;
    }

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

    const feSaturate = document.createElementNS(SVG_NS, "feColorMatrix");
    feSaturate.setAttribute("in", "frost");
    feSaturate.setAttribute("type", "saturate");
    feSaturate.setAttribute("values", String(saturate));
    feSaturate.setAttribute("result", "tuned");

    const feDisplacement = document.createElementNS(
      SVG_NS,
      "feDisplacementMap"
    );
    feDisplacement.setAttribute("in", "tuned");
    feDisplacement.setAttribute("in2", "map");
    feDisplacement.setAttribute("scale", String(scale));
    feDisplacement.setAttribute("xChannelSelector", "R");
    feDisplacement.setAttribute("yChannelSelector", "G");

    filter.append(feImage, feBlur, feSaturate, feDisplacement);
    svg.appendChild(filter);
    document.body.appendChild(svg);

    const sync = () => {
      const width = element.offsetWidth;
      const height = element.offsetHeight;
      if (!width || !height) return;

      const edge = Math.max(8, Math.min(width, height) * 0.25);
      const radius = Math.min(width, height) / 2 - edge;

      filter.setAttribute("width", String(width));
      filter.setAttribute("height", String(height));
      feImage.setAttribute("width", String(width));
      feImage.setAttribute("height", String(height));
      feImage.setAttribute("href", makeDisplacementMap(width, height, edge, radius));
      element.style.backdropFilter = `url(#${id})`;
    };

    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(element);

    return () => {
      observer.disconnect();
      element.style.backdropFilter = "";
      svg.remove();
    };
  }, [ref, scale, blur, saturate]);
}
