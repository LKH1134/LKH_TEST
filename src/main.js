import "./style.css";
import { saveScore, getTop } from "./firebase.js";

const MIN_DELAY_MS = 1000;
const MAX_DELAY_MS = 12000;
const TOP_N = 5;

const app = document.querySelector("#app");

/** @type {"idle" | "leaderboard" | "waiting" | "ready" | "fail" | "result"} */
let phase = "idle";
let waitTimerId = null;
let readyAt = 0;
let lastReactionMs = 0;
let ranking = [];

function scheduleReady() {
  const delay = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
  waitTimerId = setTimeout(() => {
    phase = "ready";
    readyAt = performance.now();
    render();
  }, delay);
}

function startGame() {
  phase = "waiting";
  render();
  scheduleReady();
}

function handleFail() {
  clearTimeout(waitTimerId);
  phase = "fail";
  render();
  setTimeout(startGame, 1200);
}

async function handleSuccess() {
  lastReactionMs = Math.round(performance.now() - readyAt);
  phase = "result";
  ranking = [];
  render();
  try {
    ranking = await getTop(TOP_N);
  } catch (err) {
    console.error("랭킹을 불러오지 못했습니다.", err);
  }
  render();
}

async function showLeaderboard() {
  phase = "leaderboard";
  ranking = [];
  render();
  try {
    ranking = await getTop(TOP_N);
  } catch (err) {
    console.error("랭킹을 불러오지 못했습니다.", err);
  }
  render();
}

function backToIdle() {
  phase = "idle";
  render();
}

function handleScreenClick() {
  if (phase === "waiting") {
    handleFail();
  } else if (phase === "ready") {
    handleSuccess();
  }
}

async function handleSaveScore(nickname, statusEl, buttonEl) {
  buttonEl.disabled = true;
  statusEl.textContent = "저장 중...";
  try {
    await saveScore(nickname, lastReactionMs);
    statusEl.textContent = "저장되었습니다.";
    ranking = await getTop(TOP_N);
    renderRanking();
  } catch (err) {
    console.error("기록 저장에 실패했습니다.", err);
    statusEl.textContent = "저장에 실패했습니다. 다시 시도해주세요.";
    buttonEl.disabled = false;
  }
}

function renderRanking() {
  const rankingEl = document.querySelector(".ranking");
  if (!rankingEl) return;
  const list = rankingEl.querySelector("ol");
  list.innerHTML = "";
  if (ranking.length === 0) {
    const li = document.createElement("li");
    li.textContent = "아직 기록이 없습니다.";
    list.appendChild(li);
    return;
  }
  for (const record of ranking) {
    const li = document.createElement("li");
    li.textContent = `${record.nickname} - ${record.ms}ms`;
    list.appendChild(li);
  }
}

function render() {
  app.innerHTML = "";

  const screen = document.createElement("div");
  screen.className = `screen screen--${phase}`;
  screen.addEventListener("click", handleScreenClick);

  if (phase === "idle") {
    screen.removeEventListener("click", handleScreenClick);

    const title = document.createElement("h1");
    title.textContent = "반응속도 측정기";
    const desc = document.createElement("p");
    desc.textContent = "시작 버튼을 누르면 게임이 시작됩니다.";

    const buttonRow = document.createElement("div");
    buttonRow.className = "idle-buttons";

    const startButton = document.createElement("button");
    startButton.className = "primary-button";
    startButton.textContent = "시작";
    startButton.addEventListener("click", (e) => {
      e.stopPropagation();
      startGame();
    });

    const leaderboardButton = document.createElement("button");
    leaderboardButton.className = "secondary-button";
    leaderboardButton.textContent = "리더보드 보기";
    leaderboardButton.addEventListener("click", (e) => {
      e.stopPropagation();
      showLeaderboard();
    });

    buttonRow.append(startButton, leaderboardButton);
    screen.append(title, desc, buttonRow);
  } else if (phase === "leaderboard") {
    screen.removeEventListener("click", handleScreenClick);

    const title = document.createElement("h1");
    title.textContent = `최고 기록 TOP ${TOP_N}`;

    const rankingEl = document.createElement("div");
    rankingEl.className = "ranking";
    const list = document.createElement("ol");
    rankingEl.append(list);

    const backButton = document.createElement("button");
    backButton.className = "retry-button";
    backButton.textContent = "뒤로가기";
    backButton.addEventListener("click", (e) => {
      e.stopPropagation();
      backToIdle();
    });

    screen.append(title, rankingEl, backButton);
  } else if (phase === "waiting") {
    const title = document.createElement("h1");
    title.textContent = "빨간색으로 바뀔 때까지 기다리세요";
    screen.append(title);
  } else if (phase === "ready") {
    const title = document.createElement("h1");
    title.textContent = "지금 클릭!";
    screen.append(title);
  } else if (phase === "fail") {
    const title = document.createElement("h1");
    title.textContent = "너무 빨랐습니다!";
    const desc = document.createElement("p");
    desc.textContent = "잠시 후 다시 시작합니다...";
    screen.append(title, desc);
  } else if (phase === "result") {
    screen.removeEventListener("click", handleScreenClick);

    const title = document.createElement("h1");
    title.textContent = "결과";
    const time = document.createElement("p");
    time.className = "result-time";
    time.textContent = `${lastReactionMs} ms`;
    screen.append(title, time);

    const form = document.createElement("div");
    form.className = "nickname-form";
    form.addEventListener("click", (e) => e.stopPropagation());

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "닉네임 입력";
    input.maxLength = 20;

    const button = document.createElement("button");
    button.textContent = "기록 저장";

    const status = document.createElement("p");
    status.className = "save-status";

    button.addEventListener("click", () => {
      const nickname = input.value.trim();
      if (!nickname) {
        status.textContent = "닉네임을 입력해주세요.";
        return;
      }
      handleSaveScore(nickname, status, button);
    });

    form.append(input, button);
    screen.append(form, status);

    const rankingEl = document.createElement("div");
    rankingEl.className = "ranking";
    rankingEl.addEventListener("click", (e) => e.stopPropagation());
    const rankingTitle = document.createElement("h2");
    rankingTitle.textContent = `최고 기록 TOP ${TOP_N}`;
    const list = document.createElement("ol");
    rankingEl.append(rankingTitle, list);
    screen.append(rankingEl);

    const retryButton = document.createElement("button");
    retryButton.className = "retry-button";
    retryButton.textContent = "다시하기";
    retryButton.addEventListener("click", (e) => {
      e.stopPropagation();
      startGame();
    });
    screen.append(retryButton);
  }

  app.append(screen);

  if (phase === "result" || phase === "leaderboard") {
    renderRanking();
  }
}

render();
