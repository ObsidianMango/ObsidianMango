"use strict";

const storageKey = "dplan2.plan.v1";
const minGuests = 1;
const maxGuests = 250;
const durations = ["1–2 hr", "3–4 hr", "5+ hr"];
const levels = [
  { value: "off", name: "Skip", percent: 0 },
  { value: "normal", name: "Standard", percent: 100 },
  { value: "heavy", name: "+50%", percent: 150 },
  { value: "extreme", name: "Double", percent: 200 },
];
const drinks = [
  { type: "wine", title: "Wine", rates: [29, 50, 60], units: ["bottle", "bottles"] },
  { type: "spirits", title: "Spirits", rates: [4, 6, 8], units: ["bottle", "bottles"] },
  { type: "beer", title: "Beer", rates: [90, 150, 180], units: ["can or bottle", "cans or bottles"] },
];

const kegs = [
  { name: "Mini Keg", short: "Mini", gallons: 1.32, ounces: 169, height: 9.875, diameter: 6.75, dimensions: "9⅞″ × 6¾″", weight: 13 },
  { name: "Cornelius", short: "Cornelius", gallons: 5, ounces: 640, height: 23, diameter: 9, dimensions: "23″ × 9″", weight: 49 },
  { name: "Sixth Barrel", short: "Sixth Barrel", gallons: 5.16, ounces: 661, height: 23.375, diameter: 9.25, dimensions: "23⅜″ × 9¼″", weight: 58 },
  { name: "Quarter Barrel", short: "Quarter Barrel", gallons: 7.75, ounces: 992, height: 13.875, diameter: 16.125, dimensions: "13⅞″ × 16⅛″", weight: 87 },
  { name: "Slim Quarter", short: "Slim Quarter", gallons: 7.75, ounces: 992, height: 23.375, diameter: 11.125, dimensions: "23⅜″ × 11⅛″", weight: 87 },
  { name: "Half Barrel", short: "Half Barrel", gallons: 15.5, ounces: 1984, height: 23.375, diameter: 16.125, dimensions: "23⅜″ × 16⅛″", weight: 161 },
];

const byId = (id) => document.getElementById(id);
const guestInput = byId("guests");
const guestSlider = byId("guest-slider");
const fewerGuests = byId("fewer-guests");
const moreGuests = byId("more-guests");
const resetButton = byId("reset");
const copyButton = byId("copy");
const copyLabel = byId("copy-label");
const shopKegs = byId("shop-kegs");
const drinkSettings = byId("drink-settings");
const durationInputs = Array.from(document.querySelectorAll('input[name="duration"]'));
const navLinks = Array.from(document.querySelectorAll(".nav a"));

function defaultPlan() {
  return { guests: 25, duration: 0, mix: { wine: "normal", spirits: "normal", beer: "normal" } };
}

function clampGuests(value) {
  return Math.min(maxGuests, Math.max(minGuests, value));
}

function readPlan() {
  const defaults = defaultPlan();
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (!saved) return defaults;
    if (Number.isInteger(saved.guests)) defaults.guests = clampGuests(saved.guests);
    if (Number.isInteger(saved.duration) && durations[saved.duration]) defaults.duration = saved.duration;
    for (const { type } of drinks) {
      const value = saved.mix?.[type];
      if (levels.some((level) => level.value === value)) defaults.mix[type] = value;
    }
  } catch {
    // Keep the planner usable when storage is unavailable.
  }
  return defaults;
}

let plan = readPlan();
let selectedKeg = null;
let activePage = null;
let copyTimer;

function plural(count, one, many = one + "s") {
  return count === 1 ? one : many;
}

function quantity(drink) {
  const { percent } = levels.find(({ value }) => value === plan.mix[drink.type]);
  return Math.ceil((plan.guests * drink.rates[plan.duration] * percent) / 10000);
}

function shoppingList() {
  return drinks.map((drink) => {
    const count = quantity(drink);
    return { title: drink.title, count, unit: plural(count, ...drink.units) };
  }).filter(({ count }) => count > 0);
}

function planSummary() {
  return `${plan.guests} ${plural(plan.guests, "guest")} · ${durations[plan.duration]}`;
}

function beerCount() {
  return quantity(drinks[2]);
}

