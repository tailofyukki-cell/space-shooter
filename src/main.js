import { AudioManager } from './core/AudioManager.js';
import { InputManager } from './core/InputManager.js';
import { SettingsStore } from './core/SettingsStore.js';
import { GameDataLoader } from './content/GameDataLoader.js';
import { GameWorld } from './gameplay/GameWorld.js';
import { Renderer } from './render/Renderer.js?v=astral-bloom-art-04';

const STEP_SECONDS = 1 / 60;
const MAX_FRAME_SECONDS = 0.12;
const PACK_ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

const elements = {
  canvas: document.querySelector('#game-canvas'),
  loading: document.querySelector('#loading-screen'),
  loadingMessage: document.querySelector('#loading-message'),
  title: document.querySelector('#title-screen'),
  titleText: document.querySelector('#game-title'),
  subtitleText: document.querySelector('#game-subtitle'),
  titleEyebrow: document.querySelector('#title-eyebrow'),
  gameVersion: document.querySelector('#game-version'),
  footerNote: document.querySelector('#footer-note'),
  result: document.querySelector('#result-screen'),
  resultStatus: document.querySelector('#result-status'),
  resultTitle: document.querySelector('#result-title'),
  finalScore: document.querySelector('#final-score'),
  pause: document.querySelector('#pause-screen'),
  settings: document.querySelector('#settings-screen'),
  stageSelect: document.querySelector('#stage-select-screen'),
  stageList: document.querySelector('#stage-list'),
  announcement: document.querySelector('#announce'),
  startButton: document.querySelector('#start-button'),
  stageSelectButton: document.querySelector('#stage-select-button'),
  stageSelectBackButton: document.querySelector('#stage-select-back-button'),
  settingsButton: document.querySelector('#settings-button'),
  settingsBackButton: document.querySelector('#settings-back-button'),
  bgmVolume: document.querySelector('#bgm-volume'),
  bgmVolumeValue: document.querySelector('#bgm-volume-value'),
  seVolume: document.querySelector('#se-volume'),
  seVolumeValue: document.querySelector('#se-volume-value'),
  fullscreenToggle: document.querySelector('#fullscreen-toggle'),
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
  setHidden(elements.settings, true);
  setHidden(elements.stageSelect, true);
  setHidden(elements.announcement, true);
}

async function loadActiveGamePack() {
  const response = await fetch('./content-packs/active-pack.json');
  if (!response.ok) throw new Error('有効なコンテンツパック設定を読み込めませんでした。');

  const selection = await response.json();
  const packId = selection.active;
  if (!PACK_ID_PATTERN.test(packId)) throw new Error('コンテンツパックIDの形式が不正です。');

  try {
    return await new GameDataLoader(`./content-packs/${packId}/`).load();
  } catch (error) {
    const fallbackId = selection.fallback;
    if (!PACK_ID_PATTERN.test(fallbackId) || fallbackId === packId) throw error;
    console.warn(`コンテンツパック「${packId}」を読み込めないため、予備パックを使用します。`, error);
    return new GameDataLoader(`./content-packs/${fallbackId}/`).load();
  }
}

