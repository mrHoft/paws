import { Injectable } from "~/utils/inject";

interface GamepadServiceCallbacks {
  onGamepadConnected?: (_gamepad: Gamepad) => void,
  onGamepadDisconnected?: (_gamepad: Gamepad) => void
  onButtonDown?: (_gamepadIndex: number, _buttonIndex: number, _value: number) => void
  onButtonUp?: (_gamepadIndex: number, _buttonIndex: number) => void
  onAxisMoved?: (_gamepadIndex: number, _axisIndex: number, _value: number) => void
}
type CallbackArrays = {
  [K in keyof GamepadServiceCallbacks]-?: Required<GamepadServiceCallbacks>[K][]
}

@Injectable
export class GamepadService {
  private static _instance: GamepadService
  private _gamepads: Map<number, Gamepad> = new Map();
  private animationFrameId: number | null = null;
  private pressed = Array.from({ length: 4 }, () => Array.from({ length: 18 }, () => false))
  private callbacks: CallbackArrays = {
    onGamepadConnected: [],
    onGamepadDisconnected: [],
    onButtonDown: [],
    onButtonUp: [],
    onAxisMoved: []
  }

  constructor() {
    if (!GamepadService._instance) {
      GamepadService._instance = this
    }
    this.setupEventListeners();
    this.startPolling();
  }

  public registerCallbacks = (callbacks: GamepadServiceCallbacks = {}) => {
    if (callbacks.onGamepadConnected) {
      this.callbacks.onGamepadConnected.push(callbacks.onGamepadConnected)
    }
    if (callbacks.onGamepadDisconnected) {
      this.callbacks.onGamepadDisconnected.push(callbacks.onGamepadDisconnected)
    }
    if (callbacks.onButtonDown) {
      this.callbacks.onButtonDown.push(callbacks.onButtonDown)
    } else {  // TODO: Remove
      this.callbacks.onButtonDown.push((gamepadIndex: number, buttonIndex: number, value: number) => {
        console.log(`Gamepad ${gamepadIndex} - Button ${buttonIndex} pressed: ${value}`);
      })
    }
    if (callbacks.onButtonUp) {
      this.callbacks.onButtonUp.push(callbacks.onButtonUp)
    } else {  // TODO: Remove
      this.callbacks.onButtonUp.push((gamepadIndex: number, buttonIndex: number) => {
        console.log(`Gamepad ${gamepadIndex} - Button ${buttonIndex} released`);
      })
    }
    if (callbacks.onAxisMoved) {
      this.callbacks.onAxisMoved.push(callbacks.onAxisMoved)
    }
  }

  private setupEventListeners(): void {
    window.addEventListener('gamepadconnected', (event: GamepadEvent) => {
      this.handleGamepadConnected(event);
    });

    window.addEventListener('gamepaddisconnected', (event: GamepadEvent) => {
      this.handleGamepadDisconnected(event);
    });
  }

  private emitEvent = <K extends keyof GamepadServiceCallbacks>(
    callbackName: K,
    ...args: Parameters<Required<GamepadServiceCallbacks>[K]>
  ) => {
    const callbacks = this.callbacks[callbackName];
    callbacks.forEach(callback => (callback as Function)(...args));
  }

  private handleGamepadConnected = (event: GamepadEvent) => {
    const gamepad = event.gamepad;
    this._gamepads.set(gamepad.index, gamepad);

    console.log(`Gamepad ${gamepad.index} connected: ${gamepad.id}`);
    console.log(`Total gamepads: ${this.gamepadCount}`);

    if ('vibrationActuator' in gamepad) {
      const vibration = gamepad.vibrationActuator as any;
      if (vibration.playEffect) {
        vibration.playEffect('dual-rumble', {
          startDelay: 0,
          duration: 200,
          weakMagnitude: 1.0,
          strongMagnitude: 1.0,
        });
      }
    }

    this.emitEvent('onGamepadConnected', gamepad)
  }

  private handleGamepadDisconnected = (event: GamepadEvent) => {
    const gamepad = event.gamepad;
    this._gamepads.delete(gamepad.index);

    console.log(`Gamepad ${gamepad.index} disconnected: ${gamepad.id}`);
    console.log(`Total gamepads: ${this.gamepadCount}`);

    this.emitEvent('onGamepadDisconnected', gamepad)
  }

  public get gamepadCount(): number {
    return this._gamepads.size;
  }

  public get gamepads(): Gamepad[] {
    return Array.from(this._gamepads.values());
  }

  public isGamepadConnected(index: number): boolean {
    return this._gamepads.has(index);
  }


  private startPolling = () => {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    const detectInput = () => {
      const gamepads = navigator.getGamepads();

      for (const gamepad of gamepads) {
        if (gamepad) {
          const active = this.processGamepadInput(gamepad)
          if (active && !this._gamepads.get(gamepad.index)) {
            this._gamepads.set(gamepad.index, gamepad);

            this.emitEvent('onGamepadConnected', gamepad)
          }
        }
      }

      this.animationFrameId = requestAnimationFrame(detectInput);
    };

    this.animationFrameId = requestAnimationFrame(detectInput);
  }

  private processGamepadInput(gamepad: Gamepad) {
    let active = false
    gamepad.buttons.forEach((button, index) => {
      if (button.pressed) {
        active = true
        if (!this.pressed[gamepad.index][index] || button.value < 1) {
          this.pressed[gamepad.index][index] = true
          this.emitEvent('onButtonDown', gamepad.index, index, button.value)
        }
      } else if (this.pressed[gamepad.index][index]) {
        this.pressed[gamepad.index][index] = false
        this.emitEvent('onButtonUp', gamepad.index, index)
      }
    });

    gamepad.axes.forEach((axis, index) => {
      if (Math.abs(axis) > 0.1) {
        active = true
        this.emitEvent('onAxisMoved', gamepad.index, index, axis)
      }
    });

    return active
  }

  public dispose(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    window.removeEventListener('gamepadconnected', this.handleGamepadConnected);
    window.removeEventListener('gamepaddisconnected', this.handleGamepadDisconnected);

    this._gamepads.clear();
  }
}
