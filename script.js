/* =========================================================
   WORSHIP SCROLL
   Dynamic Songs
   Original Chord Formatting
========================================================= */


/* =========================================================
   DOM
========================================================= */

const program =
  document.getElementById("program");

const songEditors =
  document.getElementById("songEditors");

const addSongButton =
  document.getElementById("addSongButton");

const statusElement =
  document.getElementById("status");

const songCounter =
  document.getElementById("songCounter");

const prevSongButton =
  document.getElementById("prevSong");

const nextSongButton =
  document.getElementById("nextSong");

const playButton =
  document.getElementById("playButton");

const pauseButton =
  document.getElementById("pauseButton");

const resetButton =
  document.getElementById("resetButton");

const fontMinus =
  document.getElementById("fontMinus");

const fontPlus =
  document.getElementById("fontPlus");

const fontSizeElement =
  document.getElementById("fontSize");

const globalSpeedInput =
  document.getElementById("globalSpeed");

const globalSpeedMinus =
  document.getElementById("globalSpeedMinus");

const globalSpeedPlus =
  document.getElementById("globalSpeedPlus");

const applyAllButton =
  document.getElementById("applyAll");


/* =========================================================
   SETTINGS
========================================================= */

const MIN_SPEED = 1;

const MAX_SPEED = 100;

const DEFAULT_SPEED = 18;

const MIN_FONT_SIZE = 14;

const MAX_FONT_SIZE = 60;


/*
   Невидимая линия,
   на которой происходит
   переключение песни.
*/

const SWITCH_LINE = 140;


/*
   Дополнительное пространство
   после последней песни.
*/

const END_PADDING_RATIO = 1;


const SONGS_STORAGE_KEY =
  "worship-scroll-songs";

const FONT_STORAGE_KEY =
  "worship-scroll-font-size";


/* =========================================================
   STATE
========================================================= */

let songs = [];

let isPlaying = false;

let animationFrame = null;

let lastTimestamp = null;

let currentSongIndex = 0;


let fontSize =
  Number(
    localStorage.getItem(
      FONT_STORAGE_KEY
    )
  ) || 22;


/* =========================================================
   SONG DATA
========================================================= */

function createSongData(
  title = "",
  text = "",
  speed = DEFAULT_SPEED
) {

  return {

    id:
      Date.now().toString(36) +
      Math.random()
        .toString(36)
        .slice(2),

    title,

    text,

    speed

  };

}


/* =========================================================
   STORAGE
========================================================= */

function saveSongs() {

  localStorage.setItem(
    SONGS_STORAGE_KEY,
    JSON.stringify(songs)
  );

}


function loadSongs() {

  const saved =
    localStorage.getItem(
      SONGS_STORAGE_KEY
    );


  if (!saved) {

    songs = [];

    return;

  }


  try {

    const parsed =
      JSON.parse(saved);


    if (
      Array.isArray(parsed)
    ) {

      songs = parsed;

    } else {

      songs = [];

    }

  } catch (error) {

    console.error(
      "Ошибка загрузки песен:",
      error
    );

    songs = [];

  }

}


/* =========================================================
   ADD SONG
========================================================= */

function addSong() {

  songs.push(
    createSongData(
      `Песня ${songs.length + 1}`,
      "",
      DEFAULT_SPEED
    )
  );


  saveSongs();

  renderEditors();

  renderProgram();


  const editors =
    document.querySelectorAll(
      ".song-editor"
    );


  const lastEditor =
    editors[
      editors.length - 1
    ];


  if (lastEditor) {

    lastEditor.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

  }

}


/* =========================================================
   DELETE SONG
========================================================= */

function deleteSong(index) {

  if (
    !songs[index]
  ) {

    return;

  }


  const title =
    songs[index].title ||
    "Без названия";


  if (
    !confirm(
      `Удалить песню «${title}»?`
    )
  ) {

    return;

  }


  songs.splice(
    index,
    1
  );


  if (
    currentSongIndex >=
    songs.length
  ) {

    currentSongIndex =
      Math.max(
        0,
        songs.length - 1
      );

  }


  saveSongs();

  renderEditors();

  renderProgram();

  updateUI();

}


