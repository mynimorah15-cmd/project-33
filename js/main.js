// GSAP required:
// <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
// Draggable plugin required:
// <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/Draggable.min.js"></script>
// <script src="js/main.js"></script>


document.addEventListener("DOMContentLoaded", () => {
  if (typeof window.gsap === "undefined") {
    console.warn("GSAP is not loaded. Add gsap.min.js before js/main.js.");
    return;
  }

  if (typeof window.Draggable === "undefined") {
    console.warn("GSAP Draggable is not loaded. Add Draggable.min.js before js/main.js.");
  }

  const CONFIG = {
    easeOut: "power3.out",
    easeSoft: "sine.inOut",
    easeBounce: "back.out(1.7)",
    easeSharp: "power2.inOut",
    intro: {
      environmentDelay: 0.1,
      starStagger: 0.14,
      yOffsetLarge: 80,
      yOffsetSmall: 28,
      rotationSmall: 8,
      scaleFrom: 0.82,
      dancerEntryX: 180
    },
    idle: {
      starFloatY: 10,
      starRotate: 6,
      figureFloatY: 10,
      floorOpacity: 0.84
    },
    parallax: {
      strengthX: 10,
      strengthY: 8,
      duration: 0.9
    },
    drag: {
      activeScale: 1.04,
      returnDuration: 0.9,
      overshootX: 18,
      overshootY: 14,
      danceRotate: 8
    },
    finale: {
      starBurstScale: 1.14,
      starBurstDuration: 0.4
    },
    spotlight: {
      opacity: 0.22,
      sweepX: 120,
      sweepRotate: 8,
      duration: 3.2
    },
    choreography: {
      intervalDelay: 8,
      bumpY: 18,
      bumpRotate: 5
    },
    floorClick: {
      jumpY: 34,
      sideX: 26,
      rotate: 14,
      scale: 1.08,
      reboundX: 14,
      reboundRotate: 8
    }
  };

  const svg = document.querySelector("#Layer_1");
  if (!svg) return;

  const byId = (id) => document.getElementById(id);
  const qa = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const existing = (items) => items.filter(Boolean);

  const dancefloor = byId("Dancefloor");
  const discoBall = byId("DiscoBall");
  const afroGirl = byId("Afrogirl");
  const afroMan = byId("Afroman");

  const environment = existing([dancefloor, discoBall]);
  const figures = existing([afroGirl, afroMan]);
  const stars = existing([
    byId("Star1"),
    byId("Star2"),
    byId("star3"),
    byId("Star4"),
    byId("DiscoStar1"),
    byId("DiscoStar2")
  ]);
  const allAnimatedGroups = existing([...environment, ...figures, ...stars]);

  if (!allAnimatedGroups.length) return;

  const figureIdleTweens = new Map();
  const dragInstances = [];
  let spotlightGroup = null;
  let spotlightBeamLeft = null;
  let spotlightBeamRight = null;
  let choreographyTimeline = null;
  let sceneReady = false;

  function q(selector, root = document) {
    return root.querySelector(selector);
  }

  function getBBoxSafe(el) {
    try {
      return el.getBBox();
    } catch (error) {
      return null;
    }
  }

  function centerFromBBox(el) {
    const box = getBBoxSafe(el);
    if (!box) return "50% 50%";
    return `${box.x + box.width / 2}px ${box.y + box.height / 2}px`;
  }

  function applySvgOrigin(el) {
    if (!el) return;
    gsap.set(el, {
      transformBox: "fill-box",
      transformOrigin: "50% 50%",
      svgOrigin: centerFromBBox(el)
    });
  }

  function applyOrigins(list) {
    list.forEach(applySvgOrigin);
  }

  function createSvgEl(tag, attrs = {}) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.entries(attrs).forEach(([key, value]) => {
      el.setAttribute(key, value);
    });
    return el;
  }

  function ensureDefs() {
    let defs = q("defs", svg);
    if (!defs) {
      defs = createSvgEl("defs");
      svg.insertBefore(defs, svg.firstChild);
    }
    return defs;
  }

  function createSpotlights() {
    const defs = ensureDefs();

    if (!q("#spotlightGradientLeft", defs)) {
      const gradientLeft = createSvgEl("linearGradient", {
        id: "spotlightGradientLeft",
        x1: "0%",
        y1: "0%",
        x2: "100%",
        y2: "100%"
      });

      gradientLeft.appendChild(createSvgEl("stop", { offset: "0%", "stop-color": "#ffffff", "stop-opacity": "0" }));
      gradientLeft.appendChild(createSvgEl("stop", { offset: "50%", "stop-color": "#ffffff", "stop-opacity": "0.6" }));
      gradientLeft.appendChild(createSvgEl("stop", { offset: "100%", "stop-color": "#ffffff", "stop-opacity": "0" }));
      defs.appendChild(gradientLeft);
    }

    if (!q("#spotlightGradientRight", defs)) {
      const gradientRight = createSvgEl("linearGradient", {
        id: "spotlightGradientRight",
        x1: "100%",
        y1: "0%",
        x2: "0%",
        y2: "100%"
      });

      gradientRight.appendChild(createSvgEl("stop", { offset: "0%", "stop-color": "#ffffff", "stop-opacity": "0" }));
      gradientRight.appendChild(createSvgEl("stop", { offset: "50%", "stop-color": "#ffffff", "stop-opacity": "0.6" }));
      gradientRight.appendChild(createSvgEl("stop", { offset: "100%", "stop-color": "#ffffff", "stop-opacity": "0" }));
      defs.appendChild(gradientRight);
    }

    spotlightGroup = createSvgEl("g", { id: "Spotlights" });

    spotlightBeamLeft = createSvgEl("polygon", {
      points: "430 100 780 1240 1080 1240 560 100",
      fill: "url(#spotlightGradientLeft)",
      opacity: "0"
    });

    spotlightBeamRight = createSvgEl("polygon", {
      points: "1650 100 1080 1240 1380 1240 1780 100",
      fill: "url(#spotlightGradientRight)",
      opacity: "0"
    });

    spotlightGroup.appendChild(spotlightBeamLeft);
    spotlightGroup.appendChild(spotlightBeamRight);

    const firstVisualChild = Array.from(svg.children).find(
      (child) => child.tagName.toLowerCase() !== "defs"
    );

    if (firstVisualChild) {
      svg.insertBefore(spotlightGroup, firstVisualChild);
    } else {
      svg.appendChild(spotlightGroup);
    }

    applyOrigins([spotlightBeamLeft, spotlightBeamRight]);

    // Let clicks pass through the decorative spotlights
    spotlightGroup.style.pointerEvents = "none";
    spotlightBeamLeft.style.pointerEvents = "none";
    spotlightBeamRight.style.pointerEvents = "none";
  }

  function setInitialState() {
    createSpotlights();
    applyOrigins(allAnimatedGroups);

    gsap.set(svg, { autoAlpha: 1 });
    gsap.set(environment, { autoAlpha: 0 });

    if (dancefloor) {
      gsap.set(dancefloor, {
        y: CONFIG.intro.yOffsetLarge,
        scaleY: 0.96
      });
    }

    if (discoBall) {
      gsap.set(discoBall, {
        autoAlpha: 0,
        y: -120,
        scale: 0.9,
        rotate: 0
      });
    }

    if (afroGirl) {
      gsap.set(afroGirl, {
        autoAlpha: 0,
        x: -CONFIG.intro.dancerEntryX,
        y: CONFIG.intro.yOffsetLarge,
        scale: 0.97,
        rotate: -6
      });
    }

    if (afroMan) {
      gsap.set(afroMan, {
        autoAlpha: 0,
        x: CONFIG.intro.dancerEntryX,
        y: CONFIG.intro.yOffsetLarge,
        scale: 0.97,
        rotate: 6
      });
    }

    gsap.set(stars, {
      autoAlpha: 0,
      scale: CONFIG.intro.scaleFrom,
      y: CONFIG.intro.yOffsetSmall
    });

    const discoStars = existing([byId("DiscoStar1"), byId("DiscoStar2")]);
    const outerStars = existing([byId("Star1"), byId("Star2"), byId("star3"), byId("Star4")]);

    gsap.set(discoStars, { rotate: -CONFIG.intro.rotationSmall });
    gsap.set(outerStars, { rotate: CONFIG.intro.rotationSmall });

    if (spotlightBeamLeft && spotlightBeamRight) {
      gsap.set([spotlightBeamLeft, spotlightBeamRight], {
        opacity: 0,
        scaleY: 0.92
      });
    }

    if (dancefloor) {
      dancefloor.style.cursor = "pointer";
    }
  }

  function buildShowTimeline() {
    const tl = gsap.timeline({
      defaults: { ease: CONFIG.easeOut },
      onComplete() {
        sceneReady = true;
        startChoreographyLoop();
      }
    });

    if (dancefloor) {
      tl.to(
        dancefloor,
        {
          autoAlpha: 1,
          y: 0,
          scaleY: 1,
          duration: 0.9
        },
        0
      );
    }

    if (spotlightBeamLeft && spotlightBeamRight) {
      tl.to(
        [spotlightBeamLeft, spotlightBeamRight],
        {
          opacity: CONFIG.spotlight.opacity,
          scaleY: 1,
          duration: 0.7,
          stagger: 0.06
        },
        0.05
      );
    }

    if (discoBall) {
      tl.to(
        discoBall,
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 1,
          ease: "elastic.out(1, 0.6)"
        },
        CONFIG.intro.environmentDelay
      );
    }

    if (afroGirl) {
      tl.to(
        afroGirl,
        {
          autoAlpha: 1,
          x: 0,
          y: 0,
          rotate: 0,
          scale: 1,
          duration: 1.1,
          ease: CONFIG.easeBounce
        },
        0.42
      );
    }

    if (afroMan) {
      tl.to(
        afroMan,
        {
          autoAlpha: 1,
          x: 0,
          y: 0,
          rotate: 0,
          scale: 1,
          duration: 1.1,
          ease: CONFIG.easeBounce
        },
        0.52
      );
    }

    if (stars.length) {
      tl.to(
        stars,
        {
          autoAlpha: 1,
          scale: 1,
          y: 0,
          rotate: 0,
          duration: 0.8,
          stagger: CONFIG.intro.starStagger,
          ease: CONFIG.easeBounce
        },
        0.95
      );
    }

    if (stars.length) {
      tl.to(
        stars,
        {
          scale: CONFIG.finale.starBurstScale,
          duration: CONFIG.finale.starBurstDuration,
          stagger: 0.05,
          yoyo: true,
          repeat: 1,
          ease: CONFIG.easeSharp
        },
        1.55
      );
    }

    if (figures.length) {
      tl.to(
        figures,
        {
          y: `-=${CONFIG.choreography.bumpY}`,
          duration: 0.26,
          stagger: 0.08,
          yoyo: true,
          repeat: 1,
          ease: CONFIG.easeSharp
        },
        1.7
      );
    }

    if (spotlightBeamLeft && spotlightBeamRight) {
      tl.to(
        spotlightBeamLeft,
        {
          x: -CONFIG.spotlight.sweepX,
          rotate: -CONFIG.spotlight.sweepRotate,
          duration: CONFIG.spotlight.duration,
          ease: CONFIG.easeSoft
        },
        0.85
      );

      tl.to(
        spotlightBeamRight,
        {
          x: CONFIG.spotlight.sweepX,
          rotate: CONFIG.spotlight.sweepRotate,
          duration: CONFIG.spotlight.duration,
          ease: CONFIG.easeSoft
        },
        0.85
      );
    }

    return tl;
  }

  function addDiscoBallMotion() {
    if (!discoBall) return;

    gsap.set(discoBall, {
      y: 0,
      rotate: 0
    });
  }

  function addStarIdleMotion() {
    stars.forEach((star, index) => {
      const direction = index % 2 === 0 ? 1 : -1;

      gsap.to(star, {
        y: direction * CONFIG.idle.starFloatY,
        rotate: direction * CONFIG.idle.starRotate,
        duration: 2.3 + index * 0.25,
        ease: CONFIG.easeSoft,
        repeat: -1,
        yoyo: true
      });

      gsap.to(star, {
        opacity: 0.75,
        duration: 0.9 + index * 0.1,
        ease: CONFIG.easeSoft,
        repeat: -1,
        yoyo: true,
        repeatDelay: 0.15 * index
      });
    });
  }

  function createFigureIdleTween(figure, index) {
    if (!figure) return null;

    const amount = index % 2 === 0 ? 1 : -1;

    return gsap.to(figure, {
      y: amount * CONFIG.idle.figureFloatY,
      duration: 2.8 + index * 0.35,
      ease: CONFIG.easeSoft,
      repeat: -1,
      yoyo: true,
      paused: false
    });
  }

  function addFigureIdleMotion() {
    figures.forEach((figure, index) => {
      const tween = createFigureIdleTween(figure, index);
      if (tween) {
        figureIdleTweens.set(figure, tween);
      }
    });
  }

  function pauseFigureIdle(figure) {
    const tween = figureIdleTweens.get(figure);
    if (tween) tween.pause();
  }

  function resumeFigureIdle(figure) {
    const tween = figureIdleTweens.get(figure);
    if (tween) tween.resume();
  }

  function addEnvironmentIdleMotion() {
    if (dancefloor) {
      gsap.set(dancefloor, {
        opacity: CONFIG.idle.floorOpacity,
        scaleY: 1
      });
    }
  }

  function addPointerParallax() {
    const targets = [
      { el: discoBall, x: 0.9, y: 0.7 },
      { el: afroGirl, x: 0.65, y: 0.55 },
      { el: afroMan, x: 0.65, y: 0.55 },
      { el: dancefloor, x: 0.35, y: 0.2 },
      { el: spotlightBeamLeft, x: 0.18, y: 0.08 },
      { el: spotlightBeamRight, x: 0.18, y: 0.08 },
      ...stars.map((star) => ({ el: star, x: 1.1, y: 0.9 }))
    ].filter((item) => item.el);

    if (!targets.length) return;

    window.addEventListener("mousemove", (event) => {
      const rect = svg.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const nx = (event.clientX - rect.left) / rect.width - 0.5;
      const ny = (event.clientY - rect.top) / rect.height - 0.5;

      targets.forEach(({ el, x, y }) => {
        if (dragInstances.some((instance) => instance.target === el && instance.isPressed)) {
          return;
        }

        gsap.to(el, {
          x: nx * CONFIG.parallax.strengthX * x,
          y: ny * CONFIG.parallax.strengthY * y,
          duration: CONFIG.parallax.duration,
          ease: CONFIG.easeSoft,
          overwrite: "auto"
        });
      });
    });
  }

  function addDiscoBallAccent() {
    if (!discoBall) return;

    const ballPieces = qa("path, polygon, polyline, ellipse, circle", discoBall);
    if (!ballPieces.length) return;

    gsap.to(ballPieces, {
      opacity: 0.82,
      duration: 0.8,
      ease: CONFIG.easeSoft,
      stagger: {
        each: 0.02,
        from: "center",
        repeat: -1,
        yoyo: true
      }
    });
  }

  function addSpotlightSweepLoop() {
    if (!spotlightBeamLeft || !spotlightBeamRight) return;

    gsap.to(spotlightBeamLeft, {
      x: -CONFIG.spotlight.sweepX,
      rotate: -CONFIG.spotlight.sweepRotate,
      duration: 3.6,
      repeat: -1,
      yoyo: true,
      ease: CONFIG.easeSoft
    });

    gsap.to(spotlightBeamRight, {
      x: CONFIG.spotlight.sweepX,
      rotate: CONFIG.spotlight.sweepRotate,
      duration: 3.6,
      repeat: -1,
      yoyo: true,
      ease: CONFIG.easeSoft
    });

    gsap.to([spotlightBeamLeft, spotlightBeamRight], {
      opacity: CONFIG.spotlight.opacity,
      duration: 1.8,
      repeat: -1,
      yoyo: true,
      ease: CONFIG.easeSoft
    });
  }

  function flashFloorOnly() {
    const tl = gsap.timeline();

    if (dancefloor) {
      tl.to(
        dancefloor,
        {
          opacity: 1,
          scaleY: 1.05,
          duration: 0.18,
          ease: "power2.out"
        },
        0
      ).to(
        dancefloor,
        {
          opacity: CONFIG.idle.floorOpacity,
          scaleY: 1,
          duration: 0.34,
          ease: "power2.inOut"
        },
        0.18
      );
    }

    return tl;
  }

  function flashFloorAndStars() {
    const tl = gsap.timeline();

    tl.add(flashFloorOnly(), 0);

    if (stars.length) {
      tl.to(
        stars,
        {
          scale: 1.16,
          opacity: 1,
          duration: 0.16,
          stagger: 0.03,
          ease: "power2.out"
        },
        0
      ).to(
        stars,
        {
          scale: 1,
          duration: 0.3,
          stagger: 0.03,
          ease: "power2.inOut"
        },
        0.16
      );
    }

    return tl;
  }

  function buildChoreographyBeat() {
    const activeFigures = figures.filter(
      (figure) => !dragInstances.some((instance) => instance.target === figure && instance.isPressed)
    );

    if (!activeFigures.length) return null;

    const tl = gsap.timeline();
    tl.add(flashFloorAndStars(), 0);

    activeFigures.forEach((figure, index) => {
      const direction = index % 2 === 0 ? -1 : 1;

      tl.to(
        figure,
        {
          y: `-=${CONFIG.choreography.bumpY}`,
          rotate: direction * CONFIG.choreography.bumpRotate,
          duration: 0.18,
          ease: "power2.out"
        },
        0
      ).to(
        figure,
        {
          y: 0,
          rotate: 0,
          duration: 0.28,
          ease: "power2.inOut"
        },
        0.18
      );

      tl.to(
        figure,
        {
          x: `+=${direction * 14}`,
          duration: 0.14,
          ease: "power1.out"
        },
        0.08
      ).to(
        figure,
        {
          x: 0,
          duration: 0.24,
          ease: "power1.inOut"
        },
        0.22
      );
    });

    if (spotlightBeamLeft && spotlightBeamRight) {
      tl.to(
        spotlightBeamLeft,
        {
          opacity: CONFIG.spotlight.opacity + 0.08,
          duration: 0.18,
          ease: "power2.out"
        },
        0
      ).to(
        spotlightBeamLeft,
        {
          opacity: CONFIG.spotlight.opacity,
          duration: 0.3,
          ease: "power2.inOut"
        },
        0.18
      );

      tl.to(
        spotlightBeamRight,
        {
          opacity: CONFIG.spotlight.opacity + 0.08,
          duration: 0.18,
          ease: "power2.out"
        },
        0
      ).to(
        spotlightBeamRight,
        {
          opacity: CONFIG.spotlight.opacity,
          duration: 0.3,
          ease: "power2.inOut"
        },
        0.18
      );
    }

    return tl;
  }

  function startChoreographyLoop() {
    if (choreographyTimeline) choreographyTimeline.kill();

    choreographyTimeline = gsap.timeline({
      repeat: -1,
      repeatDelay: CONFIG.choreography.intervalDelay
    });

    choreographyTimeline.call(() => {
      if (!sceneReady) return;
      buildChoreographyBeat();
    });
  }

  function danceBackToOrigin(figure) {
    const isGirl = figure === afroGirl;
    const direction = isGirl ? -1 : 1;

    return gsap.timeline({
      defaults: {
        overwrite: "auto"
      },
      onComplete: () => {
        gsap.set(figure, { x: 0, y: 0, rotate: 0, scale: 1 });
        resumeFigureIdle(figure);
      }
    })
      .to(figure, {
        scale: 1.06,
        rotate: direction * CONFIG.drag.danceRotate,
        x: direction * CONFIG.drag.overshootX,
        y: -CONFIG.drag.overshootY,
        duration: 0.18,
        ease: "power2.out"
      })
      .to(figure, {
        rotate: direction * -CONFIG.drag.danceRotate * 0.75,
        x: direction * -CONFIG.drag.overshootX * 0.6,
        y: 0,
        duration: 0.22,
        ease: "power2.inOut"
      })
      .to(figure, {
        x: 0,
        y: 0,
        rotate: 0,
        scale: 1,
        duration: CONFIG.drag.returnDuration,
        ease: "elastic.out(1, 0.7)"
      });
  }

  function triggerFloorDance() {
    const activeFigures = figures.filter(
      (figure) => !dragInstances.some((instance) => instance.target === figure && instance.isPressed)
    );

    if (!activeFigures.length) return;

    activeFigures.forEach((figure) => {
      pauseFigureIdle(figure);
      gsap.killTweensOf(figure);
    });

    const tl = gsap.timeline({
      defaults: {
        overwrite: "auto"
      },
      onComplete: () => {
        activeFigures.forEach((figure) => {
          gsap.set(figure, { x: 0, y: 0, rotate: 0, scale: 1 });
          resumeFigureIdle(figure);
        });
      }
    });

    // Floor and spotlight accents only — no star bounce here
    tl.add(flashFloorOnly(), 0);

    if (spotlightBeamLeft && spotlightBeamRight) {
      tl.to(
        [spotlightBeamLeft, spotlightBeamRight],
        {
          opacity: CONFIG.spotlight.opacity + 0.16,
          duration: 0.15,
          ease: "power2.out"
        },
        0
      ).to(
        [spotlightBeamLeft, spotlightBeamRight],
        {
          opacity: CONFIG.spotlight.opacity,
          duration: 0.32,
          ease: "power2.inOut"
        },
        0.15
      );
    }

    if (afroGirl) {
      tl.to(
        afroGirl,
        {
          y: -CONFIG.floorClick.jumpY,
          x: -CONFIG.floorClick.sideX,
          rotate: -CONFIG.floorClick.rotate,
          scale: CONFIG.floorClick.scale,
          duration: 0.16,
          ease: "power2.out"
        },
        0
      )
        .to(
          afroGirl,
          {
            y: 0,
            x: CONFIG.floorClick.reboundX,
            rotate: CONFIG.floorClick.reboundRotate,
            scale: 1.02,
            duration: 0.2,
            ease: "power2.inOut"
          },
          0.16
        )
        .to(
          afroGirl,
          {
            y: -CONFIG.floorClick.jumpY * 0.55,
            x: -CONFIG.floorClick.sideX * 0.6,
            rotate: -CONFIG.floorClick.rotate * 0.7,
            scale: CONFIG.floorClick.scale * 0.98,
            duration: 0.16,
            ease: "power2.out"
          },
          0.36
        )
        .to(
          afroGirl,
          {
            y: 0,
            x: 0,
            rotate: 0,
            scale: 1,
            duration: 0.28,
            ease: "power2.inOut"
          },
          0.52
        );
    }

    if (afroMan) {
      tl.to(
        afroMan,
        {
          y: -CONFIG.floorClick.jumpY,
          x: CONFIG.floorClick.sideX,
          rotate: CONFIG.floorClick.rotate,
          scale: CONFIG.floorClick.scale,
          duration: 0.16,
          ease: "power2.out"
        },
        0
      )
        .to(
          afroMan,
          {
            y: 0,
            x: -CONFIG.floorClick.reboundX,
            rotate: -CONFIG.floorClick.reboundRotate,
            scale: 1.02,
            duration: 0.2,
            ease: "power2.inOut"
          },
          0.16
        )
        .to(
          afroMan,
          {
            y: -CONFIG.floorClick.jumpY * 0.55,
            x: CONFIG.floorClick.sideX * 0.6,
            rotate: CONFIG.floorClick.rotate * 0.7,
            scale: CONFIG.floorClick.scale * 0.98,
            duration: 0.16,
            ease: "power2.out"
          },
          0.36
        )
        .to(
          afroMan,
          {
            y: 0,
            x: 0,
            rotate: 0,
            scale: 1,
            duration: 0.28,
            ease: "power2.inOut"
          },
          0.52
        );
    }
  }

  function addDraggableFigures() {
    if (typeof window.Draggable === "undefined") return;

    figures.forEach((figure) => {
      const instance = window.Draggable.create(figure, {
        type: "x,y",
        inertia: false,
        onPress() {
          pauseFigureIdle(figure);
          gsap.killTweensOf(figure);
          figure.style.cursor = "grabbing";

          gsap.to(figure, {
            scale: CONFIG.drag.activeScale,
            duration: 0.18,
            ease: CONFIG.easeOut,
            overwrite: "auto"
          });
        },
        onDrag() {
          gsap.to(figure, {
            rotate: this.deltaX * 0.08,
            duration: 0.12,
            ease: "power1.out",
            overwrite: "auto"
          });
        },
        onRelease() {
          figure.style.cursor = "grab";
          danceBackToOrigin(figure);
        }
      })[0];

      dragInstances.push(instance);
      figure.style.cursor = "grab";
      figure.style.pointerEvents = "auto";
    });

    window.addEventListener("mouseup", () => {
      figures.forEach((figure) => {
        figure.style.cursor = "grab";
      });
    });
  }

  function isFloorTarget(target) {
    if (!dancefloor || !target) return false;
    return target === dancefloor || (typeof target.closest === "function" && target.closest("#Dancefloor"));
  }

  function addFloorInteraction() {
    if (!dancefloor || !svg) return;

    // Listen on the SVG so clicks still work even if inner floor pieces are hit
    svg.addEventListener("click", (event) => {
      if (isFloorTarget(event.target)) {
        triggerFloorDance();
      }
    });
  }

  setInitialState();
  buildShowTimeline();
  addEnvironmentIdleMotion();
  addFigureIdleMotion();
  addStarIdleMotion();
  addDiscoBallMotion();
  addDiscoBallAccent();
  addPointerParallax();
  addSpotlightSweepLoop();
  addDraggableFigures();
  addFloorInteraction();
});