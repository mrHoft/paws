interface Color {
  [index: number]: number;
}

interface Frame {
  disposalMethod: number;
  time: number;
  delay: number;
  transparencyIndex?: number;
  leftPos: number;
  topPos: number;
  width: number;
  height: number;
  localColorTableFlag: boolean;
  localColorTable?: Color[];
  interlaced: boolean;
  image: HTMLCanvasElement & { ctx?: CanvasRenderingContext2D };
}

interface GifEvent {
  message: string;
  obj: GifObject;
}

interface ProgressEvent {
  bytesRead: number;
  totalBytes: number;
  frame: number;
}

export interface GifObject {
  onload: ((event: GifEvent) => void) | null;
  onerror: ((event: GifEvent) => void) | null;
  onprogress: ((event: ProgressEvent) => void) | null;
  onloadAll: ((event: GifEvent) => void) | null;
  paused: boolean;
  playing: boolean;
  waitTillDone: boolean;
  loading: boolean;
  firstFrameOnly: boolean;
  width: number | null;
  height: number | null;
  frames: Frame[];
  comment: string;
  length: number;
  currentFrame: number;
  frameCount: number;
  playSpeed: number;
  lastFrame: Frame | null;
  image: HTMLCanvasElement | null;
  playOnLoad: boolean;
  colorRes: number;
  globalColorCount: number;
  bgColorIndex: number;
  globalColorTable?: Color[];
  disposalMethod: number;
  transparencyGiven: boolean;
  delayTime: number;
  transparencyIndex: number;
  cancel?: boolean;
  cancelCallback?: ((event: GifEvent) => void) | null;
  complete: boolean;
  src?: string;

  load: (filename: string) => void;
  cancelLoad: (callback: (event: GifEvent) => void) => boolean;
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  seekFrame: (frame: number) => void;
  togglePlay: () => void;
}

const GIF_FILE = {
  GCExt: 0xf9,
  COMMENT: 0xfe,
  APPExt: 0xff,
  UNKNOWN: 0x01,
  IMAGE: 0x2c,
  EOF: 59,
  EXT: 0x21,
};

