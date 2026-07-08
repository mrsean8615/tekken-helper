const heroEyebrow = document.getElementById("comboEyebrow");
const heroTitle = document.getElementById("comboTitle");
const heroArt = document.getElementById("comboHeroArt");
const sectionList = document.getElementById("comboSections");
const backButton = document.getElementById("backButton");
const comboMain = document.querySelector(".combo-hero-main");

const storageKey = "tekken-helper-selected-character";
const profileStorageKey = "tekken-helper-selected-character-profile";

function normalizeCharacterData(payload) {
  return Array.isArray(payload?.characters) ? payload.characters : [];
}

function normalizeHeaderData(payload) {
  return Array.isArray(payload?.headers) ? payload.headers : [];
}

function normalizeComboData(payload) {
  return Array.isArray(payload?.combos) ? payload.combos : [];
}

function safeParseJson(value) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function readStoredProfile() {
  try {
    return safeParseJson(localStorage.getItem(profileStorageKey));
  } catch {
    return null;
  }
}

function readSelectedCharacterName() {
  try {
    return localStorage.getItem(storageKey) || "";
  } catch {
    return "";
  }
}

async function loadCharacters() {
  if (window.tekkenHelper?.readJson) {
    try {
      return normalizeCharacterData(
        await window.tekkenHelper.readJson("../data/character.json"),
      );
    } catch {
      return [];
    }
  }

  try {
    const response = await fetch("../data/character.json");
    if (!response.ok) {
      throw new Error(`Failed to load character data: ${response.status}`);
    }

    return normalizeCharacterData(await response.json());
  } catch {
    return [];
  }
}

async function loadHeaders() {
  if (window.tekkenHelper?.readJson) {
    try {
      return normalizeHeaderData(
        await window.tekkenHelper.readJson("../data/header.json"),
      );
    } catch {
      return [];
    }
  }

  try {
    const response = await fetch("../data/header.json");
    if (!response.ok) {
      throw new Error(`Failed to load header data: ${response.status}`);
    }

    return normalizeHeaderData(await response.json());
  } catch {
    return [];
  }
}

async function loadComboFile(dataFile) {
  if (!dataFile) {
    return { combos: [] };
  }

  if (window.tekkenHelper?.readJson) {
    try {
      return await window.tekkenHelper.readJson(`../data/${dataFile}`);
    } catch {
      return { combos: [] };
    }
  }

  try {
    const response = await fetch(`../data/${dataFile}`);
    if (!response.ok) {
      throw new Error(`Failed to load combo data: ${response.status}`);
    }

    return await response.json();
  } catch {
    return { combos: [] };
  }
}

function createBadge(label, value) {
  const badge = document.createElement("span");
  badge.className = "combo-badge";
  if (label) {
    badge.innerHTML = `${label} ${value}`;
    return badge;
  }
  if (typeof value === "number") {
    for (let i = 0; i < 5; i++) {
      if (i < value) {
        badge.innerHTML +=
          "<img class='combo-badge-star' src='../img/icons/n.png' alt='Filled Star'>";
      } else {
        badge.innerHTML +=
          "<img class='combo-badge-star' src='../img/icons/empty_star.png' alt='Empty Star'>";
      }
    }
  }

  return badge;
}

function createTokenNode(token) {
  if (typeof token === "string") {
    const text = document.createElement("span");
    text.className = "route-text";
    text.textContent = token;
    return text;
  }

  const chip = document.createElement("span");
  chip.className = `route-chip route-chip-${token.type || "text"}`;

  const icon = document.createElement("img");
  icon.src = `../img/icons/${token.icon}`;
  icon.alt = token.label || token.icon || "combo input";
  icon.loading = "lazy";
  icon.decoding = "async";
  icon.addEventListener(
    "error",
    () => {
      icon.remove();
      chip.textContent = token.label || token.icon || "?";
    },
    { once: true },
  );

  chip.append(icon);
  return chip;
}

function renderTokenLine(items, className) {
  const line = document.createElement("div");
  line.className = className;

  for (const item of items || []) {
    line.append(createTokenNode(item));
  }

  return line;
}

function renderHeaderValue(header) {
  if (!Array.isArray(header?.value)) {
    return null;
  }

  return renderTokenLine(header.value, "header-value");
}

function renderRoute(route) {
  return renderTokenLine(route, "combo-route");
}

