// Wait for Babylon.js to load
window.addEventListener('DOMContentLoaded', async () => {
    // Wait for Babylon.js to be available
    if (typeof BABYLON === 'undefined') {
        await new Promise(resolve => {
            const checkBabylon = setInterval(() => {
                if (typeof BABYLON !== 'undefined') {
                    clearInterval(checkBabylon);
                    resolve();
                }
            }, 50);
        });
    }
    
    // Import game modules
    const { Game } = await import('./src/Game.js');
    const canvas = document.getElementById('renderCanvas');
    const game = new Game(canvas);
    game.init();
});

