"use strict"
var vars = {
    version: 1.0,

    DEBUG: true,

    init: ()=> {
        vars.App.init();
    },

    files: {
        audioBooks: [],
        getFilesHTTPRequest: null
    },

    getElementByID(id) {
        if (!id) return false;

        return document.getElementById(id);
    },

    localStorage: {
        pre: 'ABP',

        init: ()=> {
            let lS = window.localStorage;
            let lV = vars.localStorage;

            // get the recent list
            let pV = vars.playLists;
            if (!lS[`${lV.pre}_recent`]) {
                lS[`${lV.pre}_recent`] = JSON.stringify(pV.recent);
            };
            pV.recent = JSON.parse(lS[`${lV.pre}_recent`]);

            if (!lS[`${lV.pre}_volume`]) {
                lS[`${lV.pre}_volume`] = 10;
            };
            vars.App.volume = lS[`${lV.pre}_volume`]*1;
        },

        saveRecent: ()=> {
            let pV = vars.playLists;

            let lS = window.localStorage;
            let lV = vars.localStorage;

            lS[`${lV.pre}_recent`] = JSON.stringify(pV.recent);

            vars.player.saveIconFlash();
        },

        saveVolume: ()=> {
            let lS = window.localStorage;
            let lV = vars.localStorage;

            lS[`${lV.pre}_volume`] = vars.App.volume;
        }
            
    },

    playListClass: null,

    playLists: {
        recent: [],
        updatePlayLists: (playList)=> {
            let folder = playList.folder;

            let pV = vars.playLists;
            let index = pV.recent.findIndex(m=>m.folder===folder);

            if (index>=0) {
                pV.recent[index] = playList;
            } else {
                // new folder, add a new entry
                pV.recent.push(playList);
            };

            vars.localStorage.saveRecent();
        }
    },



    App: {
        init: ()=> {
            vars.localStorage.init();
            vars.input.init();
            vars.UI.init();
            vars.playListClass = new Playlist();

            // UI MUST BE SET UP BEFORE THIS!
            vars.player = new Player();
            // update the volume
            vars.audio.setVolume(vars.App.volume);
            vars.UI.visualiser.setAudioContext();

            vars.UI.spinnerCLass = new Spinner();
            vars.UI.volumeClass.updateVolume();
            let h = vars.files.getFilesHTTPRequest = new HTTPRequest();
            h.getFiles();
        },

        clearAllTimeouts() {
            vars.player.clearUpdatePositionTimeout();
            vars.playListClass.clearSaveListTimeout();
        },

        convertToHMS: (seconds)=> {
            let h = 0;
            if(seconds>=3600) {
                h = (seconds/3600|0).toString();
                seconds%=3600;
            };
            let m = (seconds/60|0).toString().padStart(2,'0');
            let s = (seconds%60|0).toString().padStart(2,'0');

            return { h: h, m: m, s : s };
        },

        getCurrentDateAndTime: ()=> {
            let d = new Date();
            let cD = d.getFullYear().toString() + (d.getMonth()+1).toString().padStart(2,'0') + d.getDate().toString().padStart(2,'0') + d.getHours().toString().padStart(2,'0') + d.getMinutes().toString().padStart(2,'0') + d.getSeconds().toString().padStart(2,'0');;
            if (cD.length!==14) {
                console.error(`Date (${cD}) is invalid. It should be 14 characters. This date has ${cD.length} characters!\nUsing default date`);
                cD = '20240101000000';
            };
            return cD;
        },

        getHistory: ()=> {
            let http = new HTTPRequest();
            http.getHistory();
        }
    },

    audio: {
        changeVolume: (inc=true)=> {
            if (!vars.player || !vars.player.audioPlayer) return;

            let pV = vars.player;
            let volume  = pV.audioPlayer.volume*10;
            inc ? (volume++) : (volume--);
            vars.player.volumeControl.value = volume;
            volume/=10;

            pV.audioPlayer.volume = Clamp(volume,0,1);
            vars.UI.volumeClass.updateVolume();
        },

        muteSwitch: ()=> {
            let aP = vars.player.audioPlayer;
            if (!aP) return;

            aP.muted=!aP.muted;

            let src = vars.player.audioPlayer.muted ? 'assets/images/volumeMutedIcon.png' : 'assets/images/volumeIcon.png';
            vars.getElementByID('vII').src = src;
            vars.UI.volumeClass.updateVolume();
        },

        setVolume: (newVolume)=> {
            if (!vars.player || !vars.player.audioPlayer) return;

            vars.player.audioPlayer.volume = newVolume/10;
            vars.UI.volumeClass.updateVolume();
        }
    },

    input: {
        init: ()=> {
            vars.input.initKeys();
        },
        initKeys: ()=> {
            window.addEventListener('keyup', (k)=> {
                switch (k.code) {
                    case 'ArrowUp': case 'Equal': case 'NumpadAdd':
                        k.preventDefault();
                        vars.audio.changeVolume();
                        return;
                    break;

                    case 'ArrowDown': case 'Minus': case 'NumpadSubtract':
                        k.preventDefault();
                        vars.audio.changeVolume(false);
                        return;
                    break;

                    case 'KeyM':
                        vars.audio.muteSwitch();
                        return;
                    break;

                    case 'Space':
                        vars.player.playPause();
                    break;

                    default:
                        vars.DEBUG && console.warn(`Key code ${k.code} has no handler!`);
                    break;
                };
            });
        }
    },

    UI: {
        playingContainerClass: null,
        volumeClass: null,

        init: ()=> {
            let ui = vars.UI;

            ui.playingContainerClass = new UI('playingContainer');

            ui.volumeClass = new UI('volumeContainer');

            ui.visualiser = new AudioVisualiser();
        }
    }
};