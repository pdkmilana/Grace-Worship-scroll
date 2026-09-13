/* ==================================================
   GRACE WORSHIP — SCROLL
   PROGRAMS + SUPABASE
   ================================================== */


/* =========================
   SUPABASE
   ========================= */

const SUPABASE_URL =
  "https://ylcnkauqewvjvocbmweh.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_KIhYKuei7TMvbKf0JGzwOA_JPpLb7lP";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );


/* =========================
   SETTINGS
   ========================= */

const MIN_SPEED = 1;
const MAX_SPEED = 100;

const DEFAULT_SPEED = 18;

const MIN_FONT_SIZE = 14;
const MAX_FONT_SIZE = 60;

const SWITCH_LINE = 140;

const END_PADDING_RATIO = 1;

const FONT_STORAGE_KEY =
  "worship-scroll-font-size";

const THEME_STORAGE_KEY =
  "worship-scroll-theme";


/* =========================
   STATE
   ========================= */

let programs = [];

let currentProgram = null;

let songs = [];

let currentSongIndex = 0;

let globalSpeed =
  DEFAULT_SPEED;

let fontSize =
  Number(
    localStorage.getItem(
      FONT_STORAGE_KEY
    )
  ) || 22;

let currentUser = null;

let isPlaying = false;

let animationFrameId = null;

let lastTimestamp = null;

let toastTimer = null;


/* =========================
   ELEMENTS
   ========================= */

const els = {};


document.addEventListener(
  "DOMContentLoaded",
  init
);


/* ==================================================
   INIT
   ================================================== */

async function init() {

  cacheElements();

  applyTheme();

  bindEvents();

  updateFontSize();

  await checkSession();

  await loadPrograms();

  await loadProgramFromUrl();

  updateUI();
}


/* =========================
   CACHE ELEMENTS
   ========================= */

function cacheElements() {

  els.themeToggle =
    document.getElementById(
      "themeToggle"
    );

  els.authButton =
    document.getElementById(
      "authButton"
    );

  els.logoutButton =
    document.getElementById(
      "logoutButton"
    );


  els.fontMinus =
    document.getElementById(
      "fontMinus"
    );

  els.fontPlus =
    document.getElementById(
      "fontPlus"
    );

  els.fontSizeValue =
    document.getElementById(
      "fontSizeValue"
    );


  els.speedMinus =
    document.getElementById(
      "speedMinus"
    );

  els.speedPlus =
    document.getElementById(
      "speedPlus"
    );

  els.globalSpeedValue =
    document.getElementById(
      "globalSpeedValue"
    );

  els.applySpeedAll =
    document.getElementById(
      "applySpeedAll"
    );


  els.playButton =
    document.getElementById(
      "playButton"
    );

  els.pauseButton =
    document.getElementById(
      "pauseButton"
    );

  els.resetButton =
    document.getElementById(
      "resetButton"
    );


  els.programTitle =
    document.getElementById(
      "programTitle"
    );

  els.programInfo =
    document.getElementById(
      "programInfo"
    );


  els.programListSection =
    document.getElementById(
      "programListSection"
    );

  els.programList =
    document.getElementById(
      "programList"
    );

  els.noPrograms =
    document.getElementById(
      "noPrograms"
    );

  els.createProgramButton =
    document.getElementById(
      "createProgramButton"
    );


  els.program =
    document.getElementById(
      "program"
    );


  els.songNavigation =
    document.getElementById(
      "songNavigation"
    );

  els.prevSongButton =
    document.getElementById(
      "prevSongButton"
    );

  els.nextSongButton =
    document.getElementById(
      "nextSongButton"
    );

  els.songCounter =
    document.getElementById(
      "songCounter"
    );


  els.programEditor =
    document.getElementById(
      "programEditor"
    );

  els.programNameInput =
    document.getElementById(
      "programNameInput"
    );

  els.programDateInput =
    document.getElementById(
      "programDateInput"
    );

  els.saveProgramButton =
    document.getElementById(
      "saveProgramButton"
    );

  els.deleteProgramButton =
    document.getElementById(
      "deleteProgramButton"
    );


  els.addSongButton =
    document.getElementById(
      "addSongButton"
    );

  els.songEditors =
    document.getElementById(
      "songEditors"
    );


  els.authModal =
    document.getElementById(
      "authModal"
    );

  els.closeAuthButton =
    document.getElementById(
      "closeAuthButton"
    );

  els.authEmail =
    document.getElementById(
      "authEmail"
    );

  els.authPassword =
    document.getElementById(
      "authPassword"
    );

  els.loginButton =
    document.getElementById(
      "loginButton"
    );

  els.signupButton =
    document.getElementById(
      "signupButton"
    );

  els.authMessage =
    document.getElementById(
      "authMessage"
    );


  els.databaseStatus =
    document.getElementById(
      "databaseStatus"
    );

  els.toast =
    document.getElementById(
      "toast"
    );
}


/* ==================================================
   EVENTS
   ================================================== */

