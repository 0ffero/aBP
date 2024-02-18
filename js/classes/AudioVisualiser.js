this.AudioVisualiser = class {
    constructor() {
        this.gID = vars.getElementByID;

        this.name = 'AudioVisualiser';

        this.init();
    }

    init() {
        this.canvas = this.gID("visCanvas");
        this.canvasCtx = this.canvas.getContext("2d");

        this.fftSize = 512;
        this.barWidth = this.canvas.width / 64;

        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        this.audioSource = null;
        this.analyser = null;
    }


    animate() { // runs every 100ms
        if (this.audioPlayer.paused) return;
        this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        const bufferLength = this.analyser.frequencyBinCount; // the number of data values that dictate the number of bars in the canvas. Always exactly one half of the fft size
        const dataArray = new Uint8Array(bufferLength); // covert to 8-bit integer array

        let cH = this.canvas.height;
        let max = 255;
        let barHeight;

        let currentX = 0;
        this.analyser.getByteFrequencyData(dataArray); // copies frequency data into the dataArray

        for (let i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i];

            const r = (i * barHeight) / 10;
            const g = i * 4;
            const b = barHeight / 4 - 12;
            this.canvasCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            
            let actualHeight = barHeight/max*cH|0;

            this.canvasCtx.fillRect(currentX, this.canvas.height - actualHeight, this.barWidth, actualHeight);
            currentX += this.barWidth;
        };
    }

    clearVisInterval() {
        clearInterval(this.updateInterval);
    }

    describe() {
        console.log(`${this.name}\n${this.description}`);
    }

    start() {
        if (this.updateInterval) return;

        this.update();
    }

    setAudioContext() {
        this.audioPlayer = vars.player.audioPlayer;
        this.audioSource = this.audioCtx.createMediaElementSource(this.audioPlayer); // creates audio node from audio source
        this.analyser = this.audioCtx.createAnalyser(); // create analyser
        this.analyser.fftSize = this.fftSize;
        this.audioSource.connect(this.analyser); // connect audio source to analyser.
        this.analyser.connect(this.audioCtx.destination); // connect analyser to destination (speakers).

        this.start();
    }

    update() {
        if (this.updateInterval) return;

        this.updateInterval = setInterval(()=> {
            this.animate();
        }, 1000/60);
    }

};