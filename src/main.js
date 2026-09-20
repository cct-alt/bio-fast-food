import Phaser from 'phaser';
import MainMenu from './scenes/MainMenu.js';
import MainScene from './scenes/MainScene.js';

const config = {
  type: Phaser.AUTO,
  // 將原本的 width 和 height 移入 scale 設定中
  scale: {
    mode: Phaser.Scale.FIT, // 自動縮放以適應螢幕，並保持比例
    autoCenter: Phaser.Scale.CENTER_BOTH, // 水平與垂直置中
    width: 800,
    height: 600,
    parent: 'game-container'
  },
  backgroundColor: '#ffffff',
  scene: [MainMenu, MainScene]
};

const game = new Phaser.Game(config);