function bindEvents() {

  els.themeToggle.addEventListener(
    "click",
    toggleTheme
  );


  els.fontMinus.addEventListener(
    "click",
    () =>
      changeFontSize(-1)
  );

  els.fontPlus.addEventListener(
    "click",
    () =>
      changeFontSize(1)
  );


  els.speedMinus.addEventListener(
    "click",
    () =>
      changeGlobalSpeed(-1)
  );

  els.speedPlus.addEventListener(
    "click",
    () =>
      changeGlobalSpeed(1)
  );

  els.applySpeedAll.addEventListener(
    "click",
    applySpeedToAll
  );


  els.playButton.addEventListener(
    "click",
    play
  );

  els.pauseButton.addEventListener(
    "click",
    pause
  );

  els.resetButton.addEventListener(
    "click",
    reset
  );


  els.prevSongButton.addEventListener(
    "click",
    () =>
      goToSong(
        currentSongIndex - 1
      )
  );

  els.nextSongButton.addEventListener(
    "click",
    () =>
      goToSong(
        currentSongIndex + 1
      )
  );


  els.createProgramButton.addEventListener(
    "click",
    createProgram
  );


  els.saveProgramButton.addEventListener(
    "click",
    saveProgram
  );


  els.deleteProgramButton.addEventListener(
    "click",
    deleteCurrentProgram
  );


  els.addSongButton.addEventListener(
    "click",
    addSong
  );


  els.authButton.addEventListener(
    "click",
    openAuthModal
  );

  els.logoutButton.addEventListener(
    "click",
    logout
  );


  els.closeAuthButton.addEventListener(
    "click",
    closeAuthModal
  );


  document
    .querySelector(
      "[data-close-auth]"
    )
    .addEventListener(
      "click",
      closeAuthModal
    );


  els.loginButton.addEventListener(
    "click",
    login
  );

  els.signupButton.addEventListener(
    "click",
    signup
  );


  document.addEventListener(
    "keydown",
    handleKeyboard
  );


  window.addEventListener(
    "resize",
    createEndSpacer
  );


  supabaseClient.auth.onAuthStateChange(
    (_event, session) => {

      currentUser =
        session?.user || null;

      updateUI();

      renderProgramList();

      renderEditors();

    }
  );
}


/* ==================================================
   AUTH
   ================================================== */

async function checkSession() {

  setStatus(
    "Подключение...",
    "neutral"
  );


  const {
    data,
    error
  } =
    await supabaseClient.auth.getSession();


  if (error) {

    console.error(error);

    setStatus(
      "Ошибка подключения",
      "error"
    );

    return;
  }


  currentUser =
    data.session?.user || null;


  setStatus(
    "База подключена",
    "online"
  );
}


/* =========================
   LOGIN
   ========================= */

async function login() {

  const email =
    els.authEmail.value.trim();

  const password =
    els.authPassword.value;


  if (
    !email ||
    !password
  ) {

    els.authMessage.textContent =
      "Введите email и пароль.";

    return;
  }


  setAuthLoading(true);


  els.authMessage.textContent =
    "Выполняется вход...";


  const {
    error
  } =
    await supabaseClient.auth
      .signInWithPassword({
        email,
        password
      });


  setAuthLoading(false);


  if (error) {

    console.error(error);

    els.authMessage.textContent =
      error.message;

    return;
  }


  closeAuthModal();


  showToast(
    "Вы вошли в систему."
  );


  await loadPrograms();

  updateUI();
}


/* =========================
   SIGN UP
   ========================= */

async function signup() {

  const email =
    els.authEmail.value.trim();

  const password =
    els.authPassword.value;


  if (
    !email ||
    !password
  ) {

    els.authMessage.textContent =
      "Введите email и пароль.";

    return;
  }


  if (
    password.length < 6
  ) {

    els.authMessage.textContent =
      "Пароль должен содержать минимум 6 символов.";

    return;
  }


  setAuthLoading(true);


  els.authMessage.textContent =
    "Создание аккаунта...";


  const {
    data,
    error
  } =
    await supabaseClient.auth
      .signUp({
        email,
        password
      });


  setAuthLoading(false);


  if (error) {

    console.error(error);

    els.authMessage.textContent =
      error.message;

    return;
  }


  if (data.session) {

    closeAuthModal();

    currentUser =
      data.session.user;

    showToast(
      "Аккаунт создан."
    );

  } else {

    els.authMessage.textContent =
      "Аккаунт создан. Проверьте почту и подтвердите email.";

  }
}


/* =========================
   LOGOUT
   ========================= */

async function logout() {

  pause();


  const {
    error
  } =
    await supabaseClient.auth.signOut();


  if (error) {

    showToast(
      "Ошибка выхода: " +
        error.message
    );

    return;
  }


  currentUser = null;

  updateUI();

  renderEditors();

  showToast(
    "Вы вышли."
  );
}


/* =========================
   AUTH MODAL
   ========================= */

function openAuthModal() {

  els.authMessage.textContent =
    "";

  els.authModal.classList.remove(
    "hidden"
  );

  els.authModal.setAttribute(
    "aria-hidden",
    "false"
  );

  setTimeout(
    () =>
      els.authEmail.focus(),
    50
  );
}


