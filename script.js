/* =========================================================
   GRACE WORSHIP — SCROLL
   Two-page version: programs + program viewer
   ========================================================= */

const SUPABASE_URL = "https://ylcnkauqewvjvocbmweh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_KIhYKuei7TMvbKf0JGzwOA_JPpLb7lP";

const MIN_SPEED = 1;
const MAX_SPEED = 100;
const DEFAULT_SPEED = 18;

const MIN_FONT_SIZE = 1;
const MAX_FONT_SIZE = 60;

const SWITCH_LINE = 140;
const END_PADDING_RATIO = 1;

const FONT_STORAGE_KEY = "worship-scroll-font-size";
const THEME_STORAGE_KEY = "worship-scroll-theme";
const VIEW_SPEED_KEY_PREFIX = "worship-scroll-view-speed:";
const VIEW_APPLY_ALL_KEY_PREFIX = "worship-scroll-view-all:";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const pageType = document.body.dataset.page;

let programs = [];
let currentProgram = null;
let songs = [];

let currentSongIndex = 0;
let globalSpeed = DEFAULT_SPEED;
let viewerAllSpeed = null;
let fontSize = Number(localStorage.getItem(FONT_STORAGE_KEY)) || 22;

let isPlaying = false;
let animationFrameId = null;
let lastTimestamp = null;

let currentUser = null;
let toastTimer = null;

const els = {};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  cacheElements();
  applyTheme();
  bindCommonEvents();

  if (pageType === "home") {
    await initHome();
  }

  if (pageType === "program") {
    await initProgramPage();
  }

  if (pageType === "edit") {
    await initEditPage();
  }
}

/* =========================================================
   Elements
   ========================================================= */

function cacheElements() {
  const ids = [
    "themeToggle",
    "authButton",
    "logoutButton",
    "authModal",
    "closeAuthButton",
    "authEmail",
    "authPassword",
    "loginButton",
    "signupButton",
    "authMessage",
    "toast",

    "programList",
    "noPrograms",
    "createProgramButton",

    "programTitle",
    "programInfo",
    "copyProgramLinkButton",
    "editProgramButton",
    "backToProgramButton",
    "editProgramTitle",
    "editProgramInfo",
    "openProgramButton",

    "fontMinus",
    "fontPlus",
    "fontSizeValue",
    "speedMinus",
    "speedPlus",
    "globalSpeedValue",
    "applySpeedAll",
    "playButton",
    "pauseButton",
    "resetButton",

    "songNavigation",
    "prevSongButton",
    "nextSongButton",
    "songCounter",
    "programScroll",
    "program",
    "emptyState",

    "editorSection",
    "editorDetails",
    "programNameInput",
    "programDateInput",
    "saveProgramButton",
    "deleteProgramButton",
    "addSongButton",
    "songEditors"
  ];

  ids.forEach(id => {
    els[id] = document.getElementById(id);
  });
}

/* =========================================================
   Common events
   ========================================================= */

function bindCommonEvents() {
  els.themeToggle?.addEventListener("click", toggleTheme);

  // Manual touch/mouse scrolling should immediately update the active song.
  els.programScroll?.addEventListener("scroll", () => {
    if (pageType === "program" && !isPlaying) {
      updateUI();
    }
  }, { passive: true });


  els.authButton?.addEventListener("click", openAuthModal);
  els.logoutButton?.addEventListener("click", logout);

  els.closeAuthButton?.addEventListener("click", closeAuthModal);
  document.querySelector("[data-close-auth]")?.addEventListener("click", closeAuthModal);

  els.loginButton?.addEventListener("click", login);
  els.signupButton?.addEventListener("click", signup);

  supabaseClient.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user || null;
    updateAccountUI();

    if (pageType === "home") {
      renderPrograms();
    }

    if (pageType === "program") {
      updateAccountUI();
    }

    if (pageType === "edit") {
      renderEditors();
    }
  });
}

/* =========================================================
   Home page
   ========================================================= */

async function initHome() {
  await checkSession();
  await loadPrograms();
  updateAccountUI();
}

async function loadPrograms() {
  const { data, error } = await supabaseClient
    .from("programs")
    .select("id, title, service_date, created_at, updated_at")
    .order("service_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    showToast("Не удалось загрузить программы: " + error.message);
    programs = [];
    renderPrograms();
    return;
  }

  programs = data || [];
  renderPrograms();
}