/* =========================================================
   RENDER EDITORS
========================================================= */

function renderEditors() {

  songEditors.innerHTML = "";


  /*
     Если песен пока нет
  */

  if (!songs.length) {

    const empty =
      document.createElement(
        "div"
      );


    empty.className =
      "empty-state";


    empty.innerHTML = `

      <div
        style="
          font-size:40px;
          margin-bottom:10px;
        "
      >
        ＋
      </div>

      <div>
        Добавьте первую песню
      </div>

    `;


    songEditors.appendChild(
      empty
    );


    return;

  }


  /*
     Создаём редактор
     каждой песни
  */

  songs.forEach(
    (song, index) => {

      const editor =
        document.createElement(
          "div"
        );


      editor.className =
        "song-editor";


      editor.innerHTML = `

        <div class="song-editor-top">

          <div class="song-number">
            ${String(index + 1).padStart(2, "0")}
          </div>


          <input
            class="song-title-input"
            type="text"
            placeholder="Название песни"
            data-index="${index}"
          >


          <button
            class="delete-song-button"
            title="Удалить песню"
            data-delete="${index}"
          >
            ×
          </button>

        </div>


        <textarea
          class="song-text-input"
          placeholder="Вставьте сюда текст песни вместе с аккордами..."
          data-index="${index}"
        ></textarea>


        <div class="song-editor-bottom">

          <div class="editor-hint">

            Просто вставьте текст как есть.
            Пробелы и переносы строк сохранятся.

          </div>


          <div class="song-speed-editor">

            <span>
              Скорость:
            </span>


            <button
              class="small-button speed-minus"
              data-index="${index}"
            >
              −
            </button>


            <input
              class="song-speed-input"
              type="number"
              min="${MIN_SPEED}"
              max="${MAX_SPEED}"
              data-index="${index}"
            >


            <button
              class="small-button speed-plus"
              data-index="${index}"
            >
              +
            </button>


            <span>
              px/s
            </span>

          </div>

        </div>

      `;


      /*
         Заполняем значения
         через DOM.

         Так текст с символами
         < > & и т.д.
         не ломает HTML.
      */

      const titleInput =
        editor.querySelector(
          ".song-title-input"
        );


      titleInput.value =
        song.title || "";


      const textInput =
        editor.querySelector(
          ".song-text-input"
        );


      textInput.value =
        song.text || "";


      const speedInput =
        editor.querySelector(
          ".song-speed-input"
        );


      speedInput.value =
        song.speed;


      songEditors.appendChild(
        editor
      );

    }
  );


  attachEditorEvents();

}


/* =========================================================
   EDITOR EVENTS
========================================================= */

function attachEditorEvents() {


  /* =========================
     TITLE
  ========================== */

  document
    .querySelectorAll(
      ".song-title-input"
    )
    .forEach(input => {

      input.addEventListener(
        "input",
        () => {

          const index =
            Number(
              input.dataset.index
            );


          if (
            !songs[index]
          ) {

            return;

          }


          songs[index].title =
            input.value;


          saveSongs();

          renderProgram();

        }
      );

    });


  /* =========================
     TEXT
  ========================== */

  document
    .querySelectorAll(
      ".song-text-input"
    )
    .forEach(textarea => {

      textarea.addEventListener(
        "input",
        () => {

          const index =
            Number(
              textarea.dataset.index
            );


          if (
            !songs[index]
          ) {

            return;

          }


          /*
             Здесь сохраняется
             абсолютно весь текст:

             пробелы
             табы
             пустые строки
             переносы
             скобки
             тире
             и т.д.
          */

          songs[index].text =
            textarea.value;


          saveSongs();

          renderProgram();

        }
      );

    });


  /* =========================
     DELETE
  ========================== */

  document
    .querySelectorAll(
      "[data-delete]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          deleteSong(
            Number(
              button.dataset.delete
            )
          );

        }
      );

    });


  /* =========================
     SPEED MINUS
  ========================== */

  document
    .querySelectorAll(
      ".speed-minus"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const index =
            Number(
              button.dataset.index
            );


          setSongSpeed(
            index,
            songs[index].speed - 1
          );

        }
      );

    });


  /* =========================
     SPEED PLUS
  ========================== */

  document
    .querySelectorAll(
      ".speed-plus"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const index =
            Number(
              button.dataset.index
            );


          setSongSpeed(
            index,
            songs[index].speed + 1
          );

        }
      );

    });


  /* =========================
     SPEED INPUT
  ========================== */

  document
    .querySelectorAll(
      ".song-speed-input"
    )
    .forEach(input => {

      input.addEventListener(
        "change",
        () => {

          const index =
            Number(
              input.dataset.index
            );


          setSongSpeed(
            index,
            Number(
              input.value
            )
          );

        }
      );

    });

}


