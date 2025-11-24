// ---------- CONFIG ----------

const MAP_IMAGES = ["mountview.png", "riverhills.png"];
const FRIEND_IMAGES = [
  "Group 4.png",
  "Group 5.png",
  "Group 7.png",
  "Group 8.png",
  "Group 9.png",
  "Group 10.png",
  "Group 11.png",
  "Group 12.png",
  "Group 17.png",
  "Group 18.png",
  "Group 19.png",
  "Group 20.png",
  "Group 21.png",
  "Group 22.png"
]; // individual PNGs for each child sprite
const ZONES_ROWS = 3; // 3×3 coarse grid
const ZONES_COLS = 3;
const MAX_PLACEMENTS = 6; // limit to six friends placed
const HAIR_OPTIONS = [
  { id: "hair-black-long", label: "Hair A", icon: "black long hair.png" },
  { id: "hair-black-short", label: "Hair B", icon: "black short hair.png" },
  { id: "hair-brown-curly", label: "Hair C", icon: "brown curly hair.png" },
  { id: "hair-brown-short", label: "Hair D", icon: "brown short her.png" },
  { id: "hair-brown-bangs", label: "Hair H", icon: "brown hair bangs.png" },
  { id: "hair-blonde", label: "Hair E", icon: "blonde hair.png" },
  { id: "hair-blonde-male", label: "Hair F", icon: "blonde male hair.png" },
  { id: "hair-hijab", label: "Hair G", icon: "hijab.png" }
];
const GIFT_OPTIONS = [
  { id: "gift-book", label: "Gift A", icon: "book.png" },
  { id: "gift-card", label: "Gift B", icon: "happy birthday card.png" },
  { id: "gift-lego", label: "Gift C", icon: "lego.png" },
  { id: "gift-balloons", label: "Gift D", icon: "ballons.png" },
  { id: "gift-soccer", label: "Gift E", icon: "soccer.png" },
  { id: "gift-needoh", label: "Gift F", icon: "needoh.png" },
  { id: "gift-karaoke", label: "Gift G", icon: "kareoke.png" },
  { id: "gift-none", label: "Gift None", icon: "switch.png" }
];
const FOOD_OPTIONS = [
  { id: "food-spaghetti", label: "Food A", icon: "spaghetti.png" },
  { id: "food-pineapple", label: "Food B", icon: "pineappleboat.png" },
  { id: "food-thali", label: "Food C", icon: "ethopian.png" },
  { id: "food-wrap", label: "Food D", icon: "burrito.png" },
  { id: "food-ramen", label: "Food F", icon: "ramen.png" },
  { id: "food-hummus", label: "Food G", icon: "hummus.png" },
  { id: "food-waffles", label: "Food E", icon: "waffles.png" },
  { id: "food-injera", label: "Food H", icon: "ethiopian bread.png" }
];
const CLOTHING_OPTIONS = [
  { id: "clothes-constructor", label: "Clothes A", icon: "constructor.png" },
  { id: "clothes-doctor", label: "Clothes B", icon: "doctor.png" },
  { id: "clothes-labcoat", label: "Clothes F", icon: "labcoat.png" },
  { id: "clothes-chef", label: "Clothes C", icon: "chef.png" },
  { id: "clothes-shirt", label: "Clothes D", icon: "button down.png" },
  { id: "clothes-suit", label: "Clothes E", icon: "scholar.png" },
  { id: "clothes-service", label: "Clothes G", icon: "serviceclothes.png" }
];

// ---------- STATE ----------

const friends = FRIEND_IMAGES.map((spriteSrc, idx) => ({
  id: idx,
  spriteSrc,
  placed: false,
  mapX: null, // normalized 0–1
  mapY: null, // normalized 0–1
  zoneRow: null,
  zoneCol: null,
  selectToPlaceMs: null,
  hairId: null,
  giftId: null,
  foodId: null,
  clothesId: null
}));

let activeFriendId = null;
let selectionStartMs = null;
let currentMapImg = null;
let partyShown = false;
let animeModule = null;

