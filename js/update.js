function update() {
    requestAnimationFrame(()=> {
        doUpdates();
        update();
    });
};

function doUpdates() {
    
}