/* window.addEventListener("beforeunload", function(e){
    // save the current history to the server
    new HTTPRequest('backUpHistory.php');
 }, false); */

document.body.addEventListener( 'dblclick', (event)=> { event.preventDefault(); event.stopPropagation(); }, true );
document.addEventListener('contextmenu', event => event.preventDefault());
window.addEventListener("beforeunload", function() {
    let history = vars.playLists.recent;
    let x = new HTTPRequest();
    x.saveHistory(history);
 }, false); 
vars.init();