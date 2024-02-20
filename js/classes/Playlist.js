let Playlist = class {
    constructor() {
        this.gID = vars.getElementByID;
        this.init();
    }

    /* 
       ******************
       * INIT FUNCTIONS *
       ******************
    */
    init() {
        this.getPlaylistDiv();

        this.folder = '';
        this.playList = [];
        
        // every 6 saves (which occur every 10s) the playlists flush to disk is reduced
        this.fTDMinutes = 5; // save to disk every 5 minutes
        this.flushToDisk = 6 * this.fTDMinutes;
        this.flushToDiskMax = this.flushToDisk;

        this.autoplay = true;
        this.currentlyPlayingIndex = -1;
        this.loadingRecent = 0; // holds the percentage of how far into the track we are (when loading recent)
    }

    getPlaylistDiv() {
        this.playListDiv = this.gID('playList');
    }
    /*
       *************************
       * END OF INIT FUNCTIONS *
       *************************
    */




    // the rebuild var is used for single tracks
    // and is ignored if multiple tracks are being added
    addSingleTrackToPlayList(folder,fileName) {
        let index = this.playList.findIndex(m=>m.fileName===fileName);
        if (index>=0) { // track exists in list, remove it
            this.playList.splice(index,1);
        } else {
            this.playList.push({ folder: folder, fileName: fileName });
        };
    }
    addTracksToPlayList(folder) {
        // stop the flashing "currently playing"if it exists
        vars.UI.folderList.flashStopCurrentStatusDiv();

        this.folder = folder;
        
        // get more info for this folder
        this.getMoreInfoForFolder();

        // check if this playlist already exists
        let recent = vars.playLists.recent.find(m=>m.folder===folder);

        this.playList = []; // empty the current playlist

        let audioBooks = [...vars.files.getFilesHTTPRequest.audioBooks];
        let aB = audioBooks.find(m=>m.folder===folder);
        let tracks = aB.fileNames;

        tracks.forEach((t)=> {
            this.addSingleTrackToPlayList(folder,t,false);
        });

        // after adding multiple tracks, we always rebuild the divs
        this.rebuildPlayList();

        // start playing the first/next track
        this.loadingRecent=0;
        if (recent) { // this book has already been started, update the position etc
            // set current index
            this.currentlyPlayingIndex = Clamp(recent.currentIndex-1,-1,tracks.length-1);
            this.loadingRecent = recent.trackPositionAsPercentage;
        };
        vars.player.playNext();
    }

    clearSaveListTimeout() {
        clearInterval(this.savePlayListTimeout);
    }

    clickOnEntry(div) {
        if (div.className.includes('playing')) return;

        if (div.className.includes('pLhighlighted')) { // this track has been highlighted and was clicked on again. play next
            let index = div.dataset.index;
            vars.playListClass.currentlyPlayingIndex=index-1;
            vars.player.playNext();
            return;
        };

        // unhighlight all divs
        let children = vars.player.playList.children;
        for (let c=0; c<children.length; c++) {
            !children[c].className.includes('playing') && (children[c].className = 'playlistEntry');
        };
        // highlight the clicked on div
        div.className = 'playlistEntry pLhighlighted';

        debugger;
    }

    flushToDiskDO() {
        let history = vars.playLists.recent;
        let x = new HTTPRequest();
        x.saveHistory(history);
        console.log(`%cRecent list has been flushed to disk (server)`,'color: #30ff30;');
    }

    flushToDiskReduce() {
        this.flushToDisk--;
        if (this.flushToDisk) return;

        this.flushToDisk = this.flushToDiskMax; // reset the counter

        this.flushToDiskDO();
    }

    getMoreInfoForFolder() {
        this.moreInfo = null; // empty the more info
        let m = new HTTPRequest();
        m.getFolderInfo(this.folder);
    }

    getNextTrack() {
        this.currentlyPlayingIndex++;

        let fileData = false;
        if (this.currentlyPlayingIndex < this.playList.length) {
            fileData = this.playList[this.currentlyPlayingIndex];
        };

        this.trackPosition = 0;

        return fileData;
    }

    getPlayListFileNameFromCurrentIndex() {
        return this.playList[this.currentlyPlayingIndex].fileName;
    }

    getPositionInTrack() {
        return vars.player.getTrackPosition();
    }
    
    getPositionInTrackInSeconds() {
        return vars.player.getTrackPosition(false);
    }

    getPlayListTrackNameFromCurrentIndex() {
        let fName = this.getPlayListFileNameFromCurrentIndex().split('.');
        fName.pop(); // remove extension
        fName = fName.join('.'); // and join again
        return fName;
    }

    getTrackDuration() {
        return vars.player.audioPlayer.duration+1|0;
    }

    highlightCurrentlyPlaying() {
        // first unhighlight everything
        this.unhighlightAll();
        let index = this.currentlyPlayingIndex;
        this.playListDiv.childNodes[index].className = 'playlistEntry playing';
    }

    rebuildPlayList() {
        let html = '';
        this.playList.forEach((trackData,i)=> {
            let fileName = trackData.fileName;
            html += `<div data-filename="${fileName}" data-index="${i}" class="playlistEntry" onclick="vars.playListClass.clickOnEntry(this)">${fileName}</div>`;
        });

        this.playListDiv.innerHTML = html;
    }

    savePlayList() {
        // we save the playlist every x seconds
        let timeout = consts.flushToDiskTimeout*1000;
        this.savePlayListTimeout = setTimeout(()=> {
            let aP = vars.player.audioPlayer;
            if (aP.paused) {
                this.savePlayList();
                return; // if audio isnt playing, ignore the call
            };

            // audio book is playing, save the current track pos
            this.savePlayListDO();
        }, timeout);
    }

    // this is only called if the player is playing
    // however, you can request it at any time
    // such as when pausing,starting/restarting,skipping etc
    savePlayListDO() {
        if (!this.folder) {
            console.error(`A save was requested but the folder is empty!\nThis means the save was requested when no audio book was loaded.\nDisabling the save playlist timeout.`);
            return;
        };

        this.trackPosition = this.getPositionInTrack();
        let seconds = this.getPositionInTrackInSeconds();
        let duration = this.getTrackDuration();
        let totalChapters = this.playList.length;

        let cD = vars.App.getCurrentDateAndTime();
        let pLData = { folder: this.folder, currentIndex: this.currentlyPlayingIndex, trackCount: totalChapters, trackPositionAsPercentage: this.trackPosition, trackPositionInSeconds: seconds, duration: duration, complete: false, lastAccessed: cD };
        vars.playLists.updatePlayLists(pLData);

        if (this.savePlayListTimeout) {
            clearTimeout(this.savePlayListTimeout);
            delete(this.savePlayListTimeout);
        };

        this.flushToDiskReduce();

        this.savePlayList();
    }

    setBookToComplete() {
        if (!this.folder) {
            console.error(`Folder is empty!\nUnable to set the current audio book to complete!`);
            return false;
        };

        let cD = vars.App.getCurrentDateAndTime();
        let pLData = { folder: this.folder, currentIndex: 0, trackCount: 0, trackPositionAsPercentage: 0, trackPositionInSeconds: 0, duration: 0, complete: true, lastAccessed: cD };
        vars.playLists.updatePlayLists(pLData);
    }

    unhighlightAll() {
        let cN = this.playListDiv.childNodes;
        for (let c=0; c<cN.length; c++) {
            cN[c].className = 'playlistEntry';
        };
    }

}