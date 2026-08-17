const DEFAULT_BINDINGS = {
  moveUp: ['ArrowUp', 'KeyW'],
  moveDown: ['ArrowDown', 'KeyS'],
  moveLeft: ['ArrowLeft', 'KeyA'],
  moveRight: ['ArrowRight', 'KeyD'],
  focus: ['ShiftLeft', 'ShiftRight'],
  shot: ['KeyZ', 'Space'],
  bomb: ['KeyX'],
  confirm: ['Enter', 'KeyZ'],
  cancel: ['Escape', 'KeyX'],
  pause: ['Escape'],
};

const PREVENT_DEFAULT = new Set([
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Space',
  'Enter',
  'Escape',
]);

export class InputManager {
  constructor(target = window, bindings = DEFAULT_BINDINGS) {
    this.target = target;
    this.bindings = structuredClone(bindings);
    this.pressed = new Set();
    this.previousPressed = new Set();
    this.enabled = true;

    this.onKeyDown = (event) => {
      if (PREVENT_DEFAULT.has(event.code)) event.preventDefault();
      this.pressed.add(event.code);
    };

    this.onKeyUp = (event) => {
      if (PREVENT_DEFAULT.has(event.code)) event.preventDefault();
      this.pressed.delete(event.code);
    };

    this.onBlur = () => this.pressed.clear();
    target.addEventListener('keydown', this.onKeyDown, { passive: false });
    target.addEventListener('keyup', this.onKeyUp, { passive: false });
    window.addEventListener('blur', this.onBlur);
  }

  endFrame() {
    this.previousPressed = new Set(this.pressed);
  }

  isDown(action) {
    if (!this.enabled) return false;
    const codes = this.bindings[action] ?? [];
    if (codes.some((code) => this.pressed.has(code))) return true;
    return this.isGamepadDown(action);
  }

  wasPressed(action) {
    if (!this.enabled) return false;
    return this.isDown(action) && !this.wasDown(action);
  }

  wasDown(action) {
    const codes = this.bindings[action] ?? [];
    return codes.some((code) => this.previousPressed.has(code));
  }

  getMoveVector() {
    let x = 0;
    let y = 0;
    if (this.isDown('moveLeft')) x -= 1;
    if (this.isDown('moveRight')) x += 1;
    if (this.isDown('moveUp')) y -= 1;
    if (this.isDown('moveDown')) y += 1;

    const pad = this.getActiveGamepad();
    if (pad) {
      const deadzone = 0.2;
      const padX = Math.abs(pad.axes[0] ?? 0) > deadzone ? pad.axes[0] : 0;
      const padY = Math.abs(pad.axes[1] ?? 0) > deadzone ? pad.axes[1] : 0;
      x += padX;
      y += padY;
    }

    const length = Math.hypot(x, y);
    return length > 1 ? { x: x / length, y: y / length } : { x, y };
  }

  getActiveGamepad() {
    if (!navigator.getGamepads) return null;
    return [...navigator.getGamepads()].find(Boolean) ?? null;
  }

  isGamepadDown(action) {
    const pad = this.getActiveGamepad();
    if (!pad) return false;
    const buttonMap = {
      shot: 0,
      confirm: 0,
      bomb: 1,
      cancel: 1,
      focus: 4,
      pause: 9,
    };
    const index = buttonMap[action];
    if (index === undefined) return false;
    return Boolean(pad.buttons[index]?.pressed);
  }

  setBindings(bindings) {
    this.bindings = structuredClone(bindings);
  }

  getBindings() {
    return structuredClone(this.bindings);
  }

  dispose() {
    this.target.removeEventListener('keydown', this.onKeyDown);
    this.target.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
  }
}

export { DEFAULT_BINDINGS };