/* =========================================================
   SET SONG SPEED
========================================================= */

function setSongSpeed(
  index,
  value
) {

  if (
    !songs[index]
  ) {

    return;

  }


  value =
    Math.max(
      MIN_SPEED,
      Math.min(
        MAX_SPEED,
        Number(value) || DEFAULT_SPEED
      )
    );


  songs[index].speed =
    value;


  saveSongs();

  renderEditors();

  renderProgram();

  updateUI();

}


/* =========================================================
   RENDER SONG TEXT
========================================================= */

/*
   ВАЖНО.

   Никакого разбора строк.

   Никаких [G].

   Никакого изменения текста.

   Просто берём оригинальный
   текст и помещаем его
   внутрь <pre>.

   Поэтому:

               H
   Ты нашёл меня, и избавлен я
      E               F#       H
   Тобой, Спаситель мой.

   останется именно таким.
*/

function renderSongText(text) {

  if (!text) {

    return `
      <div class="empty-song">
        Добавьте текст песни
      </div>
    `;

  }


  return `

    <pre class="lyrics-text">${escapeHtml(text)}</pre>

  `;

}


/* =========================================================
   RENDER PROGRAM
========================================================= */

function renderProgram() {

  program.innerHTML = "";


  songs.forEach(
    (song, index) => {

      const section =
        document.createElement(
          "section"
        );


      section.className =
        "song";


      section.dataset.index =
        index;


      section.dataset.speed =
        song.speed;


      section.dataset.defaultSpeed =
        song.speed;


      section.dataset.songId =
        song.id;


      section.innerHTML = `

        <div class="song-header">

          <div class="song-number-display">
            SONG ${String(index + 1).padStart(2, "0")}
          </div>


          <h2 class="song-title">
            ${escapeHtml(
              song.title ||
              "Без названия"
            )}
          </h2>


          <div class="song-speed-display">
            Скорость: ${song.speed} px/s
          </div>

        </div>


        <div class="lyrics">

          ${renderSongText(
            song.text
          )}

        </div>

      `;


      program.appendChild(
        section
      );

    }
  );


  createEndSpacer();

  updateUI();

}


/* =========================================================
   END SPACER
========================================================= */

function createEndSpacer() {

  const oldSpacer =
    document.querySelector(
      ".end-spacer"
    );


  if (oldSpacer) {

    oldSpacer.remove();

  }


  const spacer =
    document.createElement(
      "div"
    );


  spacer.className =
    "end-spacer";


  spacer.style.height =
    `${window.innerHeight * END_PADDING_RATIO}px`;


  program.appendChild(
    spacer
  );

}


/* =========================================================
   DETECT CURRENT SONG
========================================================= */

function detectCurrentSong() {

  if (!songs.length) {

    currentSongIndex = 0;

    return null;

  }


  const songElements =
    document.querySelectorAll(
      ".song"
    );


  let detected = 0;


  /*
     Ищем последнюю песню,
     которая пересекла
     SWITCH_LINE.
  */

  for (
    let i = 0;
    i < songElements.length;
    i++
  ) {

    const top =
      songElements[i]
        .getBoundingClientRect()
        .top;


    if (
      top <= SWITCH_LINE
    ) {

      detected = i;

    } else {

      break;

    }

  }


  currentSongIndex =
    detected;


  return songElements[
    detected
  ];

}


/* =========================================================
   GET CURRENT SPEED
========================================================= */

function getCurrentSpeed() {

  if (!songs.length) {

    return DEFAULT_SPEED;

  }


  return Number(
    songs[
      currentSongIndex
    ]?.speed ||
    DEFAULT_SPEED
  );

}


