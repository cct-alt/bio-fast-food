import Phaser from 'phaser';
import { getLeaderboard } from '../firebase.js'; // 👉 匯入排行榜功能

export default class MainMenu extends Phaser.Scene {
    constructor() {
        super('MainMenu');
    }

    preload() {
        let loadingText = this.add.text(400, 300, '資源載入中... 請稍候', { fontFamily: '"微軟正黑體", sans-serif', fontSize: '32px', fill: '#ffffff' }).setOrigin(0.5);
        this.load.on('loaderror', (fileObj) => { console.error('❌ 圖片載入失敗:', fileObj.key, '路徑:', fileObj.url); });
        this.load.on('complete', () => { loadingText.destroy(); });
        this.load.image('main_bg', 'main_bg.jpg');
        this.load.image('recipe1', 'recipe1.png');
        this.load.image('recipe2', 'recipe2.png');
        this.load.image('recipe3', 'recipe3.png');
        this.load.image('recipe4', 'recipe4.png');
        this.load.image('recipe5', 'recipe5.png');
    }

    create() {
        this.add.image(400, 300, 'main_bg').setDisplaySize(800, 600);

        // 👉 重新分配空間放 4 個按鈕
        this.createButton(400, 260, '▶ 開始遊戲', () => { this.scene.start('MainScene'); });
        this.createButton(400, 340, '📖 遊戲玩法', () => { this.showHowToPlay(); });
        this.createButton(400, 420, '📚 食譜', () => { this.showRecipes(); });
        this.createButton(400, 500, '🏆 排行榜', () => { this.showLeaderboard(); }); // 排行榜按鈕

        this.popupContainer = this.add.container(0, 0).setDepth(100).setVisible(false);
    }