function renderPrograms() {
  if (!els.programList) return;

  if (!programs.length) {
    els.programList.innerHTML = "";
    els.noPrograms?.classList.remove("hidden");
    return;
  }

  els.noPrograms?.classList.add("hidden");

  els.programList.innerHTML = programs.map((program, index) => {
    const dateText = formatDate(program.service_date);

    return `
      <article class="program-card">
        <div class="program-card-main">
          <div class="program-card-number">${String(index + 1).padStart(2, "0")}</div>

          <div>
            <h3>${escapeHtml(program.title || "Без названия")}</h3>
            <p>${dateText || "Дата не указана"}</p>
          </div>
        </div>

        <div class="program-card-actions">
          <a
            class="primary-button"
            href="program.html?program=${encodeURIComponent(program.id)}"
          >
            Открыть
          </a>

          ${currentUser ? `
          <a
            class="secondary-button"
            href="edit.html?program=${encodeURIComponent(program.id)}"
          >
            Редактировать
          </a>` : ""}

          <button
            class="secondary-button copy-link-button"
            data-program-id="${program.id}"
            title="Скопировать ссылку"
          >
            Ссылка
          </button>
        </div>
      </article>
    `;
  }).join("");

  els.programList.querySelectorAll(".copy-link-button").forEach(button => {
    button.addEventListener("click", () => copyProgramLink(button.dataset.programId));
  });
}

async function createProgram() {
  if (!currentUser) {
    openAuthModal();
    return;
  }

  const title = window.prompt(
    "Название программы",
    "Восхваление " + formatDate(new Date().toISOString().slice(0, 10))
  );

  if (!title?.trim()) return;

  const { data, error } = await supabaseClient
    .from("programs")
    .insert({
      title: title.trim(),
      service_date: new Date().toISOString().slice(0, 10)
    })
    .select()
    .single();

  if (error) {
    console.error(error);
    showToast("Не удалось создать программу: " + error.message);
    return;
  }

  window.location.href = `program.html?program=${encodeURIComponent(data.id)}`;
}

function copyProgramLink(programId) {
  const url = new URL("program.html", window.location.href);
  url.searchParams.set("program", programId);

  navigator.clipboard.writeText(url.href)
    .then(() => showToast("Ссылка скопирована."))
    .catch(() => showToast("Не удалось скопировать ссылку."));
}

/* =========================================================
   Program page
   ========================================================= */

async function initProgramPage() {
  await checkSession();

  const programId = new URLSearchParams(window.location.search).get("program");

  if (!programId) {
    window.location.replace("index.html");
    return;
  }

  await loadProgram(programId);
  updateAccountUI();
}

async function initEditPage() {
  await checkSession();

  if (!currentUser) {
    window.location.replace("index.html");
    return;
  }

  const programId = new URLSearchParams(window.location.search).get("program");

  if (!programId) {
    window.location.replace("index.html");
    return;
  }

  await loadProgram(programId);
  updateAccountUI();
}

async function loadProgram(programId) {
  const { data: program, error: programError } = await supabaseClient
    .from("programs")
    .select("id, title, service_date, created_at, updated_at")
    .eq("id", programId)
    .single();

  if (programError || !program) {
    console.error(programError);
    if (els.programTitle) els.programTitle.textContent = "Программа не найдена";
    if (els.programInfo) els.programInfo.textContent = "Вернитесь к списку программ.";
    els.program?.replaceChildren();
    els.songNavigation?.classList.add("hidden");
    return;
  }

  currentProgram = program;

  document.title = `${program.title} — GRACE WORSHIP`;

  if (els.programTitle) {
    els.programTitle.textContent = program.title || "Без названия";
  }

  if (els.programInfo) {
    els.programInfo.textContent = formatDate(program.service_date) || "Дата не указана";
  }

  if (els.editProgramTitle) {
    els.editProgramTitle.textContent = program.title || "Без названия";
  }

  if (els.editProgramInfo) {
    els.editProgramInfo.textContent = formatDate(program.service_date) || "Дата не указана";
  }

  if (els.openProgramButton) {
    els.openProgramButton.href = `program.html?program=${encodeURIComponent(program.id)}`;
  }

  if (els.backToProgramButton) {
    els.backToProgramButton.href = `program.html?program=${encodeURIComponent(program.id)}`;
  }

  if (els.programNameInput) {
    els.programNameInput.value = program.title || "";
  }

  if (els.programDateInput) {
    els.programDateInput.value = program.service_date || "";
  }

  await loadProgramSongs(program.id);
  loadViewerSettings();

  if (pageType === "program") {
    renderProgram();
    updateUI();
  }

  if (pageType === "edit") {
    renderEditors();
  }
}