function closeAuthModal() {

  els.authModal.classList.add(
    "hidden"
  );

  els.authModal.setAttribute(
    "aria-hidden",
    "true"
  );
}


function setAuthLoading(
  loading
) {

  els.loginButton.disabled =
    loading;

  els.signupButton.disabled =
    loading;
}


/* ==================================================
   PROGRAMS
   ================================================== */

async function loadPrograms() {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("programs")
      .select(
        "id, title, service_date, created_at, updated_at"
      )
      .order(
        "service_date",
        {
          ascending: false,
          nullsFirst: false
        }
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(error);

    setStatus(
      "Ошибка базы",
      "error"
    );

    showToast(
      "Не удалось загрузить программы: " +
        error.message
    );

    programs = [];

    return;
  }


  programs =
    data || [];


  setStatus(
    "База подключена",
    "online"
  );


  renderProgramList();
}


/* =========================
   URL PROGRAM
   ========================= */

async function loadProgramFromUrl() {

  const params =
    new URLSearchParams(
      window.location.search
    );


  const programId =
    params.get(
      "program"
    );


  if (
    programId
  ) {

    const program =
      programs.find(
        item =>
          item.id ===
          programId
      );


    if (program) {

      await openProgram(
        program.id,
        false
      );

      return;
    }


    showToast(
      "Программа не найдена."
    );

    return;
  }


  if (
    programs.length
  ) {

    await openProgram(
      programs[0].id,
      false
    );

  } else {

    renderEmptyProgram();

  }
}


/* =========================
   OPEN PROGRAM
   ========================= */

async function openProgram(
  programId,
  updateUrl = true
) {

  const program =
    programs.find(
      item =>
        item.id ===
        programId
    );


  if (!program) {
    return;
  }


  pause();


  currentProgram =
    program;


  if (updateUrl) {

    const url =
      new URL(
        window.location.href
      );

    url.searchParams.set(
      "program",
      program.id
    );

    window.history.pushState(
      {},
      "",
      url
    );
  }


  await loadSongsForProgram(
    program.id
  );


  currentSongIndex =
    0;


  renderProgram();

  renderEditors();

  updateProgramHeader();

  updateUI();


  window.scrollTo({
    top: 0,
    behavior: "auto"
  });
}


/* =========================
   LOAD PROGRAM SONGS
   ========================= */

async function loadSongsForProgram(
  programId
) {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("program_songs")
      .select(
        `
        id,
        position,
        song_id,
        songs (
          id,
          title,
          text,
          speed,
          created_at,
          updated_at
        )
        `
      )
      .eq(
        "program_id",
        programId
      )
      .order(
        "position",
        {
          ascending: true
        }
      );


  if (error) {

    console.error(error);

    showToast(
      "Не удалось загрузить песни: " +
        error.message
    );

    songs = [];

    return;
  }


  songs =
    (data || [])
      .map(
        item => {

          const song =
            item.songs;

          if (!song) {
            return null;
          }

          return {

            id: song.id,

            title:
              song.title,

            text:
              song.text || "",

            speed:
              clamp(
                Number(
                  song.speed
                ) ||
                  DEFAULT_SPEED,

                MIN_SPEED,

                MAX_SPEED
              ),

            programSongId:
              item.id,

            position:
              item.position

          };

        }
      )
      .filter(Boolean);


  if (
    songs.length
  ) {

    globalSpeed =
      songs[0].speed;

  }
}


/* ==================================================
   CREATE PROGRAM
   ================================================== */

async function createProgram() {

  if (!currentUser) {

    openAuthModal();

    return;
  }


  const title =
    prompt(
      "Название нового служения:",
      "Восхваление"
    );


  if (
    !title ||
    !title.trim()
  ) {

    return;
  }


  const {
    data,
    error
  } =
    await supabaseClient
      .from("programs")
      .insert({
        title:
          title.trim(),

        service_date:
          null
      })
      .select()
      .single();


  if (error) {

    console.error(error);

    showToast(
      "Не удалось создать программу: " +
        error.message
    );

    return;
  }


  programs.unshift(
    data
  );


  await openProgram(
    data.id,
    true
  );


  showToast(
    "Программа создана."
  );
}


/* ==================================================
   SAVE PROGRAM
   ================================================== */

async function saveProgram() {

  if (
    !currentUser ||
    !currentProgram
  ) {

    return;
  }


  const title =
    els.programNameInput.value.trim();

  const date =
    els.programDateInput.value ||
    null;


  if (!title) {

    showToast(
      "Введите название служения."
    );

    return;
  }


  const {
    error
  } =
    await supabaseClient
      .from("programs")
      .update({

        title:
          title,

        service_date:
          date,

        updated_at:
          new Date().toISOString()

      })
      .eq(
        "id",
        currentProgram.id
      );


  if (error) {

    console.error(error);

    showToast(
      "Не удалось сохранить программу: " +
        error.message
    );

    return;
  }


  currentProgram.title =
    title;

  currentProgram.service_date =
    date;


  const index =
    programs.findIndex(
      item =>
        item.id ===
        currentProgram.id
    );


  if (
    index !== -1
  ) {

    programs[index] =
      currentProgram;

  }


  updateProgramHeader();

  renderProgramList();

  showToast(
    "Программа сохранена."
  );
}


