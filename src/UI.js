class UI {
    constructor() {
        this.healthBar = document.getElementById('health-bar');
        this.healthText = document.getElementById('health-text');
        this.ammoText = document.getElementById('ammo-text');
        this.scoreText = document.getElementById('score-text');
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.finalScoreText = document.getElementById('final-score');
    }

    updateHealth(health) {
        const percentage = Math.max(0, Math.min(100, health));
        this.healthBar.style.width = `${percentage}%`;
        this.healthText.textContent = Math.ceil(health);
        
        // Change color based on health
        if (percentage > 60) {
            this.healthBar.style.background = 'linear-gradient(90deg, #ff0000, #ff6600, #00ff00)';
        } else if (percentage > 30) {
            this.healthBar.style.background = 'linear-gradient(90deg, #ff0000, #ff6600)';
        } else {
            this.healthBar.style.background = '#ff0000';
        }
    }

    updateAmmo(current, total) {
        this.ammoText.textContent = `${current} / ${total}`;
        
        // Change color if low ammo
        if (current <= 10) {
            this.ammoText.style.color = '#ff6600';
        } else if (current <= 5) {
            this.ammoText.style.color = '#ff0000';
        } else {
            this.ammoText.style.color = '#fff';
        }
    }

    updateScore(score) {
        this.scoreText.textContent = `Score: ${score}`;
    }

    showGameOver(finalScore) {
        this.finalScoreText.textContent = `Final Score: ${finalScore}`;
        this.gameOverScreen.classList.remove('hidden');
    }

    hideGameOver() {
        this.gameOverScreen.classList.add('hidden');
    }
}

export { UI };

