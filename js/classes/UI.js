let UI = class {
    constructor(_type) {
        let gID = this.gID = vars.getElementByID;

        this.type = _type;
        let valid = false;
        switch (this.type) {
            case 'folderList':
                this.html = '';
                let fL = this.audioBookListDiv = gID('fileList');
                let padding = 128;
                fL.style.height = `${window.innerHeight-padding}px`;
                valid = true;
            break;

            case 'playingContainer':
                this.loadingMinfo = null;
                this.initPlayingContainer();
                valid = true;
            break;

            case 'volumeContainer':
                this.initVolumeContainer();
                valid = true;
            break;

            default:
                console.error(`Invalid type!`);
            break;
        };

        return valid;
    }
    
    /* ************  INITS  *********** */

    initPlayingContainer() {
        this.name = `Playing Container (Screen Saver)`;
        this.description = `When an audio book is playing it will eventually show this container.\nIt holds the details of the current track we're listening to and is used as a "screensaver" type page`;

        this.mouse = { x: 0, y: 0, elapsedCount: -1 };
        this.updateScreenSaverTimeout();

        this.visible=false;

        window.onpointermove = (e)=> { // this deals with the timeout for the (playingcontainer) "screensaver"
            vars.UI.playingContainerClass.updateMousePosition(e);
        };

        let gID = this.gID;

        let p = this.playingContainer = gID('playingContainer');
        p.hide = ()=> { 
            p.className = 'hidden';
            this.dataDivs.find(m=>m.id==='currentPositionContainer').div.className='hidden';
            this.mouse = {...this.mouse, ...{elapsedCount: -1 }};
            this.visible = false;
        };

        p.addEventListener('mouseup', ()=> {
            p.hide();
            this;
        });

        this.updateTrackAndPositionInterval = setInterval(()=> {
            this.updateCurrentTrackAndPosition();
        },1000);

        this.convert = [
            { root: 'General', id: 'bookName', data: ['Album'], text: 'Book Name: ' },
            { root: 'General', id: 'chapterName', data: ['Track'], text: 'Track Name: ' },
            { root: 'General', id: 'performer', data: ['Performer'], text: 'Performer: ' },
            { root: 'General', id: 'releaseDate', data: ['Released_Date','Original/Released_Date'], text: 'Release Date: ', type: 'OR' },
            { root: 'General', id: 'recordedDate', data: ['Recorded_Date'], text: 'Recorded Date: ' },
            { root: 'General', id: 'readBy', data: ['Album/Performer'], text: 'Read By: ' },
            { root: 'General', id: 'duration', data: ['Duration'], text: 'Duration: ' },
            { root: 'General', id: 'synopsis', data: ['Comment'], text: '' },
            { root: 'Audio', id: 'audioDetail', data: ['Channel(s)','BitRate','SamplingRate'], text: ['Channels','Bit Rate','Sample Rate'], type: 'AND' },
        ];
        let divs = this.divNames = ['bookName','chapterName','performer','currentTrackAndPosition','releaseDate','recordedDate','synopsis','readBy','currentTrackEndTime','currentPositionContainer','currentPosition','audioDetail'];
        this.dataDivs = [];
        divs.forEach((id)=> {
            let div = gID(id);
            this.dataDivs.push({ id: id, div: div });
        });
    }

    initVolumeContainer() {
        this.name = `Volume Container Class`;
        this.description = `This is the volume pop up that shows when changing the volume using the up and down keys`;

        let gID = this.gID;
        this.volumeContainer = gID('volumeContainer');
        this.volumeIntegerDiv = gID('volumeInteger');
    }

    describe() {
        console.log(`${this.name}\n${this.description}`);
    }
    /* ********************************* */



    /* ****  Folder List functions  **** */
    audioBookListImport(_fL) {
        this.audioBooks = _fL;

        this.createFolderList();

        // all files have loaded, hide the loading screen
        vars.UI.loadingContainer.hide();
    }

    createFolderList() {
        this.name = `Folder List Class`;
        this.description = `This is the main list on the left hand side of the page.\nIt contains all audio books found in the audiobook folder`;
        let aB = this.audioBooks;
        let html = this.html;
        aB.forEach((data)=> {
            let folder = data.folder;
            let folderSafe = folder.replaceAll('\'','\\\'');
            html += `<div class="folderContainer">`;

            let recent = vars.playLists.recent;
            let index = recent.findIndex(m=>m.folder===folder);
            let statusClass = index===-1 ? 'cSNone' : recent[index].complete ? 'cSComplete' : 'cSMid';

            let selectedIndex = index>=0 ? recent[index].currentIndex : -1;

            html += `   <div class="folderLine">
                            <div data-folder="${folderSafe}" class="currentStatus ${statusClass}">&nbsp;</div><div class="addAll clickable" onclick="vars.playListClass.addTracksToPlayList('${folderSafe}')">Add All Tracks</div>
                            <div class="folderName clickable" onclick="vars.UI.folderList.switchTrackVisibility(this.parentNode.parentNode.getElementsByClassName('trackList')[0])">${folder}</div>
                        </div>`; // end of folder line
            // add the track list
            html += `   <div class="trackList hidden" onclick="vars.playListClass.addTracksToPlayList('${folderSafe}')" data-folder="${folderSafe}">`;
            data.fileNames.forEach((fileName,i)=> {
                let className = i===selectedIndex ? ' trackListHighlight' : '';
                html += `    <div class="fileName${className}">${fileName}</div>`; // remove onclick stuff ---  data-folder="${folder}" data-filename="${fileName}" onclick="vars.playListClass.addSingleTrackToPlayList(this.dataset.folder,this.dataset.filename);"
            });
            html += '  </div>'; // end of track list div
            html += '</div>'; // end of folder container
        });

        this.audioBookListDiv.innerHTML = html;
    }

    flashCurrentStatusDiv(lookingFor) {
        if (!lookingFor) return;

        let cS = document.getElementsByClassName('currentStatus');

        let found = false;
        for (let i=0; i<cS.length; i++) {
            if (found) return;

            if (cS[i].dataset.folder===lookingFor) {
                !cS[i].className.includes('cSMidFlash') && (cS[i].className += ' cSMidFlash', found=true);
            };
        };
    }

    flashStopCurrentStatusDiv() {
        let mF = document.getElementsByClassName('cSMidFlash');
        if (!mF.length) return;
        mF[0].className = mF[0].className.replace(' cSMidFlash','');
    }

    highlightCurrentlyPlaying() {
        let pC = vars.playListClass;
        let currentlyPlayingIndex = pC.currentlyPlayingIndex;
        let folderName = pC.folder;
        let found = false;
        let tL = document.getElementsByClassName('trackList');
        for (let t=0; t<tL.length; t++) {
            if (!found && tL[t].dataset.folder === folderName) {
                found = tL[t];
            };
        };

        if (!found) {
            console.error(`Couldnt find the track list div!`);
            return;
        };
        found = found.getElementsByClassName('fileName');

        for (let f=0; f<found.length; f++) {
            found[f].className = currentlyPlayingIndex===f ? 'fileName trackListHighlight' : 'fileName';
        };
    }
    
    switchTrackVisibility(trackListDiv) {
        trackListDiv.className = trackListDiv.className.includes(' hidden') ? 'trackList' : 'trackList hidden';
    }
    /* ********************************* */



    /* *  Playing Container Functions  * */
    addDataToDataDiv() {
        let fileName = vars.playListClass.getPlayListFileNameFromCurrentIndex();
        let c = this.convert;
        if (!this.moreInfo) { this.mInfoFail=true; return; };

        let minfo = this.moreInfo[fileName];

        this.divNames.forEach((id)=> {
            let convert = c.find(m=>m.id===id);
            if (!convert) return;

            let minfoData = minfo[convert.root];

            let text = [];
            convert.data.forEach((d)=> {
                text.push(minfoData[d]);
            });
            let type = convert.type;
            if (type) {
                switch (type) {
                    case 'AND':
                        let finalText = [];
                        text.forEach((t,i)=> {
                            if (i>convert.text.length-1) return;
                            finalText.push(`${convert.text[i]}: ${t}`);
                        });
                        text = finalText.join('. ');
                    break;

                    case 'OR':
                        let showText = '';
                        text.forEach((t)=> {
                            if (showText) return;

                            t && ( showText = t );
                        });
                        text = showText;
                    break;

                    default:
                        text = text[0];
                    break;
                }
            };
            
            let found = this.dataDivs.find(m=>m.id===id);
            found.div.innerHTML = type==='AND' ? `${text}` : `${convert.text}${text}`;
        });

        // now we have to set up the "currentTrackAndPosition" and "currentTrackEndTime"
        // this.updateCurrentTrackAndPosition(); <-- this has been added to an interval instead of updating it here
    }

    getDataDivByName(name) {
        return this.dataDivs.find(m=>m.id===name);
    }

    getEndTime() {
        let aP = vars.player.audioPlayer;
        if (aP.paused) return; // audio is paused, ignore request

        let secondsRemaining = aP.duration-aP.currentTime|0;

        let now = new Date();
        now.setSeconds(now.getSeconds() + secondsRemaining);
        now = new Date(now);
        let h = now.getHours();
        let m = now.getMinutes().toString().padStart(2,'0');
        let s = now.getSeconds().toString().padStart(2,'0');
        return `${h}:${m}:${s}`;
    }

    showThePlayingContainer() {
        if (this.mInfoFail===true && this.moreInfo) {
            this.mInfoFail=false;
            this.addDataToDataDiv();
        };
        if (this.mInfoFail || this.visible) return;

        this.visible = true;
        this.playingContainer.className = '';
        this.dataDivs.find(m=>m.id==='currentPositionContainer').div.className = '';
    }

    updateCurrentTrackAndPosition() {
        let pV = vars.player;
        if (!pV || pV.audioPlayer.paused) return; // track is paused, ignore the call

        let aV = vars.App;

        let div = this.dataDivs.find(m=>m.id==='currentTrackAndPosition').div;

        // get current time in seconds as well as percent
        let seconds = pV.getTrackPosition(false);
        let percent = pV.getTrackPosition();

        let time = aV.convertToHMS(seconds);
        let totalTime = aV.convertToHMS(pV.audioPlayer.duration);

        let pLC = vars.playListClass;
        let trackNum = pLC.currentlyPlayingIndex+1;
        let trackName = pLC.getPlayListTrackNameFromCurrentIndex() + ' at ';

        let msg = `${time.h}h ${time.m}m ${time.s}s of ${totalTime.h}h ${totalTime.m}m ${totalTime.s}s`;
        let msgShort = `${time.h}:${time.m}:${time.s} / ${totalTime.h}:${totalTime.m}:${totalTime.s}`;
        let cT = `Current Track: ${trackNum} - `;
        let fullMessage = `${cT}${msg}`;
        div.innerHTML = fullMessage;

        let cPDiv = this.dataDivs.find(m=>m.id==='currentPosition').div;
        cPDiv.innerHTML = msgShort;
        cPDiv.style.width=`${percent*100}%`;

        pV.positionBar.innerHTML = msgShort;

        pV.updateCurrentTrackAndTime(`${trackName} ${msgShort}`);
        
        this.udpateCurrentTrackEndTime(seconds);
    }

    udpateCurrentTrackEndTime() {
        let div = this.dataDivs.find(m=>m.id==='currentTrackEndTime').div;
        div.innerHTML = `Current chapter ends at ${this.getEndTime()}`;
    }

    updateMousePosition(e) {
        let playing = vars.player.playing;
        if (!playing) return;

        let x = e.clientX|0;
        let y = e.clientY|0;

        if (this.mouse.x===x && this.mouse.y===y) return; // mouse hasnt moved, ignore call

        this.mouse = { x: x, y: y, elapsedCount: -1 };
    }

    updateScreenSaverTimeout() {
        let m = this.mouse;
        this.showScreenSaverTimeout = setTimeout(()=> {
            if (!vars.player || !vars.player.playing) { 
                this.updateScreenSaverTimeout();
                return; // No audio book is playing
            };

            m.elapsedCount++;

            if (m.elapsedCount>=-1 && m.elapsedCount<=10) {
                vars.player.updateCountIntDiv(10-m.elapsedCount);
            };


            if (m.elapsedCount===10) { // show screen saver
                this.showThePlayingContainer();
            };

            this.updateScreenSaverTimeout();
        }, 1000);
    }
    /* ********************************* */



    /* ******  Volume functions  ****** */
    showVolumeContainer(show=true) {
        this.volumeContainer.className = show ? '' : 'hidden';
    }

    updateVolume() {
        // any time theres a volume change, we end up in here
        this.volumeIntegerDiv.innerHTML = vars.player.audioPlayer.volume*10;
        vars.App.volume = vars.player.audioPlayer.volume*10;
        vars.localStorage.saveVolume();

        this.showVolumeContainer();

        if (this.timeout) {
            clearInterval(this.timeout);
            delete(this.timeout);
        };

        this.timeout = setTimeout(()=> {
            this.showVolumeContainer(false);
        }, 3000);
    }
    /* ********************************* */
    
};