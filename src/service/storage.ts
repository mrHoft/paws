import { Crypt } from "~/utils/crypt"
import { Injectable } from "~/utils/inject"

interface UserData {
  music: number,
  sound: number,
  fps: boolean,
  language: string
}

interface GameData {
  score: number
  stars: number
  caught: Record<string, number>
  upgrades: Record<string, number>
  scene: Record<string, { stars: number, score: number }>
  ach: string[]
}

const defaultUserData: UserData & { data: GameData } = {
  music: 0.5,
  sound: 0.5,
  fps: false,
  language: navigator.language.slice(0, 2) || 'en',
  data: {
    score: 0,
    stars: 0,
    caught: {
      butterfly: 0,
      frog: 0,
      mouse: 0,
      bird: 0,
    },
    upgrades: {
      jump: 0,
      sneak: 0,
      claws: 0,
      speed: 0
    },
    scene: {},
    ach: []
  }
}

@Injectable
export class Storage extends Crypt {
  protected static _instance: Storage;
  protected static STORE_NAME = 'nimblePaws';
  protected _state: UserData & { data: GameData } = { ...defaultUserData };

  constructor() {
    super()
    if (Storage._instance) return Storage._instance;
    Storage._instance = this;

    if (typeof localStorage !== 'undefined') {
      const savedState = localStorage.getItem(Storage.STORE_NAME);
      if (savedState) {
        let parsedData: Partial<UserData> & { data?: string } = {}
        try { parsedData = JSON.parse(savedState) } catch {/* no action */ }

        const { data: encryptedData, ...rest } = parsedData
        this._state = { ...this._state, ...rest }
        if (encryptedData) {
          const data = this.decrypt<GameData>(encryptedData)
          if (data) {
            this._state.data = data
          }
        }
      }
    }
  }

  public getState() {
    return this._state
  }

  public get<T>(key: string) {
    return this.getValue(key) as T;
  }

  public set<T = Record<string, unknown>>(key: string, value: T extends () => void ? never : T | ((_prev: T | undefined) => T)) {
    if (typeof value === 'function') {
      const prev = this.getValue(key) as T | undefined;
      this.setValue(key, value(prev));
    } else {
      this.setValue(key, value);
    }
    this.emit();
  }

  private emit() {
    if (typeof globalThis.window !== 'undefined') {
      const data = this.encrypt(this._state.data)
      const state = JSON.stringify({ ...this._state, data })

      localStorage.setItem(Storage.STORE_NAME, state);
    }
  }

  private setValue = (path: string, value: unknown) => {
    let obj = this._state as unknown as Record<string, unknown>;
    const arr = path.split('.');
    const last = arr.pop();
    arr.forEach(key => {
      if (!obj[key]) obj[key] = {};
      obj = obj[key] as Record<string, unknown>;
    });
    if (last) obj[last] = value;
  };

  private getValue = (path: string): unknown => {
    return path
      .split('.')
      .reduce<Record<string, unknown> | undefined>(
        (obj, key) => (obj && obj[key] !== undefined ? (obj[key] as Record<string, unknown>) : undefined),
        { ...this._state }
      );
  };
}