export const GifFactory = function (): GifObject {
  let timerID: number;
  let st: Stream;
  const interlaceOffsets = [0, 4, 2, 1];
  const interlaceSteps = [8, 8, 4, 2];
  let interlacedBufSize: number;
  let deInterlaceBuf: Uint8Array;
  let pixelBufSize: number;
  let pixelBuf: Uint8Array;

  class Stream {
    data: Uint8ClampedArray;
    pos: number;
    private len: number;

    constructor(data: ArrayBuffer) {
      this.data = new Uint8ClampedArray(data);
      this.pos = 0;
      this.len = this.data.length;
    }

    getString(count: number): string {
      let s = '';
      while (count--) {
        s += String.fromCharCode(this.data[this.pos++]);
      }
      return s;
    }

    readSubBlocks(): string {
      let size: number;
      let count: number;
      let data = '';
      do {
        count = size = this.data[this.pos++];
        while (count--) {
          data += String.fromCharCode(this.data[this.pos++]);
        }
      } while (size !== 0 && this.pos < this.len);
      return data;
    }

    readSubBlocksB(): number[] {
      let size: number;
      let count: number;
      const data: number[] = [];
      do {
        count = size = this.data[this.pos++];
        while (count--) {
          data.push(this.data[this.pos++]);
        }
      } while (size !== 0 && this.pos < this.len);
      return data;
    }
  }

  function lzwDecode(minSize: number, data: number[]): void {
    let pos = 0;
    let pixelPos = 0;
    let dic: number[][] = [];
    const clear = 1 << minSize;
    const eod = clear + 1;
    let size = minSize + 1;
    let done = false;
    let last: number;
    let code = 0;

    while (!done) {
      last = code;
      code = 0;
      for (let i = 0; i < size; i++) {
        if (data[pos >> 3] & (1 << (pos & 7))) {
          code |= 1 << i;
        }
        pos++;
      }

      if (code === clear) {
        dic = [];
        size = minSize + 1;
        for (let i = 0; i < clear; i++) {
          dic[i] = [i];
        }
        dic[clear] = [];
        dic[eod] = [];
      } else {
        if (code === eod) {
          done = true;
          return;
        }
        if (code >= dic.length) {
          dic.push(dic[last].concat(dic[last][0]));
        } else if (last !== clear) {
          dic.push(dic[last].concat(dic[code][0]));
        }
        const d = dic[code];
        const len = d.length;
        for (let i = 0; i < len; i++) {
          pixelBuf[pixelPos++] = d[i];
        }
        if (dic.length === 1 << size && size < 12) {
          size++;
        }
      }
    }
  }

  function parseColorTable(count: number): Color[] {
    const colors: Color[] = [];
    for (let i = 0; i < count; i++) {
      colors.push([st.data[st.pos++], st.data[st.pos++], st.data[st.pos++]]);
    }
    return colors;
  }

  function parse(): void {
    st.pos += 6;
    gif.width = st.data[st.pos++] + (st.data[st.pos++] << 8);
    gif.height = st.data[st.pos++] + (st.data[st.pos++] << 8);
    const bitField = st.data[st.pos++];
    gif.colorRes = (bitField & 0b1110000) >> 4;
    gif.globalColorCount = 1 << ((bitField & 0b111) + 1);
    gif.bgColorIndex = st.data[st.pos++];
    st.pos++;

    if (bitField & 0b10000000) {
      gif.globalColorTable = parseColorTable(gif.globalColorCount);
    }
    setTimeout(parseBlock, 0);
  }

  function parseAppExt(): void {
    st.pos += 1;
    if ('NETSCAPE' === st.getString(8)) {
      st.pos += 8;
    } else {
      st.pos += 3;
      st.readSubBlocks();
    }
  }

  function parseGCExt(): void {
    st.pos++;
    const bitField = st.data[st.pos++];
    gif.disposalMethod = (bitField & 0b11100) >> 2;
    gif.transparencyGiven = !!(bitField & 0b1);
    gif.delayTime = st.data[st.pos++] + (st.data[st.pos++] << 8);
    gif.transparencyIndex = st.data[st.pos++];
    st.pos++;
  }

  function parseImg(): void {
    const deInterlace = (width: number): void => {
      const lines = pixelBufSize / width;
      let fromLine = 0;
      if (interlacedBufSize !== pixelBufSize) {
        deInterlaceBuf = new Uint8Array(pixelBufSize);
        interlacedBufSize = pixelBufSize;
      }
      for (let pass = 0; pass < 4; pass++) {
        for (let toLine = interlaceOffsets[pass]; toLine < lines; toLine += interlaceSteps[pass]) {
          deInterlaceBuf.set(pixelBuf.subarray(fromLine, fromLine + width), toLine * width);
          fromLine += width;
        }
      }
    };

    const frame: Frame = {
      disposalMethod: gif.disposalMethod,
      time: gif.length,
      delay: gif.delayTime * 10,
      leftPos: 0,
      topPos: 0,
      width: 0,
      height: 0,
      localColorTableFlag: false,
      interlaced: false,
      image: document.createElement('canvas'),
    };

    gif.frames.push(frame);
    gif.length += frame.delay;

    if (gif.transparencyGiven) {
      frame.transparencyIndex = gif.transparencyIndex;
    }

    frame.leftPos = st.data[st.pos++] + (st.data[st.pos++] << 8);
    frame.topPos = st.data[st.pos++] + (st.data[st.pos++] << 8);
    frame.width = st.data[st.pos++] + (st.data[st.pos++] << 8);
    frame.height = st.data[st.pos++] + (st.data[st.pos++] << 8);
    const bitField = st.data[st.pos++];
    frame.localColorTableFlag = !!(bitField & 0b10000000);

    if (frame.localColorTableFlag) {
      frame.localColorTable = parseColorTable(1 << ((bitField & 0b111) + 1));
    }

    if (pixelBufSize !== frame.width * frame.height) {
      pixelBuf = new Uint8Array(frame.width * frame.height);
      pixelBufSize = frame.width * frame.height;
    }

    lzwDecode(st.data[st.pos++], st.readSubBlocksB());

    if (bitField & 0b1000000) {
      frame.interlaced = true;
      deInterlace(frame.width);
    } else {
      frame.interlaced = false;
    }

    processFrame(frame);
  }

  function processFrame(frame: Frame): void {
    frame.image.width = gif.width!;
    frame.image.height = gif.height!;
    const ctx = frame.image.getContext('2d')!;
    frame.image.ctx = ctx;

    const ct = frame.localColorTableFlag ? frame.localColorTable! : gif.globalColorTable!;

    if (gif.lastFrame === null) {
      gif.lastFrame = frame;
    }

    const useT = gif.lastFrame.disposalMethod === 2 || gif.lastFrame.disposalMethod === 3;
    if (!useT) {
      ctx.drawImage(gif.lastFrame.image, 0, 0, gif.width!, gif.height!);
    }

    const imageData = ctx.getImageData(frame.leftPos, frame.topPos, frame.width, frame.height);
    const ti = frame.transparencyIndex;
    const data = imageData.data;
    const pDat = frame.interlaced ? deInterlaceBuf : pixelBuf;
    const pixCount = pDat.length;
    let index = 0;

    for (let i = 0; i < pixCount; i++) {
      const pixel = pDat[i];
      const col = ct[pixel];
      if (ti !== pixel) {
        data[index++] = col[0];
        data[index++] = col[1];
        data[index++] = col[2];
        data[index++] = 255;
      } else if (useT) {
        data[index + 3] = 0;
        index += 4;
      } else {
        index += 4;
      }
    }

    ctx.putImageData(imageData, frame.leftPos, frame.topPos);
    gif.lastFrame = frame;

    if (!gif.waitTillDone && typeof gif.onload === 'function') {
      handleOnload();
    }
  }

  function finished(): void {
    gif.loading = false;
    gif.frameCount = gif.frames.length;
    // gif.lastFrame = null;
    st = undefined!;
    gif.complete = true;
    gif.disposalMethod = undefined!;
    gif.transparencyGiven = undefined!;
    gif.delayTime = undefined!;
    gif.transparencyIndex = undefined!;
    gif.waitTillDone = undefined!;
    pixelBuf = undefined!;
    deInterlaceBuf = undefined!;
    pixelBufSize = undefined!;
    deInterlaceBuf = undefined!;
    gif.currentFrame = 0;

    if (gif.frames.length > 0) {
      gif.image = gif.frames[0].image;
    }

    handleOnload();

    if (typeof gif.onloadAll === 'function') {
      gif.onloadAll.bind(gif)({ message: 'load all', obj: gif });
    }

    if (gif.playOnLoad) {
      gif.play();
    }
  }

  function canceled(): void {
    finished();
    if (typeof gif.cancelCallback === 'function') {
      gif.cancelCallback.bind(gif)({ message: 'canceled', obj: gif });
    }
  }

  function parseExt(): void {
    const blockID = st.data[st.pos++];
    if (blockID === GIF_FILE.GCExt) {
      parseGCExt();
    } else if (blockID === GIF_FILE.COMMENT) {
      gif.comment += st.readSubBlocks();
    } else if (blockID === GIF_FILE.APPExt) {
      parseAppExt();
    } else {
      if (blockID === GIF_FILE.UNKNOWN) {
        st.pos += 13;
      }
      st.readSubBlocks();
    }
  }

  function parseBlock(): void {
    if (gif.cancel === true) {
      canceled();
      return;
    }

    const blockId = st.data[st.pos++];
    if (blockId === GIF_FILE.IMAGE) {
      parseImg();
      if (gif.firstFrameOnly) {
        finished();
        return;
      }
    } else if (blockId === GIF_FILE.EOF) {
      finished();
      return;
    } else {
      parseExt();
    }

    if (typeof gif.onprogress === 'function') {
      gif.onprogress({
        bytesRead: st.pos,
        totalBytes: st.data.length,
        frame: gif.frames.length,
      });
    }

    setTimeout(parseBlock, 0);
  }

  function cancelLoad(callback: (event: GifEvent) => void): boolean {
    if (gif.complete) {
      return false;
    }
    gif.cancelCallback = callback;
    gif.cancel = true;
    return true;
  }

  function error(message: string): void {
    if (typeof gif.onerror === 'function') {
      gif.onerror.bind(gif)({ message, obj: gif });
    }
    gif.onload = gif.onerror = null;
    gif.loading = false;
  }

  function handleOnload(): void {
    gif.currentFrame = 0;
    if (typeof gif.onload === 'function') {
      gif.onload.bind(gif)({ message: 'load', obj: gif });
    }
    gif.onerror = gif.onload = null;
  }

  function dataLoaded(data: ArrayBuffer): void {
    st = new Stream(data);
    parse();
  }

  function loadGif(filename: string): void {
    fetch(filename)
      .then(response => {
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('image/gif')) {
          error('File not found');
          return null;
        }
        if (!response.ok) {
          if (response.status === 404) {
            console.error(filename, 'File not found');
            error('File not found');
          } else {
            error(`Loading error: ${response.status}`);
          }
          return null;
        }
        return response.arrayBuffer();
      })
      .then(arrayBuffer => {
        if (arrayBuffer) {
          dataLoaded(arrayBuffer);
        }
      })
      .catch(() => error('Network error'));

    gif.src = filename;
    gif.loading = true;
  }

  function play(): void {
    if (!gif.playing) {
      gif.paused = false;
      gif.playing = true;
      playing();
    }
  }

  function pause(): void {
    gif.paused = true;
    gif.playing = false;
    clearTimeout(timerID);
  }

  function togglePlay(): void {
    if (gif.paused || !gif.playing) {
      gif.play();
    } else {
      gif.pause();
    }
  }

  function seekFrame(frame: number): void {
    clearTimeout(timerID);
    gif.currentFrame = frame % gif.frames.length;
    if (gif.playing) {
      playing();
    } else {
      gif.image = gif.frames[gif.currentFrame].image;
    }
  }

  function seek(time: number): void {
    clearTimeout(timerID);
    if (time < 0) {
      time = 0;
    }
    time *= 1000;
    time %= gif.length;
    let frame = 0;
    while (time > gif.frames[frame].time + gif.frames[frame].delay && frame < gif.frames.length) {
      frame += 1;
    }
    gif.currentFrame = frame;
    if (gif.playing) {
      playing();
    } else {
      gif.image = gif.frames[gif.currentFrame].image;
    }
  }

  function playing(): void {
    let delay: number;
    let frame: number;
    if (gif.playSpeed === 0) {
      gif.pause();
      return;
    } else {
      if (gif.playSpeed < 0) {
        gif.currentFrame -= 1;
        if (gif.currentFrame < 0) {
          gif.currentFrame = gif.frames.length - 1;
        }
        frame = gif.currentFrame;
        frame -= 1;
        if (frame < 0) {
          frame = gif.frames.length - 1;
        }
        delay = (-gif.frames[frame].delay * 1) / gif.playSpeed;
      } else {
        gif.currentFrame += 1;
        gif.currentFrame %= gif.frames.length;
        delay = (gif.frames[gif.currentFrame].delay * 1) / gif.playSpeed;
      }
      gif.image = gif.frames[gif.currentFrame].image;
      timerID = setTimeout(playing, delay);
    }
  }

  const gif: GifObject = {
    onload: null,
    onerror: null,
    onprogress: null,
    onloadAll: null,
    paused: false,
    playing: false,
    waitTillDone: true,
    loading: false,
    firstFrameOnly: false,
    width: null,
    height: null,
    frames: [],
    comment: '',
    length: 0,
    currentFrame: 0,
    frameCount: 0,
    playSpeed: 1,
    lastFrame: null,
    image: null,
    playOnLoad: true,
    colorRes: 0,
    globalColorCount: 0,
    bgColorIndex: 0,
    disposalMethod: 0,
    transparencyGiven: false,
    delayTime: 0,
    transparencyIndex: 0,
    complete: false,

    load: loadGif,
    cancelLoad,
    play: play,
    pause: pause,
    seek: seek,
    seekFrame: seekFrame,
    togglePlay: togglePlay,
  };

  return gif;
};
