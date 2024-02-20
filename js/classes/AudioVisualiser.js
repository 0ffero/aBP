this.AudioVisualiser = class {
    constructor(selectedType='music') {
        this.gID = vars.getElementByID;

        this.name = 'AudioVisualiser';

        this.types = ['music','voice'];
        if (!this.types.includes(selectedType)) {
            selectedType = 'music';
        };

        this.type = selectedType;

        this.init();
    }

    init() {
        this.canvas = this.gID("visCanvas");
        this.canvasCtx = this.canvas.getContext("2d");

        this.fftSize = 256;
        this.barWidth = this.canvas.width / 64;

        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        this.audioSource = null;
        this.analyser = null;
    }


    animate() {
        if (this.audioPlayer.paused) return;

        this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        const bufferLength = this.analyser.frequencyBinCount; // the number of data values that dictate the number of bars in the canvas. Always exactly one half of the fft size
        const dataArray = new Uint8Array(bufferLength); // convert to 8-bit integer array

        let cH = this.canvas.height;
        let max = 255;
        let barHeight;

        let currentX = 0;
        this.analyser.getByteFrequencyData(dataArray); // copy frequency data into the dataArray

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

    animate2() {
        if (this.audioPlayer.paused) return;

        let ctx = this.canvasCtx;

        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        const bufferLength = this.analyser.frequencyBinCount; // the number of data values that dictate the number of bars in the canvas. Always exactly one half of the fft size
        const dataArray = new Uint8Array(bufferLength); // convert to 8-bit integer array

        this.analyser.getByteTimeDomainData(dataArray); // copy frequency data into the dataArray

        let mid = 128;
        let xCurrent = 0;
        let cY = this.canvas.height/2;
        let xDelta = this.canvas.width/(this.fftSize/2);

        // start the line
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#ffffff';
        ctx.moveTo(xCurrent, cY);

        for (let x=0; x<bufferLength; x++) {
            let val = dataArray[x];

            let m = val<mid ? -1 : 1;
            val = val<mid ? mid-val : val-mid;
            val/=mid;
            val*=m;

            // get the next x,y
            let y = cY+(val*cY);
            xCurrent+=xDelta;
            
            // draw from previous point to this one
            ctx.lineTo(x, y);

        };

        ctx.closePath();
        ctx.stroke();
    }

    animateChoose() {
        switch (this.type) {
            case 'music':
                this.animate();
            break;

            case 'voice':
                this.animate2();
            break;

            default:
                this.animate2();
            break;
        }
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

    switchVisualiserType() {
        let index = this.types.findIndex(t=>t===this.type);
        index = index+1<this.types.length ? index+1 : 0;

        this.type=this.types[index];
    }

    update() {
        if (this.updateInterval) return;

        this.updateInterval = setInterval(()=> {
            this.animateChoose();
        }, 1000/60);
    }

};