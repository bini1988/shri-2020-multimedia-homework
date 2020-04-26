
class VideoPlayer {
  constructor(element, url) {
    this.element = element;
    this.url = url;
    this.wrap = element.querySelector('.players__wrap');
    this.video = element.querySelector('.player__video');
    this.controls = element.querySelector('.player__controls');
    this.bars = element.querySelector('.player__bars');
    this.barsCanvasCtx = this.bars.getContext('2d');
    this.filters = { brightness: 100, contrast: 100 };
    this.isFullScreen = false;

    this.initGUI();
    this.initVideo();

    this.video.addEventListener('volumechange', () => {
      if (!this.audioCtx) {
        this.initBars();
      }
    });

    this.element.addEventListener('transitionend', () => {
      this.wrap.style.zIndex = null;
      this.wrap.style.transition = null;
      this.wrap.style.transform = null;
      this.element.classList.toggle("player--fullscreen", this.isFullScreen);
      this.gui.show();
    });
  }

  play() {
    this.video.play();
  }

  initGUI() {
    this.gui = new dat.GUI({ autoPlace: false });

    this.gui.add(this.filters, 'brightness')
      .name('Brightness, %')
      .min(0).max(300).step(10)
      .onChange(() => this.undateFilters());

    this.gui.add(this.filters, 'contrast')
      .name('Contrast, %')
      .min(0).max(300).step(10)
      .onChange(() => this.undateFilters());

    this.fullscreenGui = this.gui.add(this, 'fullscreen')
      .name('To Full Screen');

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

  calcFullScreenTransform(element) {
    const { x, y, width, height } = element.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const scaleX = windowWidth / width;
    const scaleY = windowHeight / height;
    const scale = `scale(${scaleX}, ${scaleY})`;
    const translateX = ((width * scaleX - width) * 0.5  - x) / scaleX;
    const translateY = ((height * scaleY - height) * 0.5 - y) / scaleY;
    const translate = `translate3d(${translateX}px, ${translateY}px, 0px)`;

    return `${scale} ${translate}`;
  }

  fullscreen() {
    this.isFullScreen = !this.isFullScreen;
    this.gui.hide();

    if (this.isFullScreen) {
      this.fullscreenGui.name('Exit Full Screen');

      this.wrap.style.zIndex = 100;
      this.wrap.style.transition = 'all 0.3s ease-in-out';
      this.wrap.style.transform = this.calcFullScreenTransform(this.wrap);
    } else {
      this.fullscreenGui.name('To Full Screen');

      this.wrap.style.zIndex = 100;
      this.wrap.style.transform = this.calcFullScreenTransform(this.element);
      this.element.classList.remove("player--fullscreen");

      requestAnimationFrame(() => {
        this.wrap.style.transition = 'all 0.3s ease-in-out';
        this.wrap.style.transform = 'scale(1) translate3d(0px, 0px, 0px)';
      });
    }
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
