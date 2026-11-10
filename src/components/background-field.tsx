"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * A drifting field of points in the background.
 *
 * Deliberately cheap: no loaders, no textures, no post-processing, no
 * shadows, no controls. One BufferGeometry, one ShaderMaterial, a few
 * hundred points, and a single draw call per frame.
 *
 * It loads only in the browser, only after the page has painted, and it
 * stops entirely when the tab is hidden or the reader has asked for less
 * motion.
 */
export function BackgroundField({ className }: { className?: string }) {
  const hostRef = React.useRef<HTMLDivElement>(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return;

    // No WebGL, no point downloading a renderer.
    try {
      const probe = document.createElement("canvas");
      const gl = probe.getContext("webgl2") ?? probe.getContext("webgl");
      if (!gl) return;
    } catch {
      return;
    }

    let cleanup = () => {};
    let cancelled = false;

    // The renderer is a few hundred kilobytes, so it is fetched only once
    // the browser has nothing better to do. It never competes with the
    // page's own scripts or fonts.
    const whenIdle =
      "requestIdleCallback" in window
        ? (fn: () => void) =>
            window.requestIdleCallback(fn, { timeout: 2000 })
        : (fn: () => void) => window.setTimeout(fn, 200);

    whenIdle(() => {
      import("three")
      .then((THREE) => {
        if (cancelled) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
          55,
          window.innerWidth / window.innerHeight,
          0.1,
          100,
        );
        camera.position.set(0, 0, 12);

        const renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: false,
          powerPreference: "low-power",
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.domElement.style.width = "100%";
        renderer.domElement.style.height = "100%";
        host.appendChild(renderer.domElement);

        // The palette follows the active theme.
        const readAccent = () => {
          const raw = getComputedStyle(document.documentElement)
            .getPropertyValue("--color-accent")
            .trim();
          try {
            return new THREE.Color(raw);
          } catch {
            return new THREE.Color("#4759b7");
          }
        };
        const accent = readAccent();

        // A sparse lattice, gently displaced. Low contrast on purpose: this
        // is texture, not decoration.
        const COLS = 26;
        const ROWS = 16;
        const count = COLS * ROWS;

        const positions = new Float32Array(count * 3);
        const phases = new Float32Array(count);
        const scales = new Float32Array(count);

        let i = 0;
        for (let x = 0; x < COLS; x++) {
          for (let y = 0; y < ROWS; y++) {
            positions[i * 3] = (x / (COLS - 1) - 0.5) * 26;
            positions[i * 3 + 1] = (y / (ROWS - 1) - 0.5) * 16;
            positions[i * 3 + 2] = 0;
            phases[i] = (x * 0.7 + y * 1.3) % (Math.PI * 2);
            scales[i] = 0.55 + ((x * 13 + y * 7) % 10) / 22;
            i++;
          }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute(
          "position",
          new THREE.BufferAttribute(positions, 3),
        );
        geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
        geometry.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));

        const material = new THREE.ShaderMaterial({
          uniforms: {
            uTime: { value: 0 },
            uColor: { value: accent },
            uPixelRatio: { value: Math.min(window.devicePixelRatio, 1.5) },
          },
          vertexShader: `
            attribute float aPhase;
            attribute float aScale;
            uniform float uTime;
            uniform float uPixelRatio;
            varying float vFade;

            void main() {
              vec3 p = position;
              p.z += sin(uTime * 0.22 + aPhase) * 0.9;
              p.x += cos(uTime * 0.14 + aPhase * 1.7) * 0.35;

              vec4 mv = modelViewMatrix * vec4(p, 1.0);
              gl_Position = projectionMatrix * mv;

              gl_PointSize = aScale * uPixelRatio * (44.0 / -mv.z);
              // Points at the edges fade out, so the field has no border.
              vFade = smoothstep(13.0, 5.0, abs(p.x)) * smoothstep(8.0, 2.5, abs(p.y));
            }
          `,
          fragmentShader: `
            uniform vec3 uColor;
            varying float vFade;

            void main() {
              // A soft round point, no texture.
              float d = length(gl_PointCoord - vec2(0.5));
              if (d > 0.5) discard;
              float alpha = smoothstep(0.5, 0.08, d) * vFade * 0.16;
              gl_FragColor = vec4(uColor, alpha);
            }
          `,
          transparent: true,
          depthWrite: false,
          depthTest: false,
        });

        const points = new THREE.Points(geometry, material);
        scene.add(points);

        const clock = new THREE.Clock();
        let frame = 0;
        let running = true;

        const resize = () => {
          const w = window.innerWidth;
          const h = window.innerHeight;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
          renderer.setSize(w, h);
          material.uniforms.uPixelRatio.value = Math.min(
            window.devicePixelRatio,
            1.5,
          );
        };

        const render = () => {
          if (!running) return;
          material.uniforms.uTime.value = clock.getElapsedTime();
          renderer.render(scene, camera);
          frame = requestAnimationFrame(render);
        };

        const onVisibility = () => {
          if (document.hidden) {
            running = false;
            cancelAnimationFrame(frame);
          } else if (!running) {
            running = true;
            clock.getElapsedTime();
            render();
          }
        };

        window.addEventListener("resize", resize);
        document.addEventListener("visibilitychange", onVisibility);
        resize();
        setReady(true);
        render();

        cleanup = () => {
          running = false;
          cancelAnimationFrame(frame);
          window.removeEventListener("resize", resize);
          document.removeEventListener("visibilitychange", onVisibility);
          geometry.dispose();
          material.dispose();
          renderer.dispose();
          if (renderer.domElement.parentNode === host) {
            host.removeChild(renderer.domElement);
          }
        };
      })
      .catch(() => {
        // No WebGL, or the chunk failed: the page is unaffected.
      });
    });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed inset-0 -z-10 opacity-0 transition-opacity duration-700",
        ready && "opacity-100",
        className,
      )}
    />
  );
}