/* =========================================================
   PROGRAM END
========================================================= */

function hasProgramEnded() {

  const songElements =
    document.querySelectorAll(
      ".song"
    );


  if (!songElements.length) {

    return false;

  }


  const lastSong =
    songElements[
      songElements.length - 1
    ];


  const bottom =
    lastSong
      .getBoundingClientRect()
      .bottom;


  return (
    bottom <= SWITCH_LINE
  );

}


/* =========================================================
   PLAY
========================================================= */

function play() {

  if (!songs.length) {

    statusElement.textContent =
      "Добавьте песни";

    return;

  }


  /*
     Если программа закончилась,
     Play начинает сначала.
  */

  if (
    hasProgramEnded()
  ) {

    window.scrollTo({
      top: 0,
      behavior: "auto"
    });


    currentSongIndex = 0;

  }


  isPlaying = true;

  lastTimestamp = null;


  statusElement.textContent =
    "Воспроизведение";


  cancelAnimationFrame(
    animationFrame
  );


  animationFrame =
    requestAnimationFrame(
      scrollLoop
    );

}


/* =========================================================
   PAUSE
========================================================= */

function pause() {

  isPlaying = false;


  cancelAnimationFrame(
    animationFrame
  );


  animationFrame = null;

  lastTimestamp = null;


  detectCurrentSong();

  updateUI();


  statusElement.textContent =
    "Пауза";

}


/* =========================================================
   RESET
========================================================= */

function reset() {

  pause();


  window.scrollTo({
    top: 0,
    behavior: "auto"
  });


  currentSongIndex = 0;


  statusElement.textContent =
    "Готово";


  updateUI();

}


/* =========================================================
   SCROLL LOOP
========================================================= */

function scrollLoop(timestamp) {

  if (!isPlaying) {

    return;

  }


  if (!lastTimestamp) {

    lastTimestamp =
      timestamp;

  }


  const deltaTime =
    (
      timestamp -
      lastTimestamp
    ) / 1000;


  lastTimestamp =
    timestamp;


  /*
     Определяем текущую песню
  */

  detectCurrentSong();


  /*
     Получаем её индивидуальную
     скорость.
  */

  const speed =
    getCurrentSpeed();


  /*
     Автоматический скролл.

     speed = px / second
  */

  window.scrollBy(
    0,
    speed * deltaTime
  );


  /*
     Проверяем,
     не перешли ли мы
     на следующую песню.
  */

  detectCurrentSong();

  updateUI();


  /*
     Проверяем конец
     всей программы.
  */

  if (
    hasProgramEnded()
  ) {

    isPlaying = false;


    cancelAnimationFrame(
      animationFrame
    );


    animationFrame = null;


    currentSongIndex =
      songs.length - 1;


    statusElement.textContent =
      "Программа завершена";


    updateUI();


    return;

  }


  animationFrame =
    requestAnimationFrame(
      scrollLoop
    );

}


/* =========================================================
   NAVIGATION
========================================================= */

function goToSong(index) {

  if (!songs.length) {

    return;

  }


  index =
    Math.max(
      0,
      Math.min(
        songs.length - 1,
        index
      )
    );


  const songElements =
    document.querySelectorAll(
      ".song"
    );


  const song =
    songElements[index];


  if (!song) {

    return;

  }


  const target =
    song.getBoundingClientRect().top +
    window.scrollY -
    SWITCH_LINE;


  const maxScroll =
    document.documentElement
      .scrollHeight -
    window.innerHeight;


  const finalPosition =
    Math.max(
      0,
      Math.min(
        target,
        maxScroll
      )
    );


  window.scrollTo({

    top:
      finalPosition,

    behavior:
      "smooth"

  });


  currentSongIndex =
    index;


  updateUI();

}


function previousSong() {

  goToSong(
    currentSongIndex - 1
  );

}


function nextSong() {

  goToSong(
    currentSongIndex + 1
  );

}


/* =========================================================
   GLOBAL SPEED
========================================================= */

function changeGlobalSpeed(
  amount
) {

  let value =
    Number(
      globalSpeedInput.value
    ) ||
    DEFAULT_SPEED;


  value += amount;


  value =
    Math.max(
      MIN_SPEED,
      Math.min(
        MAX_SPEED,
        value
      )
    );


  globalSpeedInput.value =
    value;

}


/* =========================================================
   APPLY SPEED TO ALL
========================================================= */

function applySpeedToAll() {

  let speed =
    Number(
      globalSpeedInput.value
    ) ||
    DEFAULT_SPEED;


  speed =
    Math.max(
      MIN_SPEED,
      Math.min(
        MAX_SPEED,
        speed
      )
    );


  songs.forEach(
    song => {

      song.speed =
        speed;

    }
  );


  saveSongs();

  renderEditors();

  renderProgram();


  statusElement.textContent =
    `Скорость ${speed} px/s применена ко всем`;

}


/* =========================================================
   FONT SIZE
========================================================= */

function updateFontSize() {

  document.documentElement
    .style
    .setProperty(
      "--font-size",
      `${fontSize}px`
    );


  fontSizeElement.textContent =
    `${fontSize} px`;


  localStorage.setItem(
    FONT_STORAGE_KEY,
    fontSize
  );

}


function changeFontSize(
  amount
) {

  fontSize += amount;


  fontSize =
    Math.max(
      MIN_FONT_SIZE,
      Math.min(
        MAX_FONT_SIZE,
        fontSize
      )
    );


  updateFontSize();

}


/* =========================================================
   UI
========================================================= */

function updateUI() {

  if (!songs.length) {

    songCounter.textContent =
      "00 / 00";

    return;

  }


  songCounter.textContent =
    `${String(
      currentSongIndex + 1
    ).padStart(2, "0")} / ${String(
      songs.length
    ).padStart(2, "0")}`;

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

  return String(
    value ?? ""
  )

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    );

}


/* =========================================================
   EVENTS
========================================================= */


/* ADD SONG */

addSongButton.addEventListener(
  "click",
  addSong
);


/* PLAY */

playButton.addEventListener(
  "click",
  play
);


/* PAUSE */

pauseButton.addEventListener(
  "click",
  pause
);


/* RESET */

resetButton.addEventListener(
  "click",
  reset
);


/* PREVIOUS */

prevSongButton.addEventListener(
  "click",
  previousSong
);


/* NEXT */

nextSongButton.addEventListener(
  "click",
  nextSong
);


/* FONT MINUS */

fontMinus.addEventListener(
  "click",
  () => {

    changeFontSize(-1);

  }
);


/* FONT PLUS */

fontPlus.addEventListener(
  "click",
  () => {

    changeFontSize(1);

  }
);


/* GLOBAL SPEED MINUS */

globalSpeedMinus.addEventListener(
  "click",
  () => {

    changeGlobalSpeed(-1);

  }
);


/* GLOBAL SPEED PLUS */

globalSpeedPlus.addEventListener(
  "click",
  () => {

    changeGlobalSpeed(1);

  }
);


/* APPLY ALL */

applyAllButton.addEventListener(
  "click",
  applySpeedToAll
);


/* =========================================================
   KEYBOARD
========================================================= */

document.addEventListener(
  "keydown",
  event => {

    const tag =
      document.activeElement?.tagName;


    /*
       Когда пользователь пишет
       в песню — стрелки должны
       работать как обычные
       стрелки внутри textarea.
    */

    if (
      tag === "INPUT" ||
      tag === "TEXTAREA"
    ) {

      return;

    }


    if (
      event.key === "ArrowLeft"
    ) {

      previousSong();

    }


    if (
      event.key === "ArrowRight"
    ) {

      nextSong();

    }

  }
);


/* =========================================================
   SCROLL
========================================================= */

window.addEventListener(
  "scroll",
  () => {

    if (!isPlaying) {

      detectCurrentSong();

      updateUI();

    }

  }
);


/* =========================================================
   RESIZE
========================================================= */

window.addEventListener(
  "resize",
  () => {

    createEndSpacer();

  }
);


/* =========================================================
   INIT
========================================================= */

loadSongs();

updateFontSize();

renderEditors();

renderProgram();

updateUI();