function renderComboCard(combo, header, index) {
  const card = document.createElement("article");
  card.className = "combo-card";

  const indexRail = document.createElement("div");
  indexRail.className = "combo-index";

  const hoverRail = document.createElement("div");
  hoverRail.className = "combo-index-hover";

  const body = document.createElement("div");
  body.className = "combo-card-body";

  const topRow = document.createElement("div");
  topRow.className = "combo-card-top";

  const titleWrap = document.createElement("div");
  titleWrap.className = "combo-title-wrap";

  const comboName = document.createElement("h3");
  comboName.className = "combo-name";
  comboName.textContent = combo.name;

  titleWrap.append(comboName);
  indexRail.append(hoverRail);
  topRow.append(titleWrap);

  const metrics = document.createElement("div");
  metrics.className = "combo-metrics";
  metrics.append(
    createBadge("Damage", combo.damage ?? "-"),
    createBadge(null, combo.rating ?? "-"),
  );

  topRow.append(metrics);

  const route = renderRoute(combo.route);
  route.classList.add("combo-route-wrap");

  body.append(topRow, route);
  card.append(indexRail, body);
  return card;
}

function renderEmptyState(message) {
  const empty = document.createElement("div");
  empty.className = "empty-state";
  empty.textContent = message;
  return empty;
}

function renderHeroArt(character) {
  const art = document.createElement("div");
  art.className = "combo-hero-art-frame";

  const image = document.createElement("img");
  image.className = "combo-hero-image";
  image.src = `../img/chara/${character.render || character.image || ""}`;
  image.alt = `${character.fullname || character.name} render`;
  image.loading = "eager";
  image.decoding = "async";
  image.addEventListener(
    "error",
    () => {
      image.src = `../img/chara/${character.image || ""}`;
    },
    { once: true },
  );

  art.append(image);
  return art;
}

function groupCombosByHeader(combos) {
  const grouped = new Map();

  for (const combo of combos) {
    const headerId = combo.headerId ?? 0;
    if (!grouped.has(headerId)) {
      grouped.set(headerId, []);
    }

    grouped.get(headerId).push(combo);
  }

  return grouped;
}

function buildSection(header, combos) {
  const section = document.createElement("section");
  section.className = "combo-section";

  const heading = document.createElement("div");
  heading.className = "combo-section-heading";

  const title = document.createElement("h2");
  const titleText = header.value
    .map((item) => {
      if (typeof item !== "string") {
        return `
        <img class="header-icon" src="../img/icons/${item.icon}" alt="${item.label}">
        `;
      }

      return `<span class="route-text">${item}</span>`;
    })
    .join(" ");

  title.innerHTML = titleText;
  heading.append(title);

  section.append(heading);

  const comboGrid = document.createElement("div");
  comboGrid.className = "combo-grid";

  combos.forEach((combo, index) => {
    comboGrid.append(renderComboCard(combo, header, index));
  });

  section.append(comboGrid);
  return section;
}

async function init() {
  const characters = await loadCharacters();
  const selectedName = readSelectedCharacterName();
  const storedProfile = readStoredProfile();
  const character =
    characters.find((entry) => entry.name === selectedName) ||
    storedProfile ||
    characters[0];

  if (!character) {
    heroEyebrow.textContent = "Tekken 8 Helper";
    heroTitle.textContent = "No character selected";
    heroArt.replaceChildren();
    sectionList.replaceChildren(
      renderEmptyState("No character data was found."),
    );
    return;
  }

  try {
    localStorage.setItem(profileStorageKey, JSON.stringify(character));
  } catch {
    /* ignore storage failures */
  }

  heroEyebrow.textContent = character.name;
  heroTitle.textContent = character.fullname || character.name;
  heroArt.replaceChildren(renderHeroArt(character));
  comboMain.style.backgroundImage = `url('../img/background/${character.background}')`;
  document.title = `${character.fullname || character.name} | Tekken 8 Helper`;

  const [headers, comboData] = await Promise.all([
    loadHeaders(),
    loadComboFile(character.dataFile),
  ]);

  const combos = normalizeComboData(comboData);
  const groupedCombos = groupCombosByHeader(combos);
  const fragment = document.createDocumentFragment();
  const usedHeaderIds = new Set();

  if (combos.length === 0) {
    sectionList.replaceChildren(
      renderEmptyState(
        `No combos were found for ${character.fullname || character.name}.`,
      ),
    );
    return;
  }

  for (const header of headers) {
    const comboItems = groupedCombos.get(header.headerId);
    if (!comboItems?.length) {
      continue;
    }

    fragment.append(buildSection(header, comboItems));
    usedHeaderIds.add(header.headerId);
  }

  for (const [headerId, comboItems] of groupedCombos.entries()) {
    if (usedHeaderIds.has(headerId)) {
      continue;
    }

    fragment.append(
      buildSection({ headerId, name: `Header ${headerId}` }, comboItems),
    );
  }

  sectionList.replaceChildren(fragment);
}

backButton.addEventListener("click", () => {
  window.location.href = "../index.html";
});

const stickyHeader = document.querySelector(".combo-hero-row");
const stickyPoint = stickyHeader.offsetTop;

window.addEventListener("scroll", () => {
  if (window.scrollY > stickyPoint) {
    stickyHeader.classList.add("is-stuck");
  } else {
    stickyHeader.classList.remove("is-stuck");
  }
});

init();