// ---------- DOM HELPERS ----------

function $(sel) {
  return document.querySelector(sel);
}

document.addEventListener("DOMContentLoaded", () => {
  activeFriendId = 0; // default select first friend for easier placement
  selectionStartMs = performance.now();
  initMap();
  renderFriendsTray();
  renderOptionTrays();
  attachHandlers();
  startAnimations();
});

// ---------- MAP SETUP ----------

function initMap() {
  const map = $("#map");

  currentMapImg = "map-left+map-right";
  map.style.backgroundImage = `url("${MAP_IMAGES[0]}"), url("${MAP_IMAGES[1]}")`;
  map.style.backgroundSize = "50% 100%, 50% 100%";
  map.style.backgroundPosition = "left center, right center";
  map.style.backgroundRepeat = "no-repeat, no-repeat";
}

// ---------- FRIENDS TRAY RENDER ----------

function renderFriendsTray() {
  const tray = $("#friendsTray");
  tray.innerHTML = "";

  friends.forEach(friend => {
    const card = document.createElement("div");
    card.className = "friend-card";
    if (activeFriendId === friend.id) card.classList.add("selected");

    const sprite = makeFriendSprite(friend.spriteSrc);
    card.appendChild(sprite);

    const label = document.createElement("div");
    label.className = "friend-label";
    label.textContent = `Friend ${friend.id + 1}`;
    card.appendChild(label);

    const status = document.createElement("div");
    status.className = "friend-label friend-status";
    status.textContent = friend.placed ? "Placed" : "Not placed";
    card.appendChild(status);

    card.addEventListener("click", () => {
      activeFriendId = friend.id;
      selectionStartMs = performance.now();
      renderFriendsTray();
      renderOptionTrays();
    });

    tray.appendChild(card);
  });

  renderFriendsOnMap();
}

function makeFriendSprite(spriteSrc) {
  const img = document.createElement("img");
  img.className = "friend-sprite";
  img.src = spriteSrc;
  img.alt = "Friend icon";
  return img;
}

// ---------- MAP INTERACTION ----------

function attachHandlers() {
  const map = $("#map");
  const copyBtn = $("#copyBtn");
  const downloadBtn = $("#downloadBtn");
  const nextFriendBtn = $("#nextFriendBtn");
  const resetBtn = $("#resetBtn");
  const closePartyBtn = $("#closePartyBtn");

  map.addEventListener("click", (event) => {
    if (activeFriendId === null) {
      activeFriendId = 0;
      renderFriendsTray();
      renderOptionTrays();
    }

    const rect = map.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    placeFriendOnMap(activeFriendId, x, y, map.clientWidth, map.clientHeight);
  });

  copyBtn.addEventListener("click", copyMetricsToClipboard);
  downloadBtn.addEventListener("click", downloadMetricsJson);
  nextFriendBtn.addEventListener("click", goToNextFriend);
  resetBtn.addEventListener("click", resetGame);
  closePartyBtn.addEventListener("click", hidePartyModal);
}

function placeFriendOnMap(friendId, x, y, mapWidth, mapHeight) {
  const friend = friends.find(f => f.id === friendId);
  if (!friend) return;

  const placedCount = friends.filter(f => f.placed).length;
  const isNewPlacement = !friend.placed;
  if (isNewPlacement && placedCount >= MAX_PLACEMENTS) {
    showTempStatus(`Only ${MAX_PLACEMENTS} friends can be placed. Move an existing friend if needed.`, true);
    return;
  }

  const clampedX = Math.max(0, Math.min(x, mapWidth));
  const clampedY = Math.max(0, Math.min(y, mapHeight));
  const mapXNorm = clampedX / mapWidth;
  const mapYNorm = clampedY / mapHeight;

  const zoneRow = Math.min(ZONES_ROWS - 1, Math.floor(mapYNorm * ZONES_ROWS));
  const zoneCol = Math.min(ZONES_COLS - 1, Math.floor(mapXNorm * ZONES_COLS));

  const now = performance.now();
  const duration = selectionStartMs ? Math.round(now - selectionStartMs) : null;

  friend.mapX = mapXNorm;
  friend.mapY = mapYNorm;
  friend.zoneRow = zoneRow;
  friend.zoneCol = zoneCol;
  friend.placed = true;
  friend.selectToPlaceMs = duration;

  // keep them selected for easy reposition; reset timer for next move
  selectionStartMs = performance.now();

  renderFriendsTray();
  animateJustPlaced(friendId);

  const totalPlaced = friends.filter(f => f.placed).length;
  if (totalPlaced >= MAX_PLACEMENTS && !partyShown) {
    showPartyModal();
    partyShown = true;
  }
}

