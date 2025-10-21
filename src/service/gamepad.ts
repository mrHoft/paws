interface GamepadServiceCallbacks {
  onGamepadConnected?: (_gamepad: Gamepad) => void,
  onGamepadDisconnected?: (_gamepad: Gamepad) => void
  onButtonDown?: (_gamepadIndex: number, _buttonIndex: number, _value: number) => void
  onButtonUp?: (_gamepadIndex: number, _buttonIndex: number) => void
  onAxisMoved?: (_gamepadIndex: number, _axisIndex: number, _value: number) => void
}

export class GamepadService {
  private _gamepads: Map<number, Gamepad> = new Map();
  private animationFrameId: number | null = null;
  private callbacks: GamepadServiceCallbacks = {}
  private pressed = Array.from({ length: 4 }, () => Array.from({ length: 18 }, () => false))

  constructor(callbacks: GamepadServiceCallbacks = {}) {
    if (callbacks.onGamepadConnected) {
      this.callbacks.onGamepadConnected = callbacks.onGamepadConnected
    }
    if (callbacks.onGamepadDisconnected) {
      this.callbacks.onGamepadDisconnected = callbacks.onGamepadDisconnected
    }
    if (callbacks.onButtonDown) {
      this.callbacks.onButtonDown = callbacks.onButtonDown
    } else {
      this.callbacks.onButtonDown = (gamepadIndex: number, buttonIndex: number, value: number) => {
        console.log(`Gamepad ${gamepadIndex} - Button ${buttonIndex} pressed: ${value}`);
      }
    }
    if (callbacks.onButtonUp) {
      this.callbacks.onButtonUp = callbacks.onButtonUp
    } else {
      this.callbacks.onButtonUp = (gamepadIndex: number, buttonIndex: number) => {
        console.log(`Gamepad ${gamepadIndex} - Button ${buttonIndex} released`);
      }
    }
    if (callbacks.onAxisMoved) {
      this.callbacks.onAxisMoved = callbacks.onAxisMoved
    }

    this.setupEventListeners();
    this.startPolling();
  }

  private setupEventListeners(): void {
    window.addEventListener('gamepadconnected', (event: GamepadEvent) => {
      this.handleGamepadConnected(event);
    });

    window.addEventListener('gamepaddisconnected', (event: GamepadEvent) => {
      this.handleGamepadDisconnected(event);
    });
  }

  private handleGamepadConnected(event: GamepadEvent): void {
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

    if (this.callbacks.onGamepadConnected) {
      this.callbacks.onGamepadConnected(gamepad);
    }
  }

  private handleGamepadDisconnected(event: GamepadEvent): void {
    const gamepad = event.gamepad;
    this._gamepads.delete(gamepad.index);

    console.log(`Gamepad ${gamepad.index} disconnected: ${gamepad.id}`);
    console.log(`Total gamepads: ${this.gamepadCount}`);

    if (this.callbacks.onGamepadDisconnected) {
      this.callbacks.onGamepadDisconnected(gamepad);
    }
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


  private startPolling(): void {
    const detectInput = () => {
      const gamepads = navigator.getGamepads();

      for (const gamepad of gamepads) {
        if (gamepad) {
          const active = this.processGamepadInput(gamepad)
          if (active && !this._gamepads.get(gamepad.index)) {
            this._gamepads.set(gamepad.index, gamepad);

            if (this.callbacks.onGamepadConnected) {
              this.callbacks.onGamepadConnected(gamepad);
            }
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
          if (this.callbacks.onButtonDown) {
            this.callbacks.onButtonDown(gamepad.index, index, button.value);
          }
        }
      } else if (this.pressed[gamepad.index][index]) {
        this.pressed[gamepad.index][index] = false
        if (this.callbacks.onButtonUp) {
          this.callbacks.onButtonUp(gamepad.index, index);
        }
      }
    });

    if (this.callbacks.onAxisMoved) {
      gamepad.axes.forEach((axis, index) => {
        if (Math.abs(axis) > 0.1) {
          active = true
          this.callbacks.onAxisMoved!(gamepad.index, index, axis);
        }
      });
    }
    return active
  }

  // Clean up when done
  public dispose(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    window.removeEventListener('gamepadconnected', this.handleGamepadConnected);
    window.removeEventListener('gamepaddisconnected', this.handleGamepadDisconnected);

    this._gamepads.clear();
  }
}
