let Spinner = class {
    constructor() {
        this.gID = vars.getElementByID;
        this.init();

        this.audioPlayer = vars.player.audioPlayer;
    }
    
    init() {
        this.div = this.gID('spinner');

        this.angle = 0;
        this.turn = 0;
        this.rotateDelta = 45;

        this.animate();
    }

    animate() {
        setInterval(()=> {
            if (this.audioPlayer.paused) return;

            this.angle += this.rotateDelta;
            this.div.style.transform = `rotate(${this.angle}deg)`;

            this.div.className = this.angle%90===45 ? 'rotated' : '';
        }, 1000)
    }
}