/* ==================================================
   DELETE PROGRAM
   ================================================== */

async function deleteCurrentProgram() {

  if (
    !currentUser ||
    !currentProgram
  ) {

    return;
  }


  const confirmed =
    confirm(
      `Удалить программу «${currentProgram.title}»?`
    );


  if (!confirmed) {
    return;
  }


  const programId =
    currentProgram.id;


  const {
    error
  } =
    await supabaseClient
      .from("programs")
      .delete()
      .eq(
        "id",
        programId
      );


  if (error) {

    console.error(error);

    showToast(
      "Не удалось удалить программу: " +
        error.message
    );

    return;
  }


  programs =
    programs.filter(
      item =>
        item.id !==
        programId
    );


  currentProgram =
    null;

  songs = [];

  pause();


  const url =
    new URL(
      window.location.href
    );

  url.searchParams.delete(
    "program"
  );

  window.history.pushState(
    {},
    "",
    url
  );


  if (
    programs.length
  ) {

    await openProgram(
      programs[0].id,
      true
    );

  } else {

    renderEmptyProgram();

  }


  renderProgramList();

  showToast(
    "Программа удалена."
  );
}


/* ==================================================
   PROGRAM LIST
   ================================================== */

function renderProgramList() {

  if (!els.programList) {
    return;
  }


  if (
    !programs.length
  ) {

    els.programList.innerHTML =
      "";

    els.noPrograms.classList.remove(
      "hidden"
    );

    return;
  }


  els.noPrograms.classList.add(
    "hidden"
  );


  els.programList.innerHTML =
    programs
      .map(
        program => {

          const active =
            currentProgram &&
            currentProgram.id ===
              program.id;


          return `

            <article
              class="program-card ${
                active
                  ? "active"
                  : ""
              }"
            >

              <div
                class="program-card-main"
              >

                <h3
                  class="program-card-title"
                >
                  ${escapeHtml(
                    program.title
                  )}
                </h3>


                ${
                  program.service_date
                    ? `
                      <div
                        class="program-card-date"
                      >
                        ${formatDate(
                          program.service_date
                        )}
                      </div>
                    `
                    : ""
                }

              </div>


              <div
                class="program-card-actions"
              >

                <button
                  class="program-open-button"
                  data-program-open="${
                    program.id
                  }"
                >
                  Открыть
                </button>


                <button
                  class="program-copy-button"
                  data-program-copy="${
                    program.id
                  }"
                >
                  Ссылка
                </button>

              </div>

            </article>

          `;

        }
      )
      .join("");


  els.programList
    .querySelectorAll(
      "[data-program-open]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () =>
            openProgram(
              button.dataset.programOpen,
              true
            )
        );

      }
    );


  els.programList
    .querySelectorAll(
      "[data-program-copy]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () =>
            copyProgramLink(
              button.dataset.programCopy
            )
        );

      }
    );
}


/* =========================
   COPY PROGRAM LINK
   ========================= */

async function copyProgramLink(
  programId
) {

  const url =
    new URL(
      window.location.href
    );


  url.searchParams.set(
    "program",
    programId
  );


  try {

    await navigator.clipboard.writeText(
      url.toString()
    );

    showToast(
      "Ссылка скопирована."
    );

  } catch {

    prompt(
      "Скопируйте ссылку:",
      url.toString()
    );

  }
}


/* ==================================================
   SONG CRUD
   ================================================== */

async function addSong() {

  if (
    !currentUser ||
    !currentProgram
  ) {

    openAuthModal();

    return;
  }


  const title =
    `Новая песня ${
      songs.length + 1
    }`;


  const {
    data: song,
    error
  } =
    await supabaseClient
      .from("songs")
      .insert({

        title:
          title,

        text:
          "",

        speed:
          globalSpeed

      })
      .select()
      .single();


  if (error) {

    console.error(error);

    showToast(
      "Не удалось создать песню: " +
        error.message
    );

    return;
  }


  const position =
    songs.length;


  const {
    data: relation,
    error:
      relationError
  } =
    await supabaseClient
      .from("program_songs")
      .insert({

        program_id:
          currentProgram.id,

        song_id:
          song.id,

        position:
          position

      })
      .select()
      .single();


  if (
    relationError
  ) {

    console.error(
      relationError
    );


    await supabaseClient
      .from("songs")
      .delete()
      .eq(
        "id",
        song.id
      );


    showToast(
      "Не удалось добавить песню в программу."
    );

    return;
  }


  songs.push({

    id:
      song.id,

    title:
      song.title,

    text:
      song.text || "",

    speed:
      Number(
        song.speed
      ) ||
      DEFAULT_SPEED,

    programSongId:
      relation.id,

    position:
      position

  });


  renderProgram();

  renderEditors();

  updateUI();


  showToast(
    "Песня добавлена."
  );
}


/* =========================
   DELETE SONG
   ========================= */

