"use client";

import { ReactLenis } from "lenis/react";
import { useEffect } from "react";

export default function SmoothScroll({ children }) {
  useEffect(() => {
    document.documentElement.classList.add("lenis-enabled");

    return () => {
      document.documentElement.classList.remove("lenis-enabled");
    };
  }, []);

  return (
    <ReactLenis
      root
      options={{
        lerp: 0.085,
        duration: 1.2,
        smoothWheel: true,
        syncTouch: false,
        wheelMultiplier: 1,
        touchMultiplier: 1,
        autoRaf: true,
      }}
    >
      {children}
    </ReactLenis>
  );
}