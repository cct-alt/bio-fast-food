import Phaser from 'phaser';
import MainMenu from './scenes/MainMenu.js';
import MainScene from './scenes/MainScene.js';

const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 800,
        height: 600,
        parent: 'game-container'
    },
    backgroundColor: '#f0f0f0',
    resolution: window.devicePixelRatio || 1,
    autoRound: true,
    dom: {
        createContainer: true
    },
    
    // 🌟 方案三：加入這一段，開啟觸控暴力攔截！
    input: {
        touch: {
            capture: true
        }
    },
    
    scene: [MainMenu, MainScene]
};


const game = new Phaser.Game(config);
