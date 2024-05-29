import { ref, reactive, watch, onMounted, onBeforeUnmount } from 'vue';
import Matter, { Render, Body, Bodies, World, Runner, Events, Engine, Query, MouseConstraint, Composites, Common, Vector } from 'matter-js';
import { useResizeObserver } from '@vueuse/core';
import MatterWrap from 'matter-wrap';
import { midi, playKey } from '#/use/midi';
import { Note } from 'tonal';

Matter.use(MatterWrap);

let engine;
let renderer;

const canvas = ref(null);
const initiated = ref(false);
const running = ref(false)
const box = reactive({ w: 100, h: 100 })

export function useMatter() {

  const setupMatterJs = () => {
    resizeBox()
    useResizeObserver(canvas, resizeBox)
    engine = Engine.create();
    engine.gravity.scale = 0;

    renderer = Render.create({
      element: canvas.value,
      engine: engine,
      options: {
        width: box.w,
        height: box.h,
        background: "transparent",
        wireframes: false,
        pixelRatio: window.devicePixelRatio,
      },
    });

    Runner.run(engine);
    Render.run(renderer);
  };

  const clearMatterJs = () => {
    Events.off(engine);
    World.clear(engine?.world);
    Engine.clear(engine);
    Render.stop(renderer);
    renderer?.canvas?.remove();
  };

  onMounted(() => {
    if (initiated.value) return;
    initiated.value = true;
    setupMatterJs();
    const { center } = useCenter()
    const { circles } = useCircles()
  });

  onBeforeUnmount(() => {
    clearMatterJs();
  });

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      clearMatterJs();
    });
  }

  return {
    canvas,
  };
}

/* RESIZE BOX */

function resizeBox() {
  const { width, height } = canvas.value.getBoundingClientRect();
  box.w = width
  box.h = height
  if (!renderer) return
  Render.setPixelRatio(renderer, window.devicePixelRatio);
  renderer.options.width = width;
  renderer.options.height = height;
  Render.lookAt(renderer, {
    min: { x: 0, y: 0 },
    max: { x: width, y: height },
  });
}

/* Circles */

function useCircles() {
  const mouseControl = MouseConstraint.create(engine, {
    element: canvas.value,
    constraint: {
      render: { visible: false },
    },
  });

  World.add(engine.world, [mouseControl]);

  const circles = Composites.stack();

  Events.on(engine, 'afterUpdate', () => {
    circles.bodies.forEach(circle => {
      const forceX = box.w / 2 - circle.position.x;
      const forceY = box.h / 2 - circle.position.y;

      // Apply a small force towards the center
      const strength = 0.01; // Adjust this value to control the pull strength
      Body.applyForce(circle, circle.position, { x: forceX * strength, y: forceY * strength });
    })
  })

  function createShape(x, y, note = Math.floor(Common.random(50, 100))) {
    const strokeStyle = `hsl(${((note + 3) % 12) * 30}deg, ${(note + 3)}%, 50%)`;

    const circle = Bodies.circle(x, y, 120 - note, {
      frictionAir: 0.0000008,
      density: 10,
      restitution: 0.98,
      render: {
        lineWidth: 2,
        strokeStyle,
        fillStyle: 'transparent'
      },
      plugin: {
        wrap: {
          min: { x: 0, y: 0 },
          max: { x: box.w, y: box.h },
        },
      },
    });
    circle.data = { note };
    return circle;
  };

  Events.on(mouseControl, 'mousemove', ({ mouse }) => {
    const hoveredShapes = Query.point(circles.bodies, mouse.position);
    hoveredShapes.forEach((shape) => { shape.scale = 1.1; });
  });

  Events.on(mouseControl, 'mousedown', ({ mouse }) => {
    const hoveredShapes = Query.point(circles.bodies, mouse.position);
    if (hoveredShapes.length > 0) return
    const shape = createShape(mouse.position.x, mouse.position.y);
    circles.bodies.push(shape);
    World.add(engine.world, shape);
  });

  Events.on(engine, 'collisionStart', (event) => {
    for (const pair of event.pairs) {
      for (let body of ['bodyA', 'bodyB']) {
        if (!pair[body]?.data) continue
        const hitBody = pair[body]
        const originalStyle = hitBody.render.strokeStyle;
        if (hitBody.render.fillStyle != 'transparent') continue;

        hitBody.render.fillStyle = originalStyle;
        const note = Note.fromMidi(hitBody.data?.note)

        playKey(note.slice(0, -1), parseInt(note.slice(-1)) - 4, false, 1, 0.5)

        setTimeout(() => {
          hitBody.render.fillStyle = 'transparent'
          playKey(note.slice(0, -1), parseInt(note.slice(-1)) - 4, true)
        }, 30);
      }

    }
  });

  return {
    circles
  }
}


/* CENTER SHAPE */

function useCenter() {

  const center = Bodies.polygon(box.w / 2, box.h / 2, 3, Math.min(box.w / 4, box.h / 4), {
    isStatic: true,
    restitution: 100,
    render: {
      lineWidth: 0,
      strokeStyle: 'yellow',
      fillStyle: 'yellow',
      visible: true,
    },
  });

  World.add(engine?.world, [center]);

  watch(box, ({ w, h }) => {
    Body.setPosition(center, { x: w / 2, y: h / 2 });
  })


  let time = 0;
  Events.on(engine, 'afterUpdate', () => {
    time += 0.001;
    Body.rotate(center, 0.01);
  })


  return {
    running,
    center
  }
}
