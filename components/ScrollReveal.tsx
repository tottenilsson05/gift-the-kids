"use client";

import { useEffect } from "react";

/**
 * One IntersectionObserver for the whole page. Adds `.is-shown` to every
 * `.reveal` container as it scrolls into view; CSS handles the staggered
 * item/divider animations. No animation library needed.
 */
export default function ScrollReveal() {
  useEffect(() => {
    // Tell the inline safety script in <head> that reveals are working.
    document.documentElement.dataset.reveal = "ready";
    const els = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    const showAll = () => els.forEach((el) => el.classList.add("is-shown"));

    if (typeof IntersectionObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      showAll();
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-shown");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 },
    );
    els.forEach((el) => io.observe(el));

    // Printing should always include everything
    window.addEventListener("beforeprint", showAll);

    return () => {
      io.disconnect();
      window.removeEventListener("beforeprint", showAll);
    };
  }, []);

  return null;
}
