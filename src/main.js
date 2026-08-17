import { InputManager } from './core/InputManager.js';
import { GameDataLoader } from './content/GameDataLoader.js';
import { GameWorld } from './gameplay/GameWorld.js';
import { Renderer } from './render/Renderer.js';

const STEP_SECONDS = 1 / 60;
const MAX_FRAME_SECONDS = 0.12;

const elements = {
  canvas: document.querySelector('#game-canvas'),
  loading: document.querySelector('#loading-screen'),
  loadingMessage: document.querySelector('#loading-message'),
  title: document.querySelector('#title-screen'),
  titleText: document.querySelector('#game-title'),
  subtitleText: document.querySelector('#game-subtitle'),
  result: document.querySelector('#result-screen'),
  resultStatus: document.querySelector('#result-status'),
  resultTitle: document.querySelector('#result-title'),
  finalScore: document.querySelector('#final-score'),
  pause: document.querySelector('#pause-screen'),
  announcement: document.querySelector('#announce'),
  startButton: document.querySelector('#start-button'),
  retryButton: document.querySelector('#retry-button'),
  backTitleButton: document.querySelector('#back-title-button'),
  resumeButton: document.querySelector('#resume-button'),
  restartButton: document.querySelector('#restart-button'),
};

function setHidden(element, hidden) {
  element.classList.toggle('hidden', hidden);
}

function hideTransientScreens() {
  setHidden(elements.title, true);
  setHidden(elements.result, true);
  setHidden(elements.pause, true);
  setHidden(elements.announcement, true);
}

async function bootstrap() {
  try {
    elements.loadingMessage.textContent = 'ゲームパックを読み込んでいます。';
    const data = await new GameDataLoader('./game-data/').load();
    const input = new InputManager(window);
    const world = new GameWorld(data);
    const renderer = new Renderer(elements.canvas, data);
    const stageId = data.manifest.entryStage;

    elements.titleText.textContent = data.text['game.title'] ?? data.manifest.title;
    elements.subtitleText.textContent = data.text['game.subtitle'] ?? '';
    document.title = data.manifest.title;

    const showTitle = () => {
      world.state = 'title';
      input.enabled = true;
      hideTransientScreens();
      setHidden(elements.title, false);
    };

    const startStage = () => {
      hideTransientScreens();
      input.enabled = true;
      world.startStage(stageId);
    };

    const showResult = (kind, score) => {
      input.enabled = false;
      setHidden(elements.pause, true);
      setHidden(elements.result, false);
      elements.resultStatus.textContent = kind === 'clear' ? 'STAGE CLEAR' : 'MISSION FAILED';
      elements.resultTitle.textContent = kind === 'clear'
        ? (world.stage?.title ?? 'STAGE CLEAR')
        : (data.text['result.gameOver'] ?? 'GAME OVER');
      elements.finalScore.textContent = String(score).padStart(8, '0');
      elements.retryButton.focus();
    };

    const announce = (text) => {
      elements.announcement.textContent = text;
      setHidden(elements.announcement, false);
      window.setTimeout(() => setHidden(elements.announcement, true), 2200);
    };

    world.on('explosion', ({ x, y, boss }) => {
      renderer.burst(x, y, {
        color: boss ? '#efadff' : '#ffc1d0',
        count: boss ? 62 : 18,
        power: boss ? 210 : 105,
      });
    });
    world.on('hit', ({ x, y, color }) => renderer.burst(x, y, { color, count: 5, power: 42 }));
    world.on('playerHit', ({ x, y }) => renderer.burst(x, y, { color: '#f9fdff', count: 42, power: 180 }));
    world.on('bomb', ({ x, y }) => renderer.burst(x, y, { color: '#91f8ff', count: 48, power: 220 }));
    world.on('graze', ({ x, y }) => renderer.burst(x, y, { color: '#c5e7ff', count: 3, power: 34 }));
    world.on('stageClear', () => showResult('clear', world.player.score));
    world.on('gameOver', ({ score }) => showResult('gameover', score));
    world.on('announce', ({ textKey }) => announce(data.text[textKey] ?? textKey));

    elements.startButton.addEventListener('click', startStage);
    elements.retryButton.addEventListener('click', startStage);
    elements.backTitleButton.addEventListener('click', showTitle);
    elements.restartButton.addEventListener('click', startStage);
    elements.resumeButton.addEventListener('click', () => {
      world.resume();
      setHidden(elements.pause, true);
    });

    let accumulator = 0;
    let previousTimestamp = performance.now();
    const update = (dt) => {
      if (world.state === 'playing' && input.wasPressed('pause')) {
        world.pause();
        setHidden(elements.pause, false);
      } else if (world.state === 'paused' && (input.wasPressed('pause') || input.wasPressed('confirm'))) {
        world.resume();
        setHidden(elements.pause, true);
      } else if (world.state === 'title' && input.wasPressed('confirm')) {
        startStage();
      }
      world.update(dt, input);
      renderer.update(dt);
      input.endFrame();
    };

    const frame = (timestamp) => {
      const elapsed = Math.min((timestamp - previousTimestamp) / 1000, MAX_FRAME_SECONDS);
      previousTimestamp = timestamp;
      accumulator += elapsed;
      while (accumulator >= STEP_SECONDS) {
        update(STEP_SECONDS);
        accumulator -= STEP_SECONDS;
      }
      renderer.render(world);
      requestAnimationFrame(frame);
    };

    setHidden(elements.loading, true);
    showTitle();
    requestAnimationFrame(frame);
  } catch (error) {
    console.error(error);
    elements.loadingMessage.textContent = `起動に失敗しました: ${error.message}`;
  }
}

bootstrap();