async function bootstrap() {
  try {
    elements.loadingMessage.textContent = 'ゲームパックを読み込んでいます。';
    const data = await loadActiveGamePack();
    const settingsStore = new SettingsStore(data.manifest.id);
    const settings = settingsStore.get();
    const input = new InputManager(window, settings.bindings);
    const audio = new AudioManager(data.manifest.assets, settings);
    const world = new GameWorld(data);
    const renderer = new Renderer(elements.canvas, data);
    const stageId = data.manifest.entryStage;

    elements.titleText.textContent = data.text['game.title'] ?? data.manifest.title;
    elements.subtitleText.textContent = data.text['game.subtitle'] ?? '';
    elements.titleEyebrow.textContent = data.text['game.eyebrow'] ?? 'ORBITAL PURIFICATION PROTOCOL';
    elements.gameVersion.textContent = `${data.manifest.version} PROTOTYPE`;
    elements.footerNote.textContent = data.text['game.footer'] ?? data.manifest.title;
    elements.startButton.textContent = data.text['menu.start'] ?? 'ゲームを開始';
    elements.stageSelectButton.textContent = data.text['menu.stageSelect'] ?? 'ステージ選択';
    elements.settingsButton.textContent = data.text['menu.settings'] ?? '設定';
    elements.retryButton.textContent = data.text['result.retry'] ?? 'もう一度遊ぶ';
    elements.backTitleButton.textContent = data.text['result.title'] ?? 'タイトルへ戻る';
    elements.resumeButton.textContent = data.text['pause.resume'] ?? '再開';
    elements.restartButton.textContent = data.text['pause.restart'] ?? '最初から';
    document.title = data.manifest.title;

    const syncSettingsUi = (current) => {
      elements.bgmVolume.value = String(Math.round(current.bgm * 100));
      elements.bgmVolumeValue.value = `${Math.round(current.bgm * 100)}%`;
      elements.seVolume.value = String(Math.round(current.se * 100));
      elements.seVolumeValue.value = `${Math.round(current.se * 100)}%`;
      elements.fullscreenToggle.checked = current.fullscreen;
    };

    const showTitle = () => {
      audio.stopMusic();
      world.state = 'title';
      input.enabled = true;
      hideTransientScreens();
      setHidden(elements.title, false);
    };

    const startStage = (requestedStageId = stageId) => {
      audio.unlock();
      hideTransientScreens();
      input.enabled = true;
      world.startStage(requestedStageId);
    };

    const showStageSelect = () => {
      elements.stageList.replaceChildren();
      for (const stagePath of data.manifest.stages) {
        const stage = data.stages[stagePath.split('/').pop().replace('.json', '')] ?? Object.values(data.stages).find((candidate) => stagePath.endsWith(`${candidate.id}.json`));
        if (!stage) continue;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'stage-entry';
        button.innerHTML = `<span><strong>${stage.title}</strong><span>${stage.subtitle ?? stage.id}</span></span><em>START</em>`;
        button.addEventListener('click', () => startStage(stage.id));
        elements.stageList.append(button);
      }
      setHidden(elements.title, true);
      setHidden(elements.stageSelect, false);
    };

    const showSettings = () => {
      syncSettingsUi(settingsStore.get());
      setHidden(elements.title, true);
      setHidden(elements.settings, false);
    };

    const applyFullscreen = async (enabled) => {
      const shell = document.querySelector('.game-shell');
      try {
        if (enabled && !document.fullscreenElement) await shell.requestFullscreen();
        if (!enabled && document.fullscreenElement) await document.exitFullscreen();
      } catch (error) {
        console.warn('フルスクリーンを切り替えられませんでした。', error);
      }
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
    world.on('phaseChange', ({ phase }) => announce(phase?.name ?? 'PHASE CHANGE'));
    world.on('music', ({ id }) => audio.playMusic(id));
    world.on('sound', ({ id, volume }) => audio.playEffect(id, { volume }));
    world.on('stageClear', () => showResult('clear', world.player.score));
    world.on('gameOver', ({ score }) => showResult('gameover', score));
    world.on('announce', ({ textKey }) => announce(data.text[textKey] ?? textKey));

    elements.startButton.addEventListener('click', startStage);
    elements.stageSelectButton.addEventListener('click', showStageSelect);
    elements.stageSelectBackButton.addEventListener('click', showTitle);
    elements.settingsButton.addEventListener('click', showSettings);
    elements.settingsBackButton.addEventListener('click', showTitle);
    elements.retryButton.addEventListener('click', startStage);
    elements.backTitleButton.addEventListener('click', showTitle);
    elements.restartButton.addEventListener('click', startStage);
    elements.bgmVolume.addEventListener('input', () => {
      const current = settingsStore.patch({ bgm: Number(elements.bgmVolume.value) / 100 });
      audio.setVolumes(current);
      syncSettingsUi(current);
    });
    elements.seVolume.addEventListener('input', () => {
      const current = settingsStore.patch({ se: Number(elements.seVolume.value) / 100 });
      audio.setVolumes(current);
      syncSettingsUi(current);
    });
    elements.fullscreenToggle.addEventListener('change', async () => {
      const current = settingsStore.patch({ fullscreen: elements.fullscreenToggle.checked });
      await applyFullscreen(current.fullscreen);
      syncSettingsUi(current);
    });
    document.addEventListener('fullscreenchange', () => {
      const current = settingsStore.patch({ fullscreen: Boolean(document.fullscreenElement) });
      syncSettingsUi(current);
    });
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

    syncSettingsUi(settings);
    setHidden(elements.loading, true);
    showTitle();
    requestAnimationFrame(frame);
  } catch (error) {
    console.error(error);
    elements.loadingMessage.textContent = `起動に失敗しました: ${error.message}`;
  }
}

bootstrap();
