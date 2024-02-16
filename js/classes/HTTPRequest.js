let HTTPRequest = class {
    constructor() {

    }

    doRequest(url,_post=null,rsFn) {
        let method = !_post ? 'GET' : 'POST';

        let http = new XMLHttpRequest();
        http.open(method, url, true);
        
        http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

        http.onreadystatechange = function() { // when state changes.
            if (http.readyState == 4 && http.status == 200) { // we have a valid response, send it to the parser function
                let rs = JSON.parse(http.responseText);
                rsFn(rs);
            };
        };

        // DO THE REQUEST
        _post ? http.send(_post) : http.send();
    }

    getFolderInfo(folder) {
        vars.UI.playingContainerClass.loadingMinfo = true;
        let url = `endpoints/getMinfo.php`;
        let handler = this.getFolderInfoHandler;
        let post = `folder=${encodeURIComponent(folder)}`;
        this.doRequest(url,post,handler);
    }
    getFolderInfoHandler(rs) {
        // push the response into the play list class
        vars.playListClass.moreInfo = rs;
        // and the playing container (where the data is actually used)
        let pCC = vars.UI.playingContainerClass;
        pCC.moreInfo = rs;
        pCC.loadingMinfo = false;
    }

    getFiles() {
        let url = `endpoints/getFiles.php`;
        let handler = this.getFilesHandler;
        this.doRequest(url,null,handler);
    }
    getFilesHandler(rs) {
        let t = vars.files.getFilesHTTPRequest;
        t.audioBooks = [];
        rs.AudioBooks.forEach((f)=> {
            let fArray = f.split('\\');
            let fileName = fArray.pop();
            let folder = fArray.join('\\');
            let index = t.audioBooks.findIndex(m=>m.folder===folder);
            if (index<0) {
                t.audioBooks.push({ folder: folder, fileNames: [] });
                index = t.audioBooks.length-1;
            };
            t.audioBooks[index].fileNames.push(fileName);
        });

        let fL = vars.UI.folderList = new UI('folderList');
        fL.audioBookListImport(t.audioBooks);
    }

    getHistory() {
        debugger;
    }

    getHistoryHandler(rs) {
        debugger;
    }

};