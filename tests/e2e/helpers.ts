import type { Page } from "@playwright/test";

export const MOBILE = { width: 375, height: 812 };
export const DESKTOP = { width: 1280, height: 720 };

/**
 * Wait until the camera has stopped moving.
 *
 * Every measurement in these specs is a comparison of two boxes on screen, and
 * the camera reaches its resting place through a spring — so measuring on
 * `load`, or after a fixed sleep, tests whichever frame happened to be up. This
 * watches React Flow's own viewport transform instead and returns once it has
 * been identical for several polls running, which is the only signal the app
 * offers that the animation is over.
 */
export async function settle(page: Page) {
  await page.waitForSelector(".react-flow__node");
  // Cleared first: this is called again after a click, and a leftover count
  // from the previous settle would report "stopped" before the click's own
  // animation had started.
  await page.evaluate(() => {
    delete (window as { __settle?: unknown }).__settle;
  });
  await page.waitForFunction(
    () => {
      const el = document.querySelector<HTMLElement>(".react-flow__viewport");
      if (!el) return false;
      const w = window as { __settle?: { at: string; still: number } };
      const at = el.style.transform;
      if (w.__settle?.at === at) w.__settle.still += 1;
      else w.__settle = { at, still: 0 };
      return w.__settle.still >= 5;
    },
    null,
    { polling: 100, timeout: 30_000 },
  );
}

/**
 * Any card currently mounted, and its id.
 *
 * Which titles are in the DOM at all depends on the camera: React Flow is told
 * to render only what is on screen, so naming a card in a test pins the camera
 * as a side effect and the test starts failing for a reason it was never about.
 * These specs are about what happens when you open *a* card, so they ask the
 * page which ones there are.
 */
export async function onscreenCard(page: Page) {
  const id = await page.evaluate(
    () =>
      document.querySelector<HTMLElement>(".react-flow__node")?.dataset.id ??
      null,
  );
  if (!id) throw new Error("the map rendered no cards");
  return { id, locator: page.locator(`.react-flow__node[data-id="${id}"]`) };
}

export type Geometry = {
  /** The chrome sheet's box: on a phone it floats over the bottom of the map. */
  chrome: { top: number; bottom: number; height: number };
  nodes: { id: string; top: number; bottom: number; height: number }[];
  edges: number;
};

/** Where every rendered card sits relative to the chrome covering the map. */
export function geometry(page: Page): Promise<Geometry> {
  return page.evaluate(() => {
    const aside = document.querySelector("aside")!.getBoundingClientRect();
    const nodes = [
      ...document.querySelectorAll<HTMLElement>(".react-flow__node"),
    ].map((node) => {
      const box = node.getBoundingClientRect();
      return {
        id: node.dataset.id ?? "",
        top: box.top,
        bottom: box.bottom,
        height: box.height,
      };
    });
    return {
      chrome: { top: aside.top, bottom: aside.bottom, height: aside.height },
      nodes,
      edges: document.querySelectorAll(".react-flow__edge-path").length,
    };
  });
}
