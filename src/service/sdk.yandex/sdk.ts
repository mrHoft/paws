import { Injectable } from "~/utils/inject"
import type { SDK, MultiplayerSessionsCommitPayload, MultiplayerSessionsMeta } from "./types"

@Injectable
export class YandexGamesService {
  public sdk?: SDK
  private callbacks: ((sdk: SDK) => void)[] = []

  public init = () => {
    const s = document.createElement('script');
    s.src = "/sdk.js";
    s.async = true;
    s.onload = () => {
      console.log('Yandex SDK loaded.')
      YaGames.init().then(sdk => {
        console.log('Yandex SDK initialized.');
        this.sdk = sdk;
        this.emit(sdk)
      });
    };
    document.body.append(s);
  }

  public registerCallback = (callback: (sdk: SDK) => void) => {
    if (this.sdk) {
      callback(this.sdk)
    } else {
      this.callbacks.push(callback)
    }
  }

  private emit = (sdk: SDK) => {
    let callback = this.callbacks.pop()
    while (callback) {
      callback(sdk)
      callback = this.callbacks.pop()
    }
  }

  public ghost = {
    init: () => {
      if (this.sdk) {
        this.sdk.multiplayer.sessions.init({ count: 0 })
      }
    },
    commit: (payload: MultiplayerSessionsCommitPayload) => {
      if (this.sdk) {
        this.sdk.multiplayer.sessions.commit(payload)
      }
    },
    push: (meta: MultiplayerSessionsMeta) => {
      if (this.sdk) {
        this.sdk.multiplayer.sessions.push(meta)
      }
    }
  }
}
