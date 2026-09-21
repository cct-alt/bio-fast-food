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
  backgroundColor: '#ffffff',
  // 🌟 1. 解決字體模糊：讀取設備(iPad)真實解析度，讓文字超銳利
  resolution: window.devicePixelRatio || 1,
  autoRound: true,

  // 🌟 3. 開啟 DOM 支援：讓 HTML 下拉選單能跟著遊戲畫面一起完美縮放
  dom: {
    createContainer: true
  },
  scene: [MainMenu, MainScene]
};

const game = new Phaser.Game(config);
