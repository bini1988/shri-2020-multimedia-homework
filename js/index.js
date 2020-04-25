
class VideoPlayer {
  constructor(element, url) {
    this.element = element;
    this.url = url;
    this.video = element.querySelector('.player__video');
    this.controls = element.querySelector('.player__controls');
    this.bars = element.querySelector('.player__bars');
    this.barsCanvasCtx = this.bars.getContext('2d');
    this.filters = { brightness: 100, contrast: 100 };

    this.initGUI();
    this.initVideo();

    this.video.addEventListener('volumechange', () => {
      if (!this.audioCtx) {
        this.initBars();
      }
    });
  }

  play() {
    this.video.play();
  }

  initGUI() {
    this.gui = new dat.GUI({ autoPlace: false });

    this.gui.add(this.filters, 'brightness')
      .min(0).max(300).step(10)
      .onChange(() => this.undateFilters());

    this.gui.add(this.filters, 'contrast')
      .min(0).max(300).step(10)
      .onChange(() => this.undateFilters());

    this.controls.appendChild(this.gui.domElement);
  }

  initVideo() {
    if (Hls.isSupported()) {
      this.hls = new Hls();
      this.hls.loadSource(this.url);
      this.hls.attachMedia(this.video);
      this.hls.on(Hls.Events.MANIFEST_PARSED, () => this.play());
    } else if (this.video.canPlayType('application/vnd.apple.mpegurl')) {
      this.video.src = rhis.url;
      this.video.addEventListener('loadedmetadata', () => this.play());
    }
  }

  initBars() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.audioCtx = new AudioContext();
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 1024;

    const source = this.audioCtx.createMediaElementSource(this.video);

    source.connect(this.analyser);
    this.analyser.connect(this.audioCtx.destination);

    this.renderBars();
  }

  renderBars() {
    window.requestAnimationFrame(() => this.renderBars());

    const BARS_WIDTH = 2;
    const BARS_GAP = 1;
    const fbcCount = this.analyser.frequencyBinCount;
    const fbcArr = new Uint8Array(fbcCount);
    const { width, height } = this.bars.getBoundingClientRect();
    const barsCount = Math.floor(width / (BARS_WIDTH + BARS_GAP));

    this.bars.width = width;
    this.bars.height = height;
    this.analyser.getByteFrequencyData(fbcArr);
    this.barsCanvasCtx.clearRect(0, 0, width, height);
    this.barsCanvasCtx.fillStyle = '#2FA1D6';

    for (let i = 0; i < barsCount; i++) {
      const barX = i * (BARS_WIDTH + BARS_GAP)
      const barFbc = fbcArr[Math.floor(i * fbcCount / barsCount)];
      const barHeight = barFbc * height / 255;

      this.barsCanvasCtx.fillRect(barX, height, BARS_WIDTH, -barHeight);
    }
  }

  undateFilters() {
    const {
      brightness = 100,
      contrast = 100,
    } = this.filters;

    this.video.style.filter = `
      brightness(${brightness}%)
      contrast(${contrast}%)
    `;
  }
}

window.onload = function() {
  const players = [
    ['video-1', 'http://localhost:9191/master?url=http%3A%2F%2Flocalhost%3A3102%2Fstreams%2Fsosed%2Fmaster.m3u8'],
    ['video-2', 'http://localhost:9191/live?url=http%3A%2F%2Flocalhost%3A3102%2Fstreams%2Fstairs%2Fmaster.m3u8'],
    ['video-3', 'http://localhost:9191/master?url=http%3A%2F%2Flocalhost%3A3102%2Fstreams%2Fdog%2Fmaster.m3u8'],
    ['video-4', 'http://localhost:9191/live?url=http%3A%2F%2Flocalhost%3A3102%2Fstreams%2Fstreet%2Fmaster.m3u8'],
  ].map(([id, url]) => new VideoPlayer(document.getElementById(id), url));
};