async function deleteSong(
  songId
) {

  if (
    !currentUser ||
    !currentProgram
  ) {

    return;
  }


  const song =
    songs.find(
      item =>
        item.id ===
        songId
    );


  if (!song) {
    return;
  }


  if (
    !confirm(
      `Удалить песню «${song.title}» из этой программы?`
    )
  ) {

    return;
  }


  const {
    error:
      relationError
  } =
    await supabaseClient
      .from("program_songs")
      .delete()
      .eq(
        "id",
        song.programSongId
      );


  if (
    relationError
  ) {

    console.error(
      relationError
    );

    showToast(
      "Не удалось удалить песню из программы."
    );

    return;
  }


  const {
    error:
      songError
  } =
    await supabaseClient
      .from("songs")
      .delete()
      .eq(
        "id",
        songId
      );


  if (
    songError
  ) {

    console.error(
      songError
    );

    showToast(
      "Песня убрана из программы, но не удалена из базы."
    );

  }


  songs =
    songs.filter(
      item =>
        item.id !==
        songId
    );


  songs.forEach(
    (
      item,
      index
    ) => {

      item.position =
        index;

    }
  );


  await saveSongPositions();


  currentSongIndex =
    Math.min(
      currentSongIndex,
      Math.max(
        0,
        songs.length - 1
      )
    );


  renderProgram();

  renderEditors();

  updateUI();


  showToast(
    "Песня удалена."
  );
}


/* =========================
   SAVE POSITIONS
   ========================= */

async function saveSongPositions() {

  for (
    const song of songs
  ) {

    await supabaseClient
      .from("program_songs")
      .update({
        position:
          song.position
      })
      .eq(
        "id",
        song.programSongId
      );

  }
}


/* ==================================================
   SONG EDITOR
   ================================================== */

function renderEditors() {

  if (
    !currentUser ||
    !currentProgram
  ) {

    els.songEditors.innerHTML =
      "";

    els.addSongButton.classList.add(
      "hidden"
    );

    els.programEditor.classList.add(
      "hidden"
    );

    return;
  }


  els.addSongButton.classList.remove(
    "hidden"
  );

  els.programEditor.classList.remove(
    "hidden"
  );


  els.programNameInput.value =
    currentProgram.title ||
    "";


  els.programDateInput.value =
    currentProgram.service_date ||
    "";


  els.songEditors.innerHTML =
    songs
      .map(
        (
          song,
          index
        ) => `

          <article
            class="editor-card"
            data-editor-id="${
              song.id
            }"
          >

            <div
              class="editor-head"
            >

              <h3>
                Песня ${
                  String(
                    index + 1
                  ).padStart(
                    2,
                    "0"
                  )
                }
              </h3>


              <button
                class="delete-button"
                data-action="delete-song"
                data-id="${
                  song.id
                }"
              >
                Удалить
              </button>

            </div>


            <div
              class="editor-field"
            >

              <label>
                Название
              </label>


              <input
                class="editor-input"
                data-field="title"
                data-id="${
                  song.id
                }"
                type="text"
                value="${
                  escapeAttribute(
                    song.title
                  )
                }"
                placeholder="Название песни"
              >

            </div>


            <div
              class="editor-field"
            >

              <label>
                Текст и аккорды
              </label>


              <textarea
                class="editor-textarea"
                data-field="text"
                data-id="${
                  song.id
                }"
                placeholder="Вставьте текст прямо из Word / Notes..."
              >${
                escapeHtml(
                  song.text
                )
              }</textarea>

            </div>


            <div
              class="editor-footer"
            >

              <div
                class="editor-speed"
              >

                <span>
                  Скорость
                </span>


                <button
                  class="small-button"
                  data-action="speed-minus"
                  data-id="${
                    song.id
                  }"
                >
                  −
                </button>


                <input
                  class="speed-input"
                  data-field="speed"
                  data-id="${
                    song.id
                  }"
                  type="number"
                  min="${MIN_SPEED}"
                  max="${MAX_SPEED}"
                  value="${
                    song.speed
                  }"
                >


                <button
                  class="small-button"
                  data-action="speed-plus"
                  data-id="${
                    song.id
                  }"
                >
                  +
                </button>


                <span>
                  px/с
                </span>

              </div>

            </div>

          </article>

        `
      )
      .join("");


  attachEditorEvents();
}


/* =========================
   EDITOR EVENTS
   ========================= */

function attachEditorEvents() {

  els.songEditors
    .querySelectorAll(
      "[data-field='title']"
    )
    .forEach(
      input => {

        input.addEventListener(
          "change",
          () =>
            saveSongField(
              input
            )
        );

      }
    );


  els.songEditors
    .querySelectorAll(
      "[data-field='text']"
    )
    .forEach(
      textarea => {

        textarea.addEventListener(
          "change",
          () =>
            saveSongField(
              textarea
            )
        );

      }
    );


  els.songEditors
    .querySelectorAll(
      "[data-field='speed']"
    )
    .forEach(
      input => {

        input.addEventListener(
          "change",
          () =>
            saveSongField(
              input
            )
        );

      }
    );


  els.songEditors
    .querySelectorAll(
      "[data-action='delete-song']"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () =>
            deleteSong(
              button.dataset.id
            )
        );

      }
    );


  els.songEditors
    .querySelectorAll(
      "[data-action='speed-minus']"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () =>
            changeSongSpeed(
              button.dataset.id,
              -1
            )
        );

      }
    );


  els.songEditors
    .querySelectorAll(
      "[data-action='speed-plus']"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () =>
            changeSongSpeed(
              button.dataset.id,
              1
            )
        );

      }
    );
}


