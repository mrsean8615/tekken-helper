import pkg from "../package.json" with { type: "json" };

const grid = document.getElementById("characterGrid");
const updateStatus = document.querySelector(".update-status");
const storageKey = "tekken-helper-selected-character";
const profileStorageKey = "tekken-helper-selected-character-profile";

function normalizeCharacterData(payload) {
  return Array.isArray(payload?.characters) ? payload.characters : [];
}

function getBrowserFallbackData() {
  return {
    characters: [
      {
        name: "Lili",
        fullname: "Emilie De Rochefort",
        image: "lili.png",
        dataFile: "lili.json",
      },
      {
        name: "Alisa",
        fullname: "Alisa Bosconovitch",
        image: "alisa.png",
        dataFile: "alisa.json",
      },
    ],
  };
}

async function loadCharacters() {
  if (window.tekkenHelper?.readJson) {
    try {
      return normalizeCharacterData(
        await window.tekkenHelper.readJson("data/character.json"),
      );
    } catch {
      return normalizeCharacterData(getBrowserFallbackData());
    }
  }

  try {
    const response = await fetch("data/character.json");
    if (!response.ok) {
      throw new Error(`Failed to load character data: ${response.status}`);
    }

    return normalizeCharacterData(await response.json());
  } catch {
    return normalizeCharacterData(getBrowserFallbackData());
  }
}

function readSelectedCharacter() {
  try {
    return localStorage.getItem(storageKey) || "";
  } catch {
    return "";
  }
}

function writeSelectedCharacter(character) {
  try {
    localStorage.setItem(storageKey, character.name);
    localStorage.setItem(profileStorageKey, JSON.stringify(character));
  } catch {
    return;
  }
}

function setSelectedState(name) {
  document.querySelectorAll(".card").forEach((card) => {
    card.classList.toggle("is-selected", card.dataset.characterName === name);
    card.setAttribute(
      "aria-pressed",
      card.dataset.characterName === name ? "true" : "false",
    );
  });
}

function setUpdateStatus(message) {
  if (!updateStatus) {
    return;
  }

  updateStatus.textContent = message;
}

function createCharacterCard(character, selectedName) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "card";
  button.dataset.characterName = character.name;
  button.setAttribute(
    "aria-label",
    `Open combo page for ${character.fullname || character.name}`,
  );
  button.setAttribute(
    "aria-pressed",
    character.name === selectedName ? "true" : "false",
  );

  if (character.name === selectedName) {
    button.classList.add("is-selected");
  }

  const portrait = document.createElement("div");
  portrait.className = "card-portrait";

  const image = document.createElement("img");
  image.src = `img/chara/${character.image}`;
  image.alt = `${character.name} portrait`;
  image.loading = "lazy";
  image.decoding = "async";
  image.addEventListener(
    "error",
    () => {
      const fallback = document.createElement("div");
      fallback.className = "card-fallback";
      fallback.textContent = character.name.charAt(0).toUpperCase();
      image.replaceWith(fallback);
    },
    { once: true },
  );

  portrait.append(image);

  const name = document.createElement("h3");
  name.className = "card-name";
  name.textContent = character.name;

  button.append(portrait, name);
  button.addEventListener("click", () => {
    writeSelectedCharacter(character);
    setSelectedState(character.name);
    window.location.href = "./pages/combo.html";
  });

  return button;
}

async function init() {
  if (window.tekkenHelper?.getUpdateStatus) {
    const currentStatus = await window.tekkenHelper.getUpdateStatus();
    setUpdateStatus(currentStatus);
  }

  if (window.tekkenHelper?.onUpdateStatus) {
    window.tekkenHelper.onUpdateStatus((message) => {
      setUpdateStatus(message);
    });
  }

  const characters = await loadCharacters();
  const selectedName = readSelectedCharacter();
  const fragment = document.createDocumentFragment();

  for (const character of characters) {
    fragment.append(createCharacterCard(character, selectedName));
  }

  grid.replaceChildren(fragment);
  setSelectedState(selectedName);
}

init();

if (updateStatus && !updateStatus.textContent) {
  setUpdateStatus("Checking for updates...");
}

document.querySelector(".version_number").textContent = `v${pkg.version}`;

const hasElectronBridge = Boolean(window.tekkenHelper?.onUpdateStatus);

if (updateStatus && !hasElectronBridge) {
  updateStatus.style.display = "none";
} else if (hasElectronBridge) {
  window.tekkenHelper.onUpdateStatus((message) => {
    setUpdateStatus(message);
  });
}
