import { chromium } from "playwright";

const URL = process.env.MAP_URL ?? "http://localhost:3100";
const OUT = process.env.OUT_DIR ?? ".";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** React-controlled inputs ignore a plain .value assignment. */
function setInput([sel, val]) {
  const el = document.querySelector(sel);
  const proto = Object.getPrototypeOf(el);
  Object.getOwnPropertyDescriptor(proto, "value").set.call(el, String(val));
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

function clickByText(text) {
  const b = [...document.querySelectorAll("button")].find((n) =>
    n.textContent.trim().toLowerCase().includes(text.toLowerCase()),
  );
  if (!b) throw new Error("no button: " + text);
  b.click();
}

function wheel([dx, dy]) {
  const p = document.querySelector(".react-flow__pane");
  const r = p.getBoundingClientRect();
  p.dispatchEvent(
    new WheelEvent("wheel", {
      deltaX: dx,
      deltaY: dy,
      clientX: r.left + r.width / 2,
      clientY: r.top + r.height / 2,
      bubbles: true,
      cancelable: true,
    }),
  );
}

/** Union box of the highlighted (non-dimmed) cards, and the pane it sits in. */
function litBox() {
  const p = document.querySelector(".react-flow__pane").getBoundingClientRect();
  const lit = [...document.querySelectorAll(".react-flow__node")].filter(
    (n) =>
      n.firstElementChild &&
      +getComputedStyle(n.firstElementChild).opacity > 0.9,
  );
  if (!lit.length) return null;
  const b = lit.map((n) => n.getBoundingClientRect());
  return {
    ids: lit.map((n) => n.dataset.id),
    cx:
      (Math.min(...b.map((x) => x.left)) + Math.max(...b.map((x) => x.right))) /
      2,
    cy:
      (Math.min(...b.map((x) => x.top)) + Math.max(...b.map((x) => x.bottom))) /
      2,
    px: p.left + p.width / 2,
    py: p.top + p.height / 2,
  };
}

/** Nudge the camera until the lit cards sit in the middle of the pane. */
async function frame(page, { horizontal = true } = {}) {
  let box = null;
  for (let i = 0; i < 10; i++) {
    box = await page.evaluate(litBox);
    if (!box) return null;
    const dx = horizontal ? box.cx - box.px : 0;
    const dy = box.cy - box.py;
    if (Math.abs(dx) < 12 && Math.abs(dy) < 12) return box;
    const clamp = (v) => Math.max(-200, Math.min(200, v));
    await page.evaluate(wheel, [clamp(dx), clamp(dy)]);
    await sleep(200);
  }
  return box;
}

const browser = await chromium.launch({ channel: "chrome" });

// ── 1. Doomsday, with its watch-first chain lit ───────────────────────────
{
  const page = await browser.newPage({
    viewport: { width: 1600, height: 900 },
    deviceScaleFactor: 2,
  });
  await page.goto(URL, { waitUntil: "networkidle" });
  await sleep(1500);

  // Unreleased titles are on by default; only click if something turned it off.
  await page.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find(
      (n) => n.textContent.trim() === "Unreleased",
    );
    if (b && b.getAttribute("aria-pressed") !== "true") b.click();
  });
  await sleep(400);

  // Climb the timeline until the 2026 row exists in the DOM.
  for (let i = 0; i < 25; i++) {
    if (await page.$('.react-flow__node[data-id="avengers-doomsday"]')) break;
    await page.evaluate(wheel, [0, -300]);
    await sleep(160);
  }
  await page.click('.react-flow__node[data-id="avengers-doomsday"]');
  await sleep(700);

  await page.evaluate(setInput, ["input[type=range]", 130]);
  await sleep(800);
  const box = await frame(page);
  await sleep(1000);

  await page.screenshot({ path: `${OUT}/doomsday-chain.png` });
  console.log("doomsday-chain.png ·", box?.ids.join(", "));
  await page.close();
}

// ── 2. Wolverine traced across the Fox run ────────────────────────────────
for (const shot of [
  {
    name: "wolverine-trace",
    width: 1200,
    height: 1500,
    zoom: 150,
    horizontal: false,
  },
  {
    name: "wolverine-trace-wide",
    width: 1600,
    height: 900,
    zoom: 110,
    horizontal: false,
  },
]) {
  const page = await browser.newPage({
    viewport: { width: shot.width, height: shot.height },
    deviceScaleFactor: 2,
  });
  await page.goto(URL, { waitUntil: "networkidle" });
  await sleep(1500);

  await page.evaluate(clickByText, "Character view");
  await sleep(500);
  await page.evaluate(setInput, [
    'input[placeholder*="haracter"]',
    "Wolverine",
  ]);
  await sleep(700);
  await page.evaluate(() => {
    const row = [...document.querySelectorAll("button")].find(
      (b) =>
        b.textContent.includes("Wolverine") &&
        b.textContent.includes("Earth-10005"),
    );
    if (!row) throw new Error("no Wolverine row");
    row.click();
  });
  await sleep(800);

  await page.evaluate(setInput, ["input[type=range]", shot.zoom]);
  await sleep(800);
  const box = await frame(page, { horizontal: shot.horizontal });
  await sleep(1000);

  await page.screenshot({ path: `${OUT}/${shot.name}.png` });
  console.log(`${shot.name}.png ·`, box?.ids.join(", "));
  await page.close();
}

await browser.close();
