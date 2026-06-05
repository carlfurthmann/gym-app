/**
 * Gradual edge blur (ported from React GradualBlur).
 * Uses stacked backdrop-filter masks — no WebGL required.
 */
(function () {
  const DEFAULT_CONFIG = {
    position: "bottom",
    strength: 2,
    height: "6rem",
    width: null,
    divCount: 5,
    exponential: false,
    zIndex: 1000,
    animated: false,
    duration: "0.3s",
    easing: "ease-out",
    opacity: 1,
    curve: "linear",
    responsive: false,
    target: "parent",
    hoverIntensity: null,
    className: "",
    style: {}
  };

  const PRESETS = {
    top: { position: "top", height: "6rem" },
    bottom: { position: "bottom", height: "6rem" },
    left: { position: "left", height: "6rem" },
    right: { position: "right", height: "6rem" },
    subtle: { height: "4rem", strength: 1, opacity: 0.8, divCount: 3 },
    intense: { height: "10rem", strength: 4, divCount: 8, exponential: true },
    smooth: { height: "8rem", curve: "bezier", divCount: 10 },
    sharp: { height: "5rem", curve: "linear", divCount: 4 },
    header: { position: "top", height: "8rem", curve: "ease-out" },
    footer: { position: "bottom", height: "8rem", curve: "ease-out" },
    sidebar: { position: "left", height: "6rem", strength: 2.5 },
    "page-header": { position: "top", height: "10rem", target: "page", strength: 3 },
    "page-footer": { position: "bottom", height: "10rem", target: "page", strength: 3 }
  };

  const CURVE_FUNCTIONS = {
    linear: (p) => p,
    bezier: (p) => p * p * (3 - 2 * p),
    "ease-in": (p) => p * p,
    "ease-out": (p) => 1 - Math.pow(1 - p, 2),
    "ease-in-out": (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2)
  };

  function mergeConfigs(...configs) {
    return configs.reduce((acc, c) => ({ ...acc, ...c }), {});
  }

  function getGradientDirection(position) {
    const directions = {
      top: "to top",
      bottom: "to bottom",
      left: "to left",
      right: "to right"
    };
    return directions[position] || "to bottom";
  }

  function resolveResponsiveValue(config, key) {
    if (!config.responsive) return config[key];
    const w = window.innerWidth;
    const cap = key.charAt(0).toUpperCase() + key.slice(1);
    if (w <= 480 && config["mobile" + cap]) return config["mobile" + cap];
    if (w <= 768 && config["tablet" + cap]) return config["tablet" + cap];
    if (w <= 1024 && config["desktop" + cap]) return config["desktop" + cap];
    return config[key];
  }

  window.createGradualBlur = function createGradualBlur(parentEl, props) {
    if (!parentEl) return { dispose() {}, element: null };

    const presetConfig = props?.preset && PRESETS[props.preset] ? PRESETS[props.preset] : {};
    const config = mergeConfigs(DEFAULT_CONFIG, presetConfig, props || {});
    let disposed = false;
    let isHovered = false;
    let isVisible = config.animated !== "scroll";

    const root = document.createElement("div");
    root.className = `gradual-blur gradual-blur-${config.target === "page" ? "page" : "parent"} ${config.className || ""}`.trim();
    root.dataset.position = config.position;
    root.setAttribute("aria-hidden", "true");

    const inner = document.createElement("div");
    inner.className = "gradual-blur-inner";
    root.appendChild(inner);

    function applyContainerStyle() {
      const isVertical = ["top", "bottom"].includes(config.position);
      const isHorizontal = ["left", "right"].includes(config.position);
      const isPageTarget = config.target === "page";
      const height = resolveResponsiveValue(config, "height");
      const width = resolveResponsiveValue(config, "width");

      const style = {
        position: isPageTarget ? "fixed" : "absolute",
        pointerEvents: config.hoverIntensity ? "auto" : "none",
        opacity: isVisible ? String(config.opacity) : "0",
        zIndex: String(isPageTarget ? config.zIndex + 100 : config.zIndex),
        transition: config.animated ? `opacity ${config.duration} ${config.easing}` : undefined,
        ...config.style
      };

      if (isVertical) {
        style.height = height;
        style.width = width || "100%";
        style[config.position] = "0";
        style.left = "0";
        style.right = "0";
      } else if (isHorizontal) {
        style.width = width || height;
        style.height = "100%";
        style[config.position] = "0";
        style.top = "0";
        style.bottom = "0";
      }

      Object.assign(root.style, style);
    }

    function rebuildBlurLayers() {
      inner.innerHTML = "";
      const increment = 100 / config.divCount;
      const currentStrength =
        isHovered && config.hoverIntensity ? config.strength * config.hoverIntensity : config.strength;
      const curveFunc = CURVE_FUNCTIONS[config.curve] || CURVE_FUNCTIONS.linear;
      const direction = getGradientDirection(config.position);

      for (let i = 1; i <= config.divCount; i++) {
        let progress = i / config.divCount;
        progress = curveFunc(progress);

        let blurValue;
        if (config.exponential) {
          blurValue = Math.pow(2, progress * 4) * 0.0625 * currentStrength;
        } else {
          blurValue = 0.0625 * (progress * config.divCount + 1) * currentStrength;
        }

        const p1 = Math.round((increment * i - increment) * 10) / 10;
        const p2 = Math.round(increment * i * 10) / 10;
        const p3 = Math.round((increment * i + increment) * 10) / 10;
        const p4 = Math.round((increment * i + increment * 2) * 10) / 10;
        let gradient = `transparent ${p1}%, black ${p2}%`;
        if (p3 <= 100) gradient += `, black ${p3}%`;
        if (p4 <= 100) gradient += `, transparent ${p4}%`;

        const layer = document.createElement("div");
        Object.assign(layer.style, {
          position: "absolute",
          inset: "0",
          maskImage: `linear-gradient(${direction}, ${gradient})`,
          WebkitMaskImage: `linear-gradient(${direction}, ${gradient})`,
          backdropFilter: `blur(${blurValue.toFixed(3)}rem)`,
          WebkitBackdropFilter: `blur(${blurValue.toFixed(3)}rem)`,
          transition:
            config.animated && config.animated !== "scroll"
              ? `backdrop-filter ${config.duration} ${config.easing}`
              : undefined
        });
        inner.appendChild(layer);
      }

      const tint = document.createElement("div");
      tint.className = "gradual-blur-tint";
      inner.appendChild(tint);
    }

    applyContainerStyle();
    rebuildBlurLayers();
    parentEl.appendChild(root);

    let observer = null;
    if (config.animated === "scroll") {
      observer = new IntersectionObserver(
        ([entry]) => {
          isVisible = entry.isIntersecting;
          applyContainerStyle();
        },
        { threshold: 0.1 }
      );
      observer.observe(root);
    }

    let resizeHandler = null;
    if (config.responsive) {
      resizeHandler = () => {
        applyContainerStyle();
        rebuildBlurLayers();
      };
      window.addEventListener("resize", resizeHandler);
    }

    if (config.hoverIntensity) {
      root.addEventListener("mouseenter", () => {
        isHovered = true;
        rebuildBlurLayers();
      });
      root.addEventListener("mouseleave", () => {
        isHovered = false;
        rebuildBlurLayers();
      });
    }

    return {
      element: root,
      dispose() {
        if (disposed) return;
        disposed = true;
        observer?.disconnect();
        if (resizeHandler) window.removeEventListener("resize", resizeHandler);
        root.remove();
      },
      update(nextProps) {
        Object.assign(config, nextProps || {});
        applyContainerStyle();
        rebuildBlurLayers();
      }
    };
  };

  window.initPageGradualBlur = function initPageGradualBlur(options) {
    const opts = options || {};
    const enabled = opts.enabled !== false;
    const parentEl = document.getElementById("gradualBlurLayer") || document.body;
    if (window.pageGradualBlur) {
      window.pageGradualBlur.dispose();
      window.pageGradualBlur = null;
    }
    if (!enabled) return null;

    const shared = {
      target: "page",
      opacity: opts.opacity ?? 1,
      zIndex: opts.zIndex ?? 4,
      divCount: 8,
      curve: "bezier",
      exponential: true
    };

    window.pageGradualBlur = {
      top: createGradualBlur(parentEl, {
        ...shared,
        preset: "page-header",
        position: "top",
        height: opts.topHeight || "11rem",
        strength: opts.strength ?? 4.5
      }),
      bottom: createGradualBlur(parentEl, {
        ...shared,
        preset: "page-footer",
        position: "bottom",
        height: opts.bottomHeight || "11rem",
        strength: opts.strength ?? 4.5
      }),
      dispose() {
        this.top?.dispose();
        this.bottom?.dispose();
        window.pageGradualBlur = null;
      }
    };
    return window.pageGradualBlur;
  };
})();