/* =========================
   SAVE SONG FIELD
   ========================= */

async function saveSongField(
  element
) {

  const id =
    element.dataset.id;

  const field =
    element.dataset.field;


  const song =
    songs.find(
      item =>
        item.id ===
        id
    );


  if (
    !song ||
    !currentUser
  ) {

    return;
  }


  let value =
    element.value;


  if (
    field ===
    "speed"
  ) {

    value =
      clamp(
        Number(
          value
        ) ||
          DEFAULT_SPEED,

        MIN_SPEED,

        MAX_SPEED
      );


    element.value =
      value;

  }


  song[field] =
    value;


  try {

    await supabaseClient
      .from("songs")
      .update({

        [field]:
          value,

        updated_at:
          new Date().toISOString()

      })
      .eq(
        "id",
        song.id
      );


    renderProgram();

    updateUI();

    showToast(
      "Сохранено."
    );

  } catch (error) {

    console.error(
      error
    );

    showToast(
      "Ошибка сохранения."
    );
  }
}


/* =========================
   CHANGE SONG SPEED
   ========================= */

async function changeSongSpeed(
  id,
  delta
) {

  const song =
    songs.find(
      item =>
        item.id ===
        id
    );


  if (
    !song ||
    !currentUser
  ) {

    return;
  }


  song.speed =
    clamp(
      song.speed + delta,

      MIN_SPEED,

      MAX_SPEED
    );


  try {

    await supabaseClient
      .from("songs")
      .update({

        speed:
          song.speed,

        updated_at:
          new Date().toISOString()

      })
      .eq(
        "id",
        song.id
      );


    renderEditors();

    renderProgram();

    updateUI();

  } catch (error) {

    console.error(
      error
    );

    showToast(
      "Ошибка сохранения скорости."
    );
  }
}


/* ==================================================
   RENDER PROGRAM
   ================================================== */

function renderProgram() {

  if (
    !currentProgram
  ) {

    renderEmptyProgram();

    return;
  }


  if (
    !songs.length
  ) {

    els.program.innerHTML = `

      <div
        class="empty-state"
      >

        <h2>
          В этой программе пока нет песен
        </h2>

        <p>
          ${
            currentUser
              ? "Добавьте первую песню ниже."
              : "Войдите, чтобы добавить песни."
          }
        </p>

      </div>

    `;

    els.songNavigation.classList.add(
      "hidden"
    );

    createEndSpacer();

    return;
  }


  els.songNavigation.classList.remove(
    "hidden"
  );


  els.program.innerHTML =
    songs
      .map(
        (
          song,
          index
        ) => `

          <section
            class="song"
            data-song-id="${
              song.id
            }"
            data-song-index="${
              index
            }"
          >

            <header
              class="song-header"
            >

              <div>

                <div
                  class="song-number"
                >
                  ${
                    String(
                      index + 1
                    ).padStart(
                      2,
                      "0"
                    )
                  }
                </div>


                <h2
                  class="song-title"
                >
                  ${
                    escapeHtml(
                      song.title ||
                        "Без названия"
                    )
                  }
                </h2>

              </div>


              <div
                class="song-speed-badge"
              >
                ${
                  song.speed
                } px/с
              </div>

            </header>


            <pre
              class="lyrics-text"
            >${
              escapeHtml(
                song.text ||
                  ""
              )
            }</pre>

          </section>

        `
      )
      .join("");


  createEndSpacer();

  detectCurrentSong();

  updateFontSize();

  updateUI();
}


/* =========================
   EMPTY PROGRAM
   ========================= */

function renderEmptyProgram() {

  currentProgram =
    null;

  songs = [];

  els.program.innerHTML = `

    <div
      class="empty-state"
    >

      <h2>
        Выберите программу
      </h2>

      <p>
      из списка выше.
      </p>

    </div>

  `;


  els.programEditor.classList.add(
    "hidden"
  );

  els.songEditors.innerHTML =
    "";

  els.addSongButton.classList.add(
    "hidden"
  );

  els.songNavigation.classList.add(
    "hidden"
  );


  els.programTitle.textContent =
    "Выберите программу";

  els.programInfo.textContent =
    "Создайте программу служения";
}


/* ==================================================
   PROGRAM HEADER
   ================================================== */

function updateProgramHeader() {

  if (
    !currentProgram
  ) {

    return;
  }


  els.programTitle.textContent =
    currentProgram.title;


  els.programInfo.textContent =
    currentProgram.service_date
      ? formatDate(
          currentProgram.service_date
        )
      : "Программа служения";
}


/* ==================================================
   SCROLLING
   ================================================== */

function detectCurrentSong() {

  if (
    !songs.length
  ) {

    currentSongIndex =
      0;

    return null;
  }


  const elements =
    document.querySelectorAll(
      ".song"
    );


  let detected =
    0;


  for (
    let i = 0;
    i <
      elements.length;
    i++
  ) {

    const top =
      elements[
        i
      ]
        .getBoundingClientRect()
        .top;


    if (
      top <=
      SWITCH_LINE
    ) {

      detected =
        i;

    } else {

      break;

    }
  }


  currentSongIndex =
    detected;


  return elements[
    detected
  ];
}


function getCurrentSpeed() {

  return (
    songs[
      currentSongIndex
    ]?.speed ||
    DEFAULT_SPEED
  );
}


function hasProgramEnded() {

  if (
    !songs.length
  ) {

    return true;
  }


  const elements =
    document.querySelectorAll(
      ".song"
    );


  const lastSong =
    elements[
      elements.length - 1
    ];


  if (
    !lastSong
  ) {

    return true;
  }


  return (
    lastSong
      .getBoundingClientRect()
      .bottom <=
    SWITCH_LINE
  );
}


function scrollLoop(
  timestamp
) {

  if (
    !isPlaying
  ) {

    return;
  }


  if (
    lastTimestamp ===
    null
  ) {

    lastTimestamp =
      timestamp;
  }


  const deltaTime =
    Math.min(
      (
        timestamp -
        lastTimestamp
      ) / 1000,

      0.05
    );


  lastTimestamp =
    timestamp;


  detectCurrentSong();


  const speed =
    getCurrentSpeed();


  window.scrollBy(
    0,
    speed *
      deltaTime
  );


  detectCurrentSong();


  if (
    hasProgramEnded()
  ) {

    pause();

    return;
  }


  animationFrameId =
    requestAnimationFrame(
      scrollLoop
    );
}


function play() {

  if (
    !songs.length
  ) {

    showToast(
      "В программе нет песен."
    );

    return;
  }


  if (
    isPlaying
  ) {

    return;
  }


  isPlaying =
    true;

  lastTimestamp =
    null;


  animationFrameId =
    requestAnimationFrame(
      scrollLoop
    );


  updateUI();
}


function pause() {

  isPlaying =
    false;

  lastTimestamp =
    null;


  if (
    animationFrameId !==
    null
  ) {

    cancelAnimationFrame(
      animationFrameId
    );

    animationFrameId =
      null;
  }


  updateUI();
}


function reset() {

  pause();


  window.scrollTo({
    top: 0,
    behavior: "auto"
  });


  currentSongIndex =
    0;


  updateUI();
}


/* ==================================================
   NAVIGATION
   ================================================== */

function goToSong(
  index
) {

  if (
    !songs.length
  ) {

    return;
  }


  const targetIndex =
    clamp(
      index,

      0,

      songs.length - 1
    );


  const elements =
    document.querySelectorAll(
      ".song"
    );


  const targetSong =
    elements[
      targetIndex
    ];


  if (
    !targetSong
  ) {

    return;
  }


  currentSongIndex =
    targetIndex;


  const target =
    targetSong
      .getBoundingClientRect()
      .top +
    window.scrollY -
    SWITCH_LINE;


  const maxScroll =
    document.documentElement
      .scrollHeight -
    window.innerHeight;


  window.scrollTo({

    top:
      clamp(
        target,

        0,

        Math.max(
          0,
          maxScroll
        )
      ),

    behavior:
      "smooth"

  });


  updateUI();
}


/* ==================================================
   SPEED
   ================================================== */

function changeGlobalSpeed(
  delta
) {

  globalSpeed =
    clamp(
      globalSpeed + delta,

      MIN_SPEED,

      MAX_SPEED
    );


  updateUI();
}


async function applySpeedToAll() {

  if (
    !songs.length
  ) {

    return;
  }


  if (
    !currentUser ||
    !currentProgram
  ) {

    openAuthModal();

    return;
  }


  try {

    for (
      const song of songs
    ) {

      song.speed =
        globalSpeed;


      await supabaseClient
        .from("songs")
        .update({

          speed:
            globalSpeed,

          updated_at:
            new Date().toISOString()

        })
        .eq(
          "id",
          song.id
        );

    }


    renderEditors();

    renderProgram();

    updateUI();


    showToast(
      "Скорость применена ко всем песням."
    );

  } catch (error) {

    console.error(
      error
    );

    showToast(
      "Не удалось сохранить скорость."
    );
  }
}


/* ==================================================
   FONT
   ================================================== */

function changeFontSize(
  delta
) {

  fontSize =
    clamp(
      fontSize + delta,

      MIN_FONT_SIZE,

      MAX_FONT_SIZE
    );


  localStorage.setItem(
    FONT_STORAGE_KEY,
    fontSize
  );


  updateFontSize();
}


function updateFontSize() {

  document.documentElement.style.setProperty(
    "--lyrics-font-size",

    `${fontSize}px`
  );


  document
    .querySelectorAll(
      ".lyrics-text"
    )
    .forEach(
      element => {

        element.style.fontSize =
          `${fontSize}px`;

      }
    );


  if (
    els.fontSizeValue
  ) {

    els.fontSizeValue.textContent =
      `${fontSize} px`;

  }
}