    createButton(x, y, text, onClick) {
        let btn = this.add.container(x, y);
        let bg = this.add.rectangle(0, 0, 200, 50, 0x154360, 1).setInteractive({ useHandCursor: true });
        bg.setStrokeStyle(4, 0x1A5276); bg.isStroked = true;
        let txt = this.add.text(0, 0, text, { fontFamily: '"微軟正黑體", sans-serif', fontSize: '24px', fill: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
        btn.add([bg, txt]);
        bg.on('pointerover', () => bg.setFillStyle(0x1A5276));
        bg.on('pointerout', () => bg.setFillStyle(0x154360));
        bg.on('pointerdown', () => {
            bg.setFillStyle(0x0B2333);
            this.tweens.add({ targets: btn, scale: 0.9, duration: 50, yoyo: true });
        });
        bg.on('pointerup', () => { bg.setFillStyle(0x1A5276); onClick(); });
    }

    showHowToPlay() {
        this.popupContainer.removeAll(true);
        this.popupContainer.setVisible(true);
        let overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8).setInteractive();
        let panel = this.add.rectangle(400, 300, 600, 500, 0xecf0f1).setStrokeStyle(6, 0xbdc3c7);
        let title = this.add.text(400, 90, '📖 遊戲玩法', { fontFamily: '"微軟正黑體", sans-serif', fontSize: '32px', fill: '#2c3e50', fontStyle: 'bold' }).setOrigin(0.5);
        let content = `歡迎來到生命分子快餐店！\n你只有 3 分鐘，盡可能完成顧客的訂單！\n\n🔹 操作指南：\n1. 拿取食材： 從畫面下方食材庫拖曳出化學單位。\n2. 組裝分子： 將食材互相靠近，系統會自動吸附。\n   (提示：對著分子連點兩下可反轉 180 度！)\n   (進階：大分子需先在提示框內組裝出單體)\n3. 完成訂單： 將做好的分子拖到右側綠色出餐區。\n4. 銷毀失敗： 做錯了請拖曳到右下角紅色垃圾桶。\n\n🔹 高分技巧：\n- 難度越高的分子賺越多，還能額外獎勵時間！\n- 5 連擊會進入 🔥 狂熱模式，收入直接翻倍！`;
        let txt = this.add.text(400, 130, content, { fontFamily: '"微軟正黑體", sans-serif', fontSize: '18px', fill: '#34495e', lineSpacing: 8, wordWrap: { width: 550 } }).setOrigin(0.5, 0);
        let closeBtn = this.add.text(660, 90, '✖', { fontSize: '30px', fill: '#e74c3c', fontStyle: 'bold' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        closeBtn.on('pointerdown', () => this.popupContainer.setVisible(false));
        this.popupContainer.add([overlay, panel, title, txt, closeBtn]);
    }

    showRecipes() {
        this.popupContainer.removeAll(true);
        this.popupContainer.setVisible(true);
        let overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8).setInteractive();
        let panel = this.add.rectangle(400, 300, 650, 500, 0xecf0f1).setStrokeStyle(6, 0xbdc3c7);
        let title = this.add.text(400, 80, '📚 分子食譜', { fontFamily: '"微軟正黑體", sans-serif', fontSize: '32px', fill: '#2c3e50', fontStyle: 'bold' }).setOrigin(0.5);
        let closeBtn = this.add.text(690, 80, '✖', { fontSize: '30px', fill: '#e74c3c', fontStyle: 'bold' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        closeBtn.on('pointerdown', () => this.popupContainer.setVisible(false));

        let recipes = ['recipe1', 'recipe2', 'recipe3', 'recipe4', 'recipe5'];
        let currentIndex = 0;
        let recipeImage = this.add.image(400, 300, recipes[currentIndex]).setDisplaySize(550, 350);
        let pageText = this.add.text(400, 510, `第 ${currentIndex + 1} / 5 頁`, { fontFamily: '"微軟正黑體", sans-serif', fontSize: '20px', fill: '#2c3e50', fontStyle: 'bold' }).setOrigin(0.5);

        let leftBtn = this.add.text(120, 300, '◀', { fontSize: '50px', fill: '#3498db' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        let rightBtn = this.add.text(680, 300, '▶', { fontSize: '50px', fill: '#3498db' }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        let updatePage = () => { recipeImage.setTexture(recipes[currentIndex]); pageText.setText(`第 ${currentIndex + 1} / 5 頁`); };
        leftBtn.on('pointerdown', () => { currentIndex = (currentIndex - 1 + recipes.length) % recipes.length; updatePage(); });
        rightBtn.on('pointerdown', () => { currentIndex = (currentIndex + 1) % recipes.length; updatePage(); });
        this.popupContainer.add([overlay, panel, title, closeBtn, recipeImage, leftBtn, rightBtn, pageText]);
    }

    // 👉 顯示 Firebase 排行榜
    async showLeaderboard() {
        this.popupContainer.removeAll(true);
        this.popupContainer.setVisible(true);

        let overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8).setInteractive();
        let panel = this.add.rectangle(400, 300, 500, 520, 0xecf0f1).setStrokeStyle(6, 0xf1c40f);

        let title = this.add.text(400, 80, '🏆 榮譽排行榜 (Top 10)', { fontFamily: '"微軟正黑體", sans-serif', fontSize: '32px', fill: '#d35400', fontStyle: 'bold' }).setOrigin(0.5);
        let closeBtn = this.add.text(620, 70, '✖', { fontSize: '30px', fill: '#e74c3c', fontStyle: 'bold' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        closeBtn.on('pointerdown', () => this.popupContainer.setVisible(false));

        let loadingText = this.add.text(400, 300, '讀取中...', { fontFamily: '"微軟正黑體", sans-serif', fontSize: '24px', fill: '#7f8c8d' }).setOrigin(0.5);
        this.popupContainer.add([overlay, panel, title, closeBtn, loadingText]);

        let topScores = await getLeaderboard();
        loadingText.destroy();

        if (topScores.length === 0) {
            let noData = this.add.text(400, 300, '目前還沒有人上榜喔！\n趕快去挑戰吧！', { fontFamily: '"微軟正黑體", sans-serif', fontSize: '24px', fill: '#7f8c8d', align: 'center' }).setOrigin(0.5);
            this.popupContainer.add(noData);
        } else {
            let startY = 140;
            topScores.forEach((data, index) => {
                let color = index === 0 ? '#f1c40f' : (index === 1 ? '#95a5a6' : (index === 2 ? '#d35400' : '#2c3e50'));
                let rankStr = index < 3 ? ['🥇', '🥈', '🥉'][index] : ` ${index + 1}. `;

                let rankText = this.add.text(180, startY, rankStr, { fontSize: '24px' }).setOrigin(0, 0.5);
                let studentText = this.add.text(240, startY, `${data.classStr} - ${data.studentNo}號`, { fontFamily: '"微軟正黑體", sans-serif', fontSize: '24px', fill: color, fontStyle: 'bold' }).setOrigin(0, 0.5);
                let scoreText = this.add.text(620, startY, `$${data.score}`, { fontFamily: '"微軟正黑體", sans-serif', fontSize: '24px', fill: '#27ae60', fontStyle: 'bold' }).setOrigin(1, 0.5);
                let line = this.add.line(0, 0, 180, startY + 20, 620, startY + 20, 0xbdc3c7).setOrigin(0, 0);

                this.popupContainer.add([rankText, studentText, scoreText, line]);
                startY += 40;
            });
        }
    }
}
