/* window.addEventListener("beforeunload", function(e){
    // save the current history to the server
    new HTTPRequest('backUpHistory.php');
 }, false); */

 document.body.addEventListener( 'dblclick', (event)=> {  
    event.preventDefault();  
    event.stopPropagation(); 
  }, true );

 vars.init();