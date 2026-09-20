import Phaser from 'phaser';
import MainMenu from './scenes/MainMenu.js';
import MainScene from './scenes/MainScene.js';

// main.js
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
  // 🔽 加入這一段，限制單指觸控，防止手掌邊緣誤觸干擾
  input: {
    activePointers: 1,
  },
  scene: [MainMenu, MainScene]
};


const game = new Phaser.Game(config);