async function loadProgramSongs(programId) {
  const { data: relations, error: relationError } = await supabaseClient
    .from("program_songs")
    .select("id, song_id, position, created_at")
    .eq("program_id", programId)
    .order("position", { ascending: true });

  if (relationError) {
    console.error(relationError);
    showToast("Не удалось загрузить песни: " + relationError.message);
    songs = [];
    return;
  }

  const ids = (relations || []).map(item => item.song_id);

  if (!ids.length) {
    songs = [];
    return;
  }

  const { data: songRows, error: songsError } = await supabaseClient
    .from("songs")
    .select("id, title, text, speed, created_at, updated_at")
    .in("id", ids);

  if (songsError) {
    console.error(songsError);
    showToast("Не удалось загрузить тексты: " + songsError.message);
    songs = [];
    return;
  }

  const byId = new Map(
    (songRows || []).map(song => [
      song.id,
      {
        id: song.id,
        title: song.title || "",
        text: song.text || "",
        speed: clamp(Number(song.speed) || DEFAULT_SPEED, MIN_SPEED, MAX_SPEED),
        created_at: song.created_at,
        updated_at: song.updated_at
      }
    ])
  );

  songs = (relations || [])
    .sort((a, b) => Number(a.position || 0) - Number(b.position || 0))
    .map(relation => byId.get(relation.song_id))
    .filter(Boolean);

  globalSpeed = songs[0]?.speed || DEFAULT_SPEED;
}

/* =========================================================
   Program editor
   ========================================================= */

function renderEditors() {
  if (pageType !== "edit" || !els.editorSection) return;

  if (!currentUser || !currentProgram) {
    els.editorSection.classList.add("hidden");
    return;
  }

  els.editorSection.classList.remove("hidden");

  if (els.programNameInput) {
    els.programNameInput.value = currentProgram.title || "";
  }

  if (els.programDateInput) {
    els.programDateInput.value = currentProgram.service_date || "";
  }

  if (!els.songEditors) return;

  els.songEditors.innerHTML = songs.map((song, index) => `
    <article class="editor-card" data-editor-id="${song.id}">
      <div class="editor-head">
        <h3>Песня ${String(index + 1).padStart(2, "0")}</h3>

        <button
          class="delete-button"
          data-action="delete-song"
          data-id="${song.id}"
        >
          Удалить
        </button>
      </div>

      <div class="editor-field">
        <label>Название</label>
        <input
          class="editor-input"
          data-field="title"
          data-id="${song.id}"
          type="text"
          value="${escapeAttribute(song.title)}"
          placeholder="Название песни"
        >
      </div>

      <div class="editor-field">
        <label>Текст и аккорды</label>
        <textarea
          class="editor-textarea"
          data-field="text"
          data-id="${song.id}"
          placeholder="Вставьте текст прямо из Word / Notes — пробелы, табы и переносы строк сохранятся."
        >${escapeHtml(song.text)}</textarea>
      </div>

      <div class="editor-footer">
        <div class="editor-speed">
          <span>Скорость</span>
          <button class="small-button" data-action="speed-minus" data-id="${song.id}">−</button>

          <input
            class="speed-input"
            data-field="speed"
            data-id="${song.id}"
            type="number"
            min="${MIN_SPEED}"
            max="${MAX_SPEED}"
            value="${song.speed}"
          >

          <button class="small-button" data-action="speed-plus" data-id="${song.id}">+</button>
          <span>px/с</span>
        </div>
      </div>
    </article>
  `).join("");

  els.songEditors.querySelectorAll("[data-field='title']").forEach(input => {
    input.addEventListener("change", () => saveSongField(input));
  });

  els.songEditors.querySelectorAll("[data-field='text']").forEach(textarea => {
    textarea.addEventListener("change", () => saveSongField(textarea));
  });

  els.songEditors.querySelectorAll("[data-field='speed']").forEach(input => {
    input.addEventListener("change", () => saveSongField(input));
  });

  els.songEditors.querySelectorAll("[data-action='delete-song']").forEach(button => {
    button.addEventListener("click", () => deleteSong(button.dataset.id));
  });

  els.songEditors.querySelectorAll("[data-action='speed-minus']").forEach(button => {
    button.addEventListener("click", () => changeSongSpeed(button.dataset.id, -1));
  });

  els.songEditors.querySelectorAll("[data-action='speed-plus']").forEach(button => {
    button.addEventListener("click", () => changeSongSpeed(button.dataset.id, 1));
  });
}

async function saveProgram() {
  if (!currentUser || !currentProgram) {
    openAuthModal();
    return;
  }

  const title = els.programNameInput.value.trim();

  if (!title) {
    showToast("Введите название программы.");
    return;
  }

  const serviceDate = els.programDateInput.value || null;

  const { data, error } = await supabaseClient
    .from("programs")
    .update({
      title,
      service_date: serviceDate,
      updated_at: new Date().toISOString()
    })
    .eq("id", currentProgram.id)
    .select()
    .single();

  if (error) {
    console.error(error);
    showToast("Не удалось сохранить программу: " + error.message);
    return;
  }

  currentProgram = data;

  document.title = `${data.title} — GRACE WORSHIP`;
  if (els.programTitle) els.programTitle.textContent = data.title;
  if (els.programInfo) els.programInfo.textContent = formatDate(data.service_date) || "Дата не указана";
  if (els.editProgramTitle) els.editProgramTitle.textContent = data.title;
  if (els.editProgramInfo) els.editProgramInfo.textContent = formatDate(data.service_date) || "Дата не указана";

  showToast("Программа сохранена.");
}

async function deleteCurrentProgram() {
  if (!currentUser || !currentProgram) {
    openAuthModal();
    return;
  }

  if (!confirm(`Удалить программу «${currentProgram.title}»?`)) {
    return;
  }

  const { data: relations, error: relationError } = await supabaseClient
    .from("program_songs")
    .select("song_id")
    .eq("program_id", currentProgram.id);

  if (relationError) {
    console.error(relationError);
    showToast("Не удалось подготовить удаление: " + relationError.message);
    return;
  }

  const songIds = (relations || []).map(item => item.song_id);

  const { error: programError } = await supabaseClient
    .from("programs")
    .delete()
    .eq("id", currentProgram.id);

  if (programError) {
    console.error(programError);
    showToast("Не удалось удалить программу: " + programError.message);
    return;
  }

  if (songIds.length) {
    const { error: songsError } = await supabaseClient
      .from("songs")
      .delete()
      .in("id", songIds);

    if (songsError) {
      console.error(songsError);
    }
  }

  window.location.replace("index.html");
}

async function addSong() {
  if (!currentUser || !currentProgram) {
    openAuthModal();
    return;
  }

  const newSong = {
    title: `Новая песня ${songs.length + 1}`,
    text: "",
    speed: globalSpeed
  };

  els.addSongButton.disabled = true;

  try {
    const { data: created, error: songError } = await supabaseClient
      .from("songs")
      .insert({
        title: newSong.title,
        text: newSong.text,
        speed: newSong.speed
      })
      .select()
      .single();

    if (songError) throw songError;

    const { error: relationError } = await supabaseClient
      .from("program_songs")
      .insert({
        program_id: currentProgram.id,
        song_id: created.id,
        position: songs.length
      });

    if (relationError) {
      await supabaseClient.from("songs").delete().eq("id", created.id);
      throw relationError;
    }

    songs.push({
      id: created.id,
      title: created.title,
      text: created.text || "",
      speed: Number(created.speed) || DEFAULT_SPEED,
      created_at: created.created_at,
      updated_at: created.updated_at
    });

    renderProgram();
    renderEditors();
    updateUI();

    els.editorDetails?.setAttribute("open", "");

    setTimeout(() => {
      const editor = document.querySelector(`[data-editor-id="${created.id}"]`);
      editor?.scrollIntoView({ behavior: "smooth", block: "center" });
      editor?.querySelector(".editor-input")?.focus();
    }, 50);

    showToast("Песня добавлена.");
  } catch (error) {
    console.error(error);
    showToast("Не удалось добавить песню: " + error.message);
  } finally {
    els.addSongButton.disabled = false;
  }
}

async function deleteSong(id) {
  if (!currentUser || !currentProgram) {
    openAuthModal();
    return;
  }

  const song = songs.find(item => item.id === id);
  if (!song) return;

  if (!confirm(`Удалить песню «${song.title}» из программы?`)) {
    return;
  }

  try {
    const { error: relationError } = await supabaseClient
      .from("program_songs")
      .delete()
      .eq("program_id", currentProgram.id)
      .eq("song_id", id);

    if (relationError) throw relationError;

    const { error: songError } = await supabaseClient
      .from("songs")
      .delete()
      .eq("id", id);

    if (songError) throw songError;

    songs = songs.filter(item => item.id !== id);

    await normalizePositions();

    currentSongIndex = clamp(
      currentSongIndex,
      0,
      Math.max(0, songs.length - 1)
    );

    renderProgram();
    renderEditors();
    updateUI();

    showToast("Песня удалена.");
  } catch (error) {
    console.error(error);
    showToast("Не удалось удалить песню: " + error.message);
  }
}

async function normalizePositions() {
  if (!currentProgram) return;

  for (let index = 0; index < songs.length; index++) {
    await supabaseClient
      .from("program_songs")
      .update({ position: index })
      .eq("program_id", currentProgram.id)
      .eq("song_id", songs[index].id);
  }
}

async function saveSongField(element) {
  if (!currentUser) return;

  const id = element.dataset.id;
  const field = element.dataset.field;
  const song = songs.find(item => item.id === id);

  if (!song) return;

  let value = element.value;

  if (field === "speed") {
    value = clamp(Number(value) || DEFAULT_SPEED, MIN_SPEED, MAX_SPEED);
    element.value = value;
  }

  song[field] = value;

  try {
    const { error } = await supabaseClient
      .from("songs")
      .update({
        title: song.title,
        text: song.text,
        speed: song.speed,
        updated_at: new Date().toISOString()
      })
      .eq("id", song.id);

    if (error) throw error;

    if (field === "speed") {
      globalSpeed = song.speed;
    }

    if (pageType === "program") {
      renderProgram();
      updateUI();
    }
    if (pageType === "edit") {
      renderEditors();
    }

    showToast("Сохранено.");
  } catch (error) {
    console.error(error);
    showToast("Ошибка сохранения: " + error.message);
  }
}

async function changeSongSpeed(id, delta) {
  const song = songs.find(item => item.id === id);
  if (!song || !currentUser) return;

  song.speed = clamp(song.speed + delta, MIN_SPEED, MAX_SPEED);

  try {
    const { error } = await supabaseClient
      .from("songs")
      .update({
        speed: song.speed,
        updated_at: new Date().toISOString()
      })
      .eq("id", song.id);

    if (error) throw error;

    globalSpeed = song.speed;

    if (pageType === "program") {
      renderProgram();
      updateUI();
    }
    if (pageType === "edit") {
      renderEditors();
    }
  } catch (error) {
    console.error(error);
    showToast("Ошибка сохранения скорости: " + error.message);
  }
}

/* =========================================================
   Program rendering
   ========================================================= */

function renderProgram() {
  if (pageType !== "program" || !els.program) return;

  if (!songs.length) {
    els.program.innerHTML = "";
    els.emptyState?.classList.remove("hidden");
    els.songNavigation?.classList.add("hidden");
    return;
  }

  els.emptyState?.classList.add("hidden");
  els.songNavigation?.classList.remove("hidden");

  els.program.innerHTML = songs.map((song, index) => `
    <section class="song" data-song-id="${song.id}" data-song-index="${index}">
      <header class="song-header">
        <div>
          <div class="song-number">${String(index + 1).padStart(2, "0")}</div>
          <h2 class="song-title">${escapeHtml(song.title || "Без названия")}</h2>
        </div>

        <div class="song-speed-badge">${song.speed} px/с</div>
      </header>

      <pre class="lyrics-text">${escapeHtml(cleanSongText(song.text || ""))}</pre>
    </section>
  `).join("");

  createEndSpacer();
  detectCurrentSong();
  updateFontSize();
  updateUI();
}

function createEndSpacer() {
  if (!els.program) return;

  els.program.querySelector(".end-spacer")?.remove();

  if (!songs.length) return;

  const spacer = document.createElement("div");
  spacer.className = "end-spacer";
  spacer.style.height = `${window.innerHeight * END_PADDING_RATIO}px`;
  els.program.appendChild(spacer);
}

/* =========================================================
   Scrolling
   ========================================================= */

function getScrollContainer() {
  // Use the document as the scroll surface. The header is fixed, so the
  // musician sees only the song content moving while Safari/macOS keep
  // their native scrolling behavior.
  return document.scrollingElement || document.documentElement;
}

function getViewerHeaderOffset() {
  const header = document.querySelector(".control-panel");
  return (header?.getBoundingClientRect().height || 0) + 10;
}

function detectCurrentSong() {
  if (!songs.length || pageType !== "program") {
    currentSongIndex = 0;
    return null;
  }

  const scroller = getScrollContainer();
  const songElements = document.querySelectorAll("#program .song");
  if (!scroller || !songElements.length) {
    currentSongIndex = 0;
    return null;
  }

  const line = getViewerHeaderOffset() + SWITCH_LINE;
  let detected = 0;

  for (let i = 0; i < songElements.length; i++) {
    const top = songElements[i].getBoundingClientRect().top;
    if (top <= line) {
      detected = i;
    } else {
      break;
    }
  }

  currentSongIndex = detected;
  return songElements[detected] || null;
}

function getCurrentSpeed() {
  if (!songs.length) return DEFAULT_SPEED;

  if (viewerAllSpeed !== null) {
    return viewerAllSpeed;
  }

  const firstSpeed = songs[0]?.speed || DEFAULT_SPEED;
  const currentStoredSpeed = songs[currentSongIndex]?.speed || DEFAULT_SPEED;
  const offset = globalSpeed - firstSpeed;

  return clamp(currentStoredSpeed + offset, MIN_SPEED, MAX_SPEED);
}

function hasProgramEnded() {
  const scroller = getScrollContainer();
  if (!songs.length || !scroller) return true;
  return scroller.scrollTop >= scroller.scrollHeight - scroller.clientHeight - 2;
}

function scrollLoop(timestamp) {
  if (!isPlaying) return;

  const scroller = getScrollContainer();
  if (!scroller) {
    pause();
    return;
  }

  if (lastTimestamp === null) lastTimestamp = timestamp;

  const deltaTime = Math.min((timestamp - lastTimestamp) / 1000, 0.05);
  lastTimestamp = timestamp;

  const speed = getCurrentSpeed();
  const before = scroller.scrollTop;
  const next = Math.min(
    before + speed * deltaTime,
    scroller.scrollHeight - scroller.clientHeight
  );

  scroller.scrollTop = next;

  // Safari can coalesce writes while a smooth scroll is active. We never use
  // smooth scrolling during playback, so each frame owns the exact position.
  if (scroller.scrollTop !== before) {
    detectCurrentSong();
    updateUI(false);
  }

  if (hasProgramEnded()) {
    pause();
    return;
  }

  animationFrameId = requestAnimationFrame(scrollLoop);
}

function scrollToSongInstant(index) {
  const scroller = getScrollContainer();
  const songElements = document.querySelectorAll("#program .song");
  const targetSong = songElements?.[index];

  if (!scroller || !targetSong) return false;

  const absoluteTop = targetSong.getBoundingClientRect().top + scroller.scrollTop;
  const targetTop = Math.max(0, absoluteTop - getViewerHeaderOffset());

  scroller.scrollTo({ top: targetTop, behavior: "auto" });
  currentSongIndex = index;
  updateUI(false);
  return true;
}

function play() {
  if (!songs.length) {
    showToast("В программе нет песен.");
    return;
  }

  if (isPlaying) return;

  // Always anchor playback to the current song's TITLE, not arbitrary lyrics.
  // From the top of a program this means the first song title.
  detectCurrentSong();
  scrollToSongInstant(currentSongIndex);

  isPlaying = true;
  lastTimestamp = null;
  animationFrameId = requestAnimationFrame(scrollLoop);
  updateUI(false);
}

function pause() {
  isPlaying = false;
  lastTimestamp = null;

  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  updateUI(false);
}

function reset() {
  pause();
  if (!songs.length) return;
  scrollToSongInstant(0);
  updateUI(false);
}

/* =========================================================
   Navigation
   ========================================================= */

function goToSong(index) {
  if (!songs.length) return;

  const targetIndex = clamp(index, 0, songs.length - 1);
  const songElements = document.querySelectorAll("#program .song");
  const targetSong = songElements?.[targetIndex];
  const scroller = getScrollContainer();

  if (!scroller || !targetSong) return;

  const absoluteTop = targetSong.getBoundingClientRect().top + scroller.scrollTop;
  const target = Math.max(0, absoluteTop - getViewerHeaderOffset());

  currentSongIndex = targetIndex;
  scroller.scrollTo({ top: target, behavior: "smooth" });
  updateUI(false);
}

function handleKeyboard(event) {
  const active = document.activeElement;

  const isTyping =
    active &&
    ["INPUT", "TEXTAREA", "SELECT"].includes(active.tagName);

  if (isTyping || pageType !== "program") return;

  if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
    event.preventDefault();
    goToSong(currentSongIndex - 1);
  }

  if (event.key === "ArrowRight" || event.key === "ArrowDown") {
    event.preventDefault();
    goToSong(currentSongIndex + 1);
  }

  if (event.code === "Space") {
    event.preventDefault();
    isPlaying ? pause() : play();
  }
}

/* =========================================================
   Controls
   ========================================================= */

function changeGlobalSpeed(delta) {
  globalSpeed = clamp(globalSpeed + delta, MIN_SPEED, MAX_SPEED);

  if (viewerAllSpeed !== null) {
    viewerAllSpeed = globalSpeed;
  }

  saveViewerSettings();
  updateUI();
}

function saveViewerSettings() {
  if (!currentProgram) return;

  localStorage.setItem(
    `${VIEW_SPEED_KEY_PREFIX}${currentProgram.id}`,
    String(globalSpeed)
  );

  localStorage.setItem(
    `${VIEW_APPLY_ALL_KEY_PREFIX}${currentProgram.id}`,
    viewerAllSpeed === null ? "" : String(viewerAllSpeed)
  );
}

function loadViewerSettings() {
  if (!currentProgram) return;

  const savedSpeed = Number(
    localStorage.getItem(`${VIEW_SPEED_KEY_PREFIX}${currentProgram.id}`)
  );

  globalSpeed = savedSpeed
    ? clamp(savedSpeed, MIN_SPEED, MAX_SPEED)
    : (songs[0]?.speed || DEFAULT_SPEED);

  const savedAll = localStorage.getItem(
    `${VIEW_APPLY_ALL_KEY_PREFIX}${currentProgram.id}`
  );

  viewerAllSpeed = savedAll ? clamp(Number(savedAll), MIN_SPEED, MAX_SPEED) : null;
}

function applySpeedToAll() {
  if (!songs.length || pageType !== "program") return;

  viewerAllSpeed = globalSpeed;
  saveViewerSettings();
  updateUI();
  showToast(`Скорость ${globalSpeed} px/с применена ко всем песням.`);
}

function changeFontSize(delta) {
  fontSize = clamp(fontSize + delta, MIN_FONT_SIZE, MAX_FONT_SIZE);
  localStorage.setItem(FONT_STORAGE_KEY, fontSize);
  updateFontSize();
}

function updateFontSize() {
  document.documentElement.style.setProperty(
    "--lyrics-font-size",
    `${fontSize}px`
  );

  document.querySelectorAll(".lyrics-text").forEach(element => {
    element.style.fontSize = `${fontSize}px`;
  });

  if (els.fontSizeValue) {
    els.fontSizeValue.textContent = `${fontSize} px`;
  }
}

/* =========================================================
   Authentication
   ========================================================= */

async function checkSession() {
  const { data, error } = await supabaseClient.auth.getSession();

  if (error) {
    console.error(error);
    return;
  }

  currentUser = data.session?.user || null;
}

function updateAccountUI() {
  if (currentUser) {
    els.authButton?.classList.add("hidden");
    els.logoutButton?.classList.remove("hidden");
  } else {
    els.authButton?.classList.remove("hidden");
    els.logoutButton?.classList.add("hidden");
  }

  if (pageType === "home") {
    els.createProgramButton?.classList.toggle("hidden", !currentUser);
    renderPrograms();
  }

  if (pageType === "program") {
    els.editProgramButton?.classList.toggle("hidden", !currentUser);
    if (currentProgram && els.editProgramButton) {
      els.editProgramButton.onclick = () => {
        window.location.href = `edit.html?program=${encodeURIComponent(currentProgram.id)}`;
      };
    }
  }

  if (pageType === "edit") {
    if (!currentUser) {
      window.location.replace("index.html");
      return;
    }
    renderEditors();
  }
}

function openAuthModal() {
  if (!els.authModal) return;

  if (els.authMessage) {
    els.authMessage.textContent = "";
  }

  els.authModal.classList.remove("hidden");
  els.authModal.setAttribute("aria-hidden", "false");

  setTimeout(() => els.authEmail?.focus(), 50);
}

function closeAuthModal() {
  els.authModal?.classList.add("hidden");
  els.authModal?.setAttribute("aria-hidden", "true");
}

async function login() {
  const email = els.authEmail.value.trim();
  const password = els.authPassword.value;

  if (!email || !password) {
    els.authMessage.textContent = "Введите email и пароль.";
    return;
  }

  setAuthLoading(true);
  els.authMessage.textContent = "Выполняется вход…";

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  setAuthLoading(false);

  if (error) {
    console.error(error);
    els.authMessage.textContent = translateAuthError(error.message);
    return;
  }

  closeAuthModal();
  showToast("Вы вошли в систему.");

  if (pageType === "home") {
    await loadPrograms();
  }

  if (pageType === "program") {
    await loadProgramSongs(currentProgram.id);
    renderProgram();
    renderEditors();
    updateUI();
  }
}

async function signup() {
  const email = els.authEmail.value.trim();
  const password = els.authPassword.value;

  if (!email || !password) {
    els.authMessage.textContent = "Введите email и пароль.";
    return;
  }

  if (password.length < 6) {
    els.authMessage.textContent = "Пароль должен содержать минимум 6 символов.";
    return;
  }

  setAuthLoading(true);
  els.authMessage.textContent = "Создание аккаунта…";

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password
  });

  setAuthLoading(false);

  if (error) {
    console.error(error);
    els.authMessage.textContent = translateAuthError(error.message);
    return;
  }

  if (data.session) {
    closeAuthModal();
    currentUser = data.session.user;
    updateAccountUI();
    showToast("Аккаунт создан. Вы вошли.");
  } else {
    els.authMessage.textContent =
      "Аккаунт создан. Проверьте почту и подтвердите email, затем войдите.";
  }
}

async function logout() {
  pause();

  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    console.error(error);
    showToast("Ошибка выхода: " + error.message);
    return;
  }

  currentUser = null;
  updateAccountUI();
  showToast("Вы вышли.");

  if (pageType === "program") {
    if (els.editorDetails) els.editorDetails.removeAttribute("open");
  }
}

function setAuthLoading(isLoading) {
  if (els.loginButton) els.loginButton.disabled = isLoading;
  if (els.signupButton) els.signupButton.disabled = isLoading;
}

/* =========================================================
   Copy current program link
   ========================================================= */

function copyCurrentProgramLink() {
  if (!currentProgram) return;

  const url = new URL("program.html", window.location.href);
  url.searchParams.set("program", currentProgram.id);

  navigator.clipboard.writeText(url.href)
    .then(() => showToast("Ссылка на программу скопирована."))
    .catch(() => showToast("Не удалось скопировать ссылку."));
}

/* =========================================================
   Theme
   ========================================================= */

function applyTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || "light";
  const isDark = savedTheme === "dark";

  document.body.classList.toggle("dark-theme", isDark);

  if (els.themeToggle) {
    els.themeToggle.textContent = isDark ? "☀️" : "🌙";
  }
}

function toggleTheme() {
  const isDark = document.body.classList.toggle("dark-theme");

  localStorage.setItem(
    THEME_STORAGE_KEY,
    isDark ? "dark" : "light"
  );

  if (els.themeToggle) {
    els.themeToggle.textContent = isDark ? "☀️" : "🌙";
  }
}

/* =========================================================
   UI
   ========================================================= */

function updateUI(renderFont = true) {
  if (pageType !== "program") return;

  detectCurrentSong();

  const count = songs.length;

  if (els.songCounter) {
    els.songCounter.textContent =
      `${String(count ? currentSongIndex + 1 : 0).padStart(2, "0")} / ${String(count).padStart(2, "0")}`;
  }

  if (els.globalSpeedValue) {
    els.globalSpeedValue.textContent = globalSpeed;
  }

  if (els.fontSizeValue) {
    els.fontSizeValue.textContent = `${fontSize} px`;
  }

  document.querySelectorAll(".song").forEach((element, index) => {
    element.classList.toggle(
      "is-current",
      index === currentSongIndex
    );
  });

  if (els.prevSongButton) {
    els.prevSongButton.disabled = currentSongIndex <= 0;
  }

  if (els.nextSongButton) {
    els.nextSongButton.disabled =
      currentSongIndex >= count - 1 || count === 0;
  }

  if (els.playButton) {
    els.playButton.textContent =
      isPlaying ? "▶︎ Идёт" : "▶︎ Начать";
  }

  if (renderFont) updateFontSize();
}

/* =========================================================
   Window / keyboard
   ========================================================= */

window.addEventListener("resize", () => {
  if (pageType === "program") {
    createEndSpacer();
    updateFontSize();
  }
});

document.addEventListener("keydown", handleKeyboard);

/* =========================================================
   Helpers
   ========================================================= */

function formatDate(dateString) {
  if (!dateString) return "";

  const parts = String(dateString).split("-");
  if (parts.length !== 3) return dateString;

  const [year, month, day] = parts;
  return `${day}.${month}.${year}`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function cleanSongText(value) {
  // Keep internal spaces because they position chords, but remove trailing
  // whitespace that can create unnecessary horizontal scrolling on phones.
  return String(value)
    .replace(/[ \t]+$/gm, "")
    .replace(/\u00a0/g, " ");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

function translateAuthError(message) {
  const text = String(message || "");

  if (text.toLowerCase().includes("invalid login credentials")) {
    return "Неверный email или пароль.";
  }

  if (text.toLowerCase().includes("email not confirmed")) {
    return "Сначала подтвердите email через письмо.";
  }

  if (text.toLowerCase().includes("user already registered")) {
    return "Этот email уже зарегистрирован.";
  }

  return text;
}

function showToast(message) {
  if (!els.toast) return;

  clearTimeout(toastTimer);

  els.toast.textContent = message;
  els.toast.classList.add("show");

  toastTimer = setTimeout(() => {
    els.toast.classList.remove("show");
  }, 2500);
}

/* =========================================================
   Bind page-specific buttons after all functions exist
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  els.createProgramButton?.addEventListener("click", createProgram);

  els.fontMinus?.addEventListener("click", () => changeFontSize(-1));
  els.fontPlus?.addEventListener("click", () => changeFontSize(1));

  els.speedMinus?.addEventListener("click", () => changeGlobalSpeed(-1));
  els.speedPlus?.addEventListener("click", () => changeGlobalSpeed(1));
  els.applySpeedAll?.addEventListener("click", applySpeedToAll);

  els.playButton?.addEventListener("click", play);
  els.pauseButton?.addEventListener("click", pause);
  els.resetButton?.addEventListener("click", reset);

  els.prevSongButton?.addEventListener("click", () => {
    goToSong(currentSongIndex - 1);
  });

  els.nextSongButton?.addEventListener("click", () => {
    goToSong(currentSongIndex + 1);
  });

  els.copyProgramLinkButton?.addEventListener("click", copyCurrentProgramLink);

  els.saveProgramButton?.addEventListener("click", saveProgram);
  els.deleteProgramButton?.addEventListener("click", deleteCurrentProgram);
  els.addSongButton?.addEventListener("click", addSong);

  updateFontSize();
});