function renderFriendsOnMap() {
  const map = $("#map");
  map.querySelectorAll(".map-friend").forEach(node => node.remove());

  friends.forEach(friend => {
    if (!friend.placed || friend.mapX === null || friend.mapY === null) return;

    const marker = document.createElement("button");
    marker.type = "button";
    marker.className = "map-friend";
    marker.dataset.friendId = String(friend.id);
    if (activeFriendId === friend.id) marker.classList.add("active");

    const hat = document.createElement("div");
    hat.className = "party-hat";
    marker.appendChild(hat);

    const sprite = makeFriendSprite(friend.spriteSrc);
    marker.appendChild(sprite);

    const badges = document.createElement("div");
    badges.className = "badge-strip";
    [friend.hairId, friend.clothesId, friend.giftId, friend.foodId].forEach(key => {
      if (!key) return;
      const opt = findOptionById(key);
      if (!opt || !opt.icon) return;
      const img = document.createElement("img");
      img.src = opt.icon;
      img.alt = "";
      badges.appendChild(img);
    });
    if (badges.children.length) {
      marker.appendChild(badges);
    }

    marker.style.left = `${friend.mapX * 100}%`;
    marker.style.top = `${friend.mapY * 100}%`;
    marker.setAttribute("aria-label", `Friend ${friend.id + 1} placed on map`);

    marker.addEventListener("click", (event) => {
      event.stopPropagation();
      activeFriendId = friend.id;
      selectionStartMs = performance.now();
      renderFriendsTray();
      renderOptionTrays();
    });

    map.appendChild(marker);
  });

  // update party lineup if visible
  const modal = document.getElementById("partyModal");
  if (modal && !modal.classList.contains("hidden")) {
    showPartyModal();
  }

  // re-init draggable after markers are re-rendered
  // drag disabled for now
}

function animateJustPlaced(friendId) {
  const map = $("#map");
  const marker = Array.from(map.querySelectorAll(".map-friend")).find(el => {
    return parseInt(el.dataset.friendId || "-1", 10) === friendId;
  });

  if (marker) {
    marker.classList.add("just-placed");
    setTimeout(() => marker.classList.remove("just-placed"), 400);
  }
}

// ---------- METRICS / EXPORT ----------

function getMetrics() {
  return {
    mapImage: currentMapImg,
    placements: friends.map(f => ({
      id: f.id,
      spriteSrc: f.spriteSrc,
      placed: f.placed,
      mapX_norm: f.mapX,
      mapY_norm: f.mapY,
      zoneRow: f.zoneRow,
      zoneCol: f.zoneCol,
      selectToPlaceMs: f.selectToPlaceMs,
      hairId: f.hairId,
      giftId: f.giftId,
      foodId: f.foodId,
      clothesId: f.clothesId
    }))
  };
}

async function copyMetricsToClipboard() {
  try {
    await navigator.clipboard.writeText(JSON.stringify(getMetrics(), null, 2));
    showTempStatus("Copied JSON to clipboard");
  } catch (err) {
    console.error("Copy failed", err);
    showTempStatus("Copy blocked; try Download JSON", true);
  }
}

