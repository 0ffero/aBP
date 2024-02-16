let Player = class {
    constructor() {
        this.gID = vars.getElementByID;
 
        this.loading = false;
        this.playing = false;

        this.init();
    }

    init() {
        this.getAudioButtons();
        this.getAudioPlayer();
        this.getOtherDivs();

        // add reference to the playlist
        this.playListClass = vars.playListClass;
    }

    buttonClick(which) {
        if (!this.playing || this.loading) return;
        
        let inc = 0;
        
        switch (which) {
            case 'sub10m': inc=-600; break;
            case 'sub1m':  inc= -60; break;
            case 'sub10s': inc= -10; break;
            case 'inc10m': inc= 600; break;
            case 'inc1m':  inc=  60; break;
            case 'inc10s': inc=  10; break;
            
            case 'nextTrack': this.playNext(); return; break;
            case 'playPause': this.playPause(); return; break;
            case 'previousTrack': this.playPrevious(); return; break;
            
            default:
                console.warn(`Unknown button: ${which}`);
                return;
            break;
        };
            
        if (!inc) return;
            
        // inc value is valid
        let aP = this.audioPlayer;
        aP.currentTime = Clamp(aP.currentTime+inc,0,aP.duration-1);

        this.savePlaylist();
    }

    changeVolume() {
        vars.player.audioPlayer.muted=false;
    }

    clearUpdatePositionTimeout() {
        clearInterval(this.updatePosTimeout);
    }

    getAudioButtons() {
        let gID = this.gID;
        this.playPauseDiv = gID('playPause');
    }

    getAudioPlayer() {
        let aP = this.audioPlayer = this.gID('audioPlayer');

        aP.addEventListener("ended", () => {
            // the track has ended. stop the SAVE interval
            vars.App.clearAllTimeouts();
            vars.playListClass.loadingRecent = 0;
            // and get the next track
            vars.player.playNext();
        });
        aP.addEventListener("canplay", () => { // the track's loaded and ready to play
            let pV = vars.player;
            if (!pV.loading) return; // make sure this only fires once per load

            pV.loading = false;
            // highlight the loaded track
            vars.playListClass.highlightCurrentlyPlaying();
            // check if we are loading a recent book
            let pLC = vars.playListClass;
            let percent = pLC.loadingRecent;
            aP.currentTime = percent * aP.duration;
            pLC.loadingRecent=0; // reset loading recent var

            aP.play(); // start playing it
            // switch play icon to pause icon
            this.playPauseDiv.innerHTML='<i class="fa-solid fa-pause"></i>';

            // update the screen savers data
            let pCC = vars.UI.playingContainerClass;
            pCC.addDataToDataDiv();

            let fL = vars.UI.folderList;
            fL.highlightCurrentlyPlaying();

            pLC.savePlayListDO(); // save the track position and start the timeout
            pV.updatePositionBar(); // start the updates to the position bar
        });
    }

    getOtherDivs() {
        let gID = this.gID;

        this.playListContainer = gID('playerContainer');
        this.playList = gID('playList');
        this.setPlayListHeight();

        this.positionBar = gID('positionBar');
        this.positionBar.maxWidth=580; // used to scale to the current position in track

        this.currentTrackAndTime = gID('currentTrackAndTime');

        this.saveIconImg = gID('saveIcon');

        this.showPlayerButtonDiv = gID('showPlayer');

        this.countIntDiv = gID('countInt');

        let vC = this.volumeControl = gID('volumeSlider');
        vC.value = vars.App.volume;
        vC.addEventListener("input", (event) => {
            vars.audio.setVolume(event.target.value);
        });
        vC.addEventListener('keydown', (e)=> { e.preventDefault(); return; }); // disable key presses on this div
    }

    getTrackPosition(percent=true) {
        let aP = this.audioPlayer;
        // if theres no duration (no song loaded) return 0 for time and percent;
        // otherwise if we're not returning a percentage, return current time else return percent
        let retVal = !aP.duration ? 0 : !percent ? aP.currentTime : (aP.currentTime/aP.duration*100000|0)/100000;
        
        return retVal;
    }

    playPrevious() {
        if (!this.playing) return;

        let pC = this.playListClass;
        pC.currentlyPlayingIndex = Clamp(pC.currentlyPlayingIndex-2,-1,pC.playList.length-1);
        this.playNext();
    }

    playNext() {
        //if (!this.playing) return;

        let playList = this.playListClass;

        let nextTrack = playList.getNextTrack();
        this.loading = false;
        if (!nextTrack) {
            this.playing = false;
            // mark this book as complete
            playList.setBookToComplete();
            this.playPauseDiv.innerHTML='<i class="fa-solid fa-play"></i>';
            return;
        };

        this.loading = true;
        this.playing = true;
        this.audioPlayer.src = `assets\\AudioBooks\\${nextTrack.folder}\\${nextTrack.fileName}`;
    }

    playPause() {
        if (!this.playing) return;

        let aP = this.audioPlayer;
        aP.paused ? aP.play() : aP.pause();

        this.playPauseDiv.innerHTML = aP.paused ? '<i class="fa-solid fa-play"></i>' : '<i class="fa-solid fa-pause"></i>';
    }

    positionBarClick(e,div) {
        if (!this.playing || this.loading) return;

        let padding=15;
        let maxX = this.positionBar.maxWidth;
        let offsetX = Clamp(e.clientX-div.parentNode.offsetLeft-padding,0,maxX);
        let percent = offsetX/maxX;

        //console.log(offsetX,`Percent: ${percent}`);
        this.skipToPercent(percent);

        this.savePlaylist();
    }

    saveIconFlash() {
        if (this.flashTimeout) {
            clearTimeout(this.flashTimeout);
            delete(this.flashTimeout);
        };
        
        let i = this.saveIconImg;
        i.src = 'assets/images/saveIconSaving.png';
        i.className = 'saveIconFlash';

        this.flashTimeout = setTimeout(()=> {
            i.src = 'assets/images/saveIcon.png';
            i.className = '';
        }, 1000);
    }

    savePlaylist() {
        vars.playListClass.savePlayListDO();
    }

    setPlayListHeight() {
        this.playList.style.height = `${window.innerHeight - 245}px`;
    }

    showPlayerContainer(show=true) {
        let pLC = this.playListContainer;

        let translateString = show ? `translate(0px, 0px)` : `translate(640px, 0px)`;
        pLC.style.transform = translateString;

        this.showPlayerButtonDiv.className='hidden';

        if (show) return;

        // we're hiding the container, create a timeout to show the "show playlist" icon
        let timeout = 1000; // decided by the css transition
        setTimeout(()=> {
            this.showPlayerButtonDiv.className='';
        }, timeout);
    }

    skipToPercent(percent) {
        let aP = this.audioPlayer;
        aP.currentTime = percent*aP.duration;

        // save the new position to local storage
        vars.playListClass.savePlayListDO();
    }

    updateCountIntDiv(newInt) {
        this.countIntDiv.innerHTML = newInt.toString().padStart(2,'0');
    }

    updateCurrentTrackAndTime(msg) {
        this.currentTrackAndTime.innerHTML = msg;
    }

    updatePositionBar() {
        this.updatePosTimeout = setTimeout(()=> {
            if (this.audioPlayer.paused) return;
            
            // get the current position of the audio
            let percent = this.getTrackPosition();
            let widthOfBar = this.positionBar.maxWidth * percent;
            this.positionBar.style.width = `${widthOfBar}px`;

            this.updatePositionBar();
        }, consts.updatePositionBarTimeout);
    }
}