function buildDrinkSettings() {
  drinkSettings.innerHTML = drinks.map(({ type, title }) => `
    <div class="drink-setting" data-type="${type}">
      <span class="drink-label" id="mix-title-${type}">${title}</span>
      <div class="mix-options" role="radiogroup" aria-labelledby="mix-title-${type}">
        ${levels.map(({ value, name }) => `
          <label class="mix-option" data-level="${value}">
            <input type="radio" name="mix-${type}" value="${value}">
            <span class="mix-tile">
              <span class="mix-art" aria-hidden="true">
                ${value === "off" ? '<span class="mix-none"></span>'
                  : `<img src="../dplan/${type}-${value}.png" alt="" decoding="async">`}
              </span>
              ${name}
              <span class="mix-mark" aria-hidden="true"></span>
            </span>
          </label>
        `).join("")}
      </div>
    </div>
  `).join("");

  drinkSettings.addEventListener("change", (event) => {
    const input = event.target;
    const { type } = input.closest(".drink-setting").dataset;
    plan.mix[type] = input.value;
    savePlan();
  });
}

function renderPlan({ preserveInput = false } = {}) {
  if (!preserveInput) guestInput.value = plan.guests;
  guestSlider.value = plan.guests;
  fewerGuests.disabled = plan.guests === minGuests;
  moreGuests.disabled = plan.guests === maxGuests;
  for (const input of durationInputs) input.checked = Number(input.value) === plan.duration;

  for (const row of drinkSettings.children) {
    const amount = plan.mix[row.dataset.type];
    for (const input of row.querySelectorAll("input")) input.checked = input.value === amount;
  }

  const items = shoppingList();
  byId("shopping-summary").textContent = planSummary();
  byId("shopping-items").innerHTML = items.map(({ title, count, unit }) => `
    <li>
      <span>${title}</span>
      <span class="shopping-amount"><strong>${count}</strong> <small>${unit}</small></span>
    </li>
  `).join("");
  byId("empty-list").hidden = items.length > 0;
  copyButton.disabled = items.length === 0;
  shopKegs.hidden = beerCount() === 0;

  const defaults = defaultPlan();
  resetButton.disabled = plan.guests === defaults.guests && plan.duration === defaults.duration
    && drinks.every(({ type }) => plan.mix[type] === defaults.mix[type]);
}

function savePlan(options) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(plan));
  } catch {
    // The current plan can still be used and copied.
  }
  clearTimeout(copyTimer);
  copyLabel.textContent = "Copy list";
  renderPlan(options);
  if (activePage === "kegs") renderKegDetail();
}

function setGuests(value, options) {
  plan.guests = clampGuests(value);
  savePlan(options);
}

guestInput.addEventListener("input", () => {
  if (/^\d+$/.test(guestInput.value)) {
    setGuests(Number(guestInput.value), { preserveInput: true });
  }
});

guestSlider.addEventListener("input", () => setGuests(guestSlider.valueAsNumber));

guestInput.addEventListener("blur", () => { guestInput.value = plan.guests; });
guestInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") guestInput.blur();
  if (event.key === "ArrowUp" || event.key === "ArrowDown") {
    event.preventDefault();
    setGuests(plan.guests + (event.key === "ArrowUp" ? 1 : -1));
  }
});

fewerGuests.addEventListener("click", () => setGuests(plan.guests - 1));
moreGuests.addEventListener("click", () => setGuests(plan.guests + 1));
for (const input of durationInputs) {
  input.addEventListener("change", () => {
    plan.duration = Number(input.value);
    savePlan();
  });
}

resetButton.addEventListener("click", () => {
  plan = defaultPlan();
  selectedKeg = null;
  savePlan();
  guestInput.focus();
  byId("status").textContent = "Plan reset.";
});

copyButton.addEventListener("click", async () => {
  const text = [
    `Drink Planner · ${planSummary()}`,
    ...shoppingList().map(({ title, count, unit }) => `${title}: ${count} ${unit}`),
  ].join("\n");
  try {
    await navigator.clipboard.writeText(text);
    copyLabel.textContent = "Copied!";
    byId("status").textContent = "Shopping list copied.";
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => { copyLabel.textContent = "Copy list"; }, 2200);
  } catch {
    const dialog = byId("copy-dialog");
    const field = byId("copy-text");
    field.value = text;
    if (!dialog.open) dialog.showModal();
    field.focus();
    field.select();
  }
});

function servings(keg, ounces = 12) {
  return Math.floor(keg.ounces / ounces);
}

function bestKegIndex(needed) {
  if (!needed) return 2;
  const firstFit = kegs.findIndex((keg) => servings(keg) >= needed);
  return firstFit === -1 ? kegs.length - 1 : firstFit;
}

function kegIllustration(keg) {
  const scale = 2.85;
  const width = keg.diameter * scale;
  const height = keg.height * scale;
  const center = width / 2;
  const rim = Math.max(4, width * .16);
  const top = rim / 2 + 3;
  const bottom = height - rim / 2 + 1;
  const edge = width - 2;
  const radius = center - 2;
  const fitting = width * .21;

  return `<svg class="kegsvg" width="${width}" height="${height + 5}"
    viewBox="0 0 ${width} ${height + 5}" aria-hidden="true" focusable="false">
    <path class="kegbody" d="M2 ${top} V${bottom} Q2 ${height + 3} ${center} ${height + 3}
      Q${edge} ${height + 3} ${edge} ${bottom} V${top}"/>
    <ellipse class="kegshade" cx="${center}" cy="${top}" rx="${radius}" ry="${rim / 2}"/>
    <path class="kegline" d="M2 ${bottom - 2} Q${center} ${height + 1} ${edge} ${bottom - 2}"/>
    <path class="kegfine" d="M4 ${top + 5} Q${center} ${top + rim + 4} ${edge - 2} ${top + 5}
      M4 ${bottom - 6} Q${center} ${bottom + 1} ${edge - 2} ${bottom - 6}"/>
    <rect class="kegbody" x="${center - fitting / 2}" y="1" width="${fitting}" height="4" rx="1.5"/>
  </svg>`;
}

function buildKegs() {
  byId("keg-options").innerHTML = kegs.map((keg, index) => `
    <button class="keg-option" type="button" data-keg="${index}"
      aria-label="${keg.name}" aria-controls="keg-detail" aria-pressed="false">
      ${kegIllustration(keg)}<span>${keg.short}</span>
    </button>
  `).join("");

  byId("keg-comparison").innerHTML = kegs.map((keg) => `
    <tr><th scope="row">${keg.name}</th><td>${keg.gallons}</td>
      <td>${servings(keg)}</td><td>${servings(keg, 16)}</td></tr>
  `).join("");

  byId("keg-options").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-keg]");
    if (!button) return;
    selectedKeg = Number(button.dataset.keg);
    renderKegDetail();
    const keg = kegs[selectedKeg];
    byId("status").textContent = `${keg.name}. ${servings(keg)} twelve-ounce servings.`;
  });
}

function renderKegDetail() {
  const needed = beerCount();
  const index = selectedKeg ?? bestKegIndex(needed);
  const keg = kegs[index];
  document.querySelectorAll(".keg-option").forEach((button) => {
    button.setAttribute("aria-pressed", String(Number(button.dataset.keg) === index));
  });

  byId("keg-summary").textContent = needed
    ? `Your plan calls for ${needed} ${plural(needed, "beer")}.`
    : "Servings per keg are based on a 12 oz pour.";
  byId("selected-keg").textContent = keg.name;
  byId("keg-capacity").textContent = `${keg.gallons} gal capacity`;
  byId("keg-servings").textContent = servings(keg);
  byId("keg-pints").textContent = servings(keg, 16);
  byId("keg-dimensions").textContent = keg.dimensions;
  byId("keg-weight").textContent = `~${keg.weight} lb`;

  const fit = byId("keg-fit");
  fit.hidden = needed === 0;
  const capacity = servings(keg);
  const kegCount = Math.ceil(needed / capacity);
  if (kegCount > 1) {
    fit.textContent = `You’d need ${kegCount} of this size for your plan.`;
  } else if (index === bestKegIndex(needed)) {
    fit.textContent = "Smallest single keg that covers your plan.";
  } else {
    fit.textContent = "One keg covers your plan.";
  }
}

function renderPage({ focus = false } = {}) {
  const page = location.hash === "#kegs" ? "kegs" : "planner";
  if (page === activePage) return;
  activePage = page;

  byId("planner-view").hidden = page !== "planner";
  byId("kegs-view").hidden = page !== "kegs";
  for (const link of navLinks) {
    if (link.hash === "#" + page) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }

  if (page === "kegs") renderKegDetail();
  if (focus) {
    window.scrollTo(0, 0);
    byId(page + "-title").focus({ preventScroll: true });
  }
}

shopKegs.addEventListener("click", () => {
  selectedKeg = null;
});

const listCard = byId("shopping-list");
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(([entry]) => {
    byId("quick-list").hidden = entry.isIntersecting;
  }, { rootMargin: "0px 0px -68px 0px" });
  observer.observe(listCard);
}

byId("jump-to-list").addEventListener("click", () => {
  byId("shopping-title").focus({ preventScroll: true });
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  listCard.scrollIntoView({ behavior: reducedMotion ? "instant" : "smooth", block: "start" });
});

document.querySelector(".wordmark").addEventListener("click", () => {
  if (activePage === "planner") window.scrollTo(0, 0);
});

window.addEventListener("hashchange", () => renderPage({ focus: true }));
buildDrinkSettings();
buildKegs();
renderPlan();
renderPage();