function downloadMetricsJson() {
  const blob = new Blob([JSON.stringify(getMetrics(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "birthday-bash-placements.json";
  a.click();
  URL.revokeObjectURL(url);
}

function showTempStatus(text, isError = false) {
  // Simple transient status near controls for quick feedback.
  let statusEl = document.getElementById("statusMessage");
  if (!statusEl) {
    statusEl = document.createElement("div");
    statusEl.id = "statusMessage";
    statusEl.style.marginTop = "6px";
    statusEl.style.fontSize = "13px";
    document.getElementById("controls").appendChild(statusEl);
  }
  statusEl.textContent = text;
  statusEl.style.color = isError ? "#c62828" : "#1b5e20";
  clearTimeout(statusEl._timeout);
  statusEl._timeout = setTimeout(() => {
    statusEl.textContent = "";
  }, 1600);
}

// ---------- OPTION PICKERS ----------

function renderOptionTrays() {
  renderOptionTray("hairOptions", HAIR_OPTIONS, "hairId");
  renderOptionTray("giftOptions", GIFT_OPTIONS, "giftId");
  renderOptionTray("foodOptions", FOOD_OPTIONS, "foodId");
  renderOptionTray("clothesOptions", CLOTHING_OPTIONS, "clothesId");
}

function renderOptionTray(containerId, options, field) {
  const tray = document.getElementById(containerId);
  if (!tray) return;
  tray.innerHTML = "";

  options.forEach(opt => {
    const pill = document.createElement("div");
    pill.className = "option-pill";
    pill.dataset.field = field;
    pill.dataset.optionId = opt.id;

    const applied = activeFriendId !== null && friends[activeFriendId][field] === opt.id;
    const usedElsewhere = isOptionUsedByAnotherFriend(field, opt.id, activeFriendId);
    if (applied) pill.classList.add("selected");
    if (usedElsewhere) pill.classList.add("disabled");

    if (opt.icon) {
      const img = document.createElement("img");
      img.src = opt.icon;
      img.alt = opt.label;
      pill.appendChild(img);
    }

    const label = document.createElement("div");
    label.className = "label";
    label.textContent = opt.label;
    pill.appendChild(label);

    pill.addEventListener("click", () => {
      if (activeFriendId === null) {
        showTempStatus("Select a friend first.", true);
        return;
      }
      if (isOptionUsedByAnotherFriend(field, opt.id, activeFriendId)) {
        showTempStatus("That item is already picked for another friend.", true);
        return;
      }
      friends[activeFriendId][field] = opt.id;
      renderOptionTrays();
    });

    tray.appendChild(pill);
    applyOptionHoverAnimation(pill);
  });
}

function isOptionUsedByAnotherFriend(field, optionId, currentFriendId) {
  return friends.some(f => f.id !== currentFriendId && f[field] === optionId);
}

function findOptionById(optionId) {
  const pools = [HAIR_OPTIONS, GIFT_OPTIONS, FOOD_OPTIONS, CLOTHING_OPTIONS];
  for (const pool of pools) {
    const hit = pool.find(o => o.id === optionId);
    if (hit) return hit;
  }
  return null;
}

// ---------- PARTY MODAL ----------

function showPartyModal() {
  const modal = $("#partyModal");
  const lineup = $("#partyLineup");
  if (!modal || !lineup) return;

  lineup.innerHTML = "";
  friends
    .filter(f => f.placed)
    .forEach(f => {
      const wrap = document.createElement("div");
      wrap.className = "lineup-item";

      const hat = document.createElement("div");
      hat.className = "party-hat";
      wrap.appendChild(hat);

      const sprite = makeFriendSprite(f.spriteSrc);
      wrap.appendChild(sprite);

      lineup.appendChild(wrap);
    });

  modal.classList.remove("hidden");
}

function hidePartyModal() {
  const modal = $("#partyModal");
  if (!modal) return;
  modal.classList.add("hidden");
}

// ---------- UI ANIMATIONS ----------

function startButtonGradientAnimation() {
  if (!animeModule || !animeModule.animate) return;
  const btns = document.querySelectorAll("button");
  animeModule.animate(btns, {
    backgroundPosition: ["0% 50%", "100% 50%"],
    direction: "alternate",
    easing: "easeInOutSine",
    duration: 5000,
    loop: true
  });
}

async function startTextAnimation() {
  const targets = document.querySelectorAll(".animated-heading");
  if (!targets.length) return;
  if (!animeModule) {
    animeModule = await loadAnimeModule();
  }
  if (!animeModule || !animeModule.animate || !animeModule.splitText) return;

  targets.forEach(el => {
    const { chars } = animeModule.splitText(el, { words: false, chars: true });
    animeModule.animate(chars, {
      y: [
        { to: "-2.75rem", ease: "outExpo", duration: 600 },
        { to: 0, ease: "outBounce", duration: 800, delay: 100 }
      ],
      rotate: {
        from: "-1turn",
        delay: 0
      },
      delay: animeModule.stagger ? animeModule.stagger(50) : 50,
      ease: "inOutCirc",
      loopDelay: 1000,
      loop: true
    });
  });
}

async function loadAnimeModule() {
  if (animeModule) return animeModule;
  try {
    animeModule = await import("https://esm.sh/animejs");
    return animeModule;
  } catch (err) {
    console.warn("Could not load animejs module", err);
    return null;
  }
}

async function startAnimations() {
  animeModule = await loadAnimeModule();
  startButtonGradientAnimation();
  startTextAnimation();
  // drag for friends disabled for stability
}

function applyOptionHoverAnimation(pill) {
  const run = () => {
    const animator = animeModule && animeModule.animate ? animeModule.animate : null;
    if (!animator) return;
    let hoverAnim = null;
    pill.addEventListener("mouseenter", () => {
      if (hoverAnim && hoverAnim.cancel) hoverAnim.cancel();
      hoverAnim = animator(pill, {
        transform: ["translateY(0px) scale(1)", "translateY(-4px) scale(1.06)"],
        duration: 240,
        easing: "easeInOutSine",
        fill: "forwards"
      });
    });
    pill.addEventListener("mouseleave", () => {
      if (hoverAnim && hoverAnim.cancel) hoverAnim.cancel();
      animator(pill, {
        transform: ["translateY(-4px) scale(1.06)", "translateY(0px) scale(1)"],
        duration: 200,
        easing: "easeInOutSine",
        fill: "forwards"
      });
    });
  };
  if (animeModule) {
    run();
  } else {
    loadAnimeModule().then(run).catch(() => {});
  }
}

function initDraggable() {
  if (!animeModule || !animeModule.createDraggable) return;
  // temporarily disabled dragging for stability
}

function goToNextFriend() {
  const currentIndex = activeFriendId !== null ? activeFriendId : -1;
  let next = friends.find(f => !f.placed);
  if (currentIndex >= 0) {
    const remaining = friends.slice(currentIndex + 1).find(f => !f.placed);
    if (remaining) next = remaining;
  }
  if (next) {
    activeFriendId = next.id;
    selectionStartMs = performance.now();
    renderFriendsTray();
    renderOptionTrays();
    showTempStatus(`Friend ${next.id + 1} selected.`);
  } else {
    showTempStatus("All friends placed.", false);
    showPartyModal();
    partyShown = true;
  }
}

function resetGame() {
  friends.forEach(f => {
    f.placed = false;
    f.mapX = null;
    f.mapY = null;
    f.zoneRow = null;
    f.zoneCol = null;
    f.selectToPlaceMs = null;
    f.hairId = null;
    f.giftId = null;
    f.foodId = null;
    f.clothesId = null;
  });
  activeFriendId = 0;
  selectionStartMs = performance.now();

  const map = $("#map");
  map.querySelectorAll(".map-friend").forEach(node => node.remove());

  renderFriendsTray();
  renderOptionTrays();
  showTempStatus("Game reset. Start with Friend 1.");
  partyShown = false;
  hidePartyModal();
}