/* ==================================================
   THEME
   ================================================== */

function applyTheme() {

  const theme =
    localStorage.getItem(
      THEME_STORAGE_KEY
    ) ||
    "light";


  const isDark =
    theme ===
    "dark";


  document.body.classList.toggle(
    "dark-theme",
    isDark
  );


  if (
    els.themeToggle
  ) {

    els.themeToggle.textContent =
      isDark
        ? "☀️"
        : "🌙";
  }
}


function toggleTheme() {

  const isDark =
    document.body.classList.toggle(
      "dark-theme"
    );


  localStorage.setItem(
    THEME_STORAGE_KEY,

    isDark
      ? "dark"
      : "light"
  );


  els.themeToggle.textContent =
    isDark
      ? "☀️"
      : "🌙";
}


/* ==================================================
   UI
   ================================================== */

function updateUI() {

  updateProgramHeader();

  detectCurrentSong();


  els.globalSpeedValue.textContent =
    globalSpeed;


  els.fontSizeValue.textContent =
    `${fontSize} px`;


  const count =
    songs.length;


  els.songCounter.textContent =
    `${
      String(
        count
          ? currentSongIndex + 1
          : 0
      ).padStart(
        2,
        "0"
      )
    } / ${
      String(
        count
      ).padStart(
        2,
        "0"
      )
    }`;


  els.prevSongButton.disabled =
    currentSongIndex <= 0;


  els.nextSongButton.disabled =
    count === 0 ||
    currentSongIndex >=
      count - 1;


  els.playButton.textContent =
    isPlaying
      ? "▶︎ Идёт"
      : "▶︎ Начать";


  if (
    currentUser
  ) {

    els.authButton.classList.add(
      "hidden"
    );

    els.logoutButton.classList.remove(
      "hidden"
    );

    els.createProgramButton.classList.remove(
      "hidden"
    );

  } else {

    els.authButton.classList.remove(
      "hidden"
    );

    els.logoutButton.classList.add(
      "hidden"
    );

    els.createProgramButton.classList.add(
      "hidden"
    );
  }


  document
    .querySelectorAll(
      ".song"
    )
    .forEach(
      (
        element,
        index
      ) => {

        element.classList.toggle(
          "is-current",

          index ===
            currentSongIndex
        );

      }
    );


  updateFontSize();
}


/* ==================================================
   STATUS
   ================================================== */

function setStatus(
  text,
  state
) {

  const dot =
    document.querySelector(
      ".connection-badge .status-dot"
    );


  if (
    dot
  ) {

    dot.classList.remove(
      "online",
      "error"
    );


    if (
      state ===
      "online"
    ) {

      dot.classList.add(
        "online"
      );
    }


    if (
      state ===
      "error"
    ) {

      dot.classList.add(
        "error"
      );
    }
  }


  if (
    els.databaseStatus
  ) {

    els.databaseStatus.textContent =
      state ===
      "error"
        ? "Ошибка Supabase"
        : "Supabase";
  }
}


/* ==================================================
   END SPACER
   ================================================== */

function createEndSpacer() {

  const old =
    document.querySelector(
      ".end-spacer"
    );


  if (
    old
  ) {

    old.remove();
  }


  if (
    !songs.length
  ) {

    return;
  }


  const spacer =
    document.createElement(
      "div"
    );


  spacer.className =
    "end-spacer";


  spacer.style.height =
    `${
      window.innerHeight *
      END_PADDING_RATIO
    }px`;


  els.program.appendChild(
    spacer
  );
}


/* ==================================================
   KEYBOARD
   ================================================== */

function handleKeyboard(
  event
) {

  const active =
    document.activeElement;


  const isTyping =
    active &&
    [
      "INPUT",
      "TEXTAREA",
      "SELECT"
    ].includes(
      active.tagName
    );


  if (
    isTyping
  ) {

    return;
  }


  if (
    event.key ===
    "ArrowLeft"
  ) {

    event.preventDefault();

    goToSong(
      currentSongIndex - 1
    );
  }


  if (
    event.key ===
    "ArrowRight"
  ) {

    event.preventDefault();

    goToSong(
      currentSongIndex + 1
    );
  }
}


/* ==================================================
   HELPERS
   ================================================== */

function clamp(
  value,
  min,
  max
) {

  return Math.min(
    max,

    Math.max(
      min,
      value
    )
  );
}


function escapeHtml(
  value
) {

  return String(value)

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );
}


function escapeAttribute(
  value
) {

  return escapeHtml(
    value
  );
}


function formatDate(
  date
) {

  if (!date) {
    return "";
  }


  const parts =
    date.split("-");


  if (
    parts.length !== 3
  ) {

    return date;
  }


  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}


function showToast(
  message
) {

  clearTimeout(
    toastTimer
  );


  els.toast.textContent =
    message;


  els.toast.classList.add(
    "show"
  );


  toastTimer =
    setTimeout(
      () => {

        els.toast.classList.remove(
          "show"
        );

      },
      2500
    );
}