import Phaser from 'phaser';
import { menuItems, orderDatabase } from '../data.js';
import { ParticleSystem } from '../ParticleSystem.js';
import { MoleculeLogic } from '../MoleculeLogic.js';
import OrderManager from '../managers/OrderManager.js';
import { saveScore } from '../firebase.js';

export default class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
    }

    preload() {
        console.log('準備載入遊戲素材...');

        this.load.image('glucose', 'glucose.png');
        this.load.image('fructose', 'fructose.png');
        this.load.image('galactose', 'galactose.png');
        this.load.image('glycerol', 'glycerol.png');
        this.load.image('fatty_acid', 'fatty_acid.png');
        this.load.image('phosphate_group', 'phosphate_group.png');
        this.load.image('carboxyl_group', 'carboxyl_group.png');
        this.load.image('amino_group', 'amino_group.png');
        this.load.image('carbon', 'carbon.png');

        for (let i = 1; i <= 20; i++) {
            let num = i < 10 ? '0' + i : i.toString();
            // 這裡的斜線也移除了
            this.load.image(`side_chain_${num}`, `side_chain_${num}.png`);
        }

        this.load.image('base_a', 'base_a.png');
        this.load.image('base_t', 'base_t.png');
        this.load.image('base_c', 'base_c.png');
        this.load.image('base_g', 'base_g.png');
        this.load.image('base_u', 'base_u.png');
        this.load.image('ribose', 'ribose.png');
        this.load.image('deoxyribose', 'deoxyribose.png');
        this.load.image('phosphate_group_nucleotide', 'phosphate_group_nucleotide.png');
    }


    create() {
        this.cameras.main.setBackgroundColor('#f4f7f6');

        // ==========================================
        // 🌟 終極解法：移除所有死鎖機制，改用「緊急放下 (Emergency Drop)」
        // 只要 Safari 調皮中斷了觸控，我們就讓分子安全落地，絕對不鎖死！
        // ==========================================
        const emergencyDrop = () => {
            this.workspaceItems.forEach(item => {
                if (item && item.type === 'Container') {
                    if (item.moleculeGroup) {
                        item.moleculeGroup.forEach(g => { if (g.setDepth) g.setDepth(1); });
                    }
                    if (item.list && item.list.length > 0 && !item.isLockedChain) {
                        item.list[0].clearTint();
                    }
                }
            });
            if (this.previewLine) this.previewLine.clear();
            this.currentSnap = null;
        };

        this.input.on('pointerupoutside', emergencyDrop);
        this.input.on('pointercancel', emergencyDrop);
        this.input.on('gameout', emergencyDrop);
        // ==========================================

        const grid = this.add.graphics();
        grid.lineStyle(1, 0xe0e6ed, 1);
        for (let i = 0; i < 800; i += 40) {
            grid.moveTo(i, 0); grid.lineTo(i, 480);
            grid.moveTo(0, i); grid.lineTo(800, i);
        }
        grid.strokePath();

        this.add.text(20, 15, '🧪 生命分子快餐店', { fontFamily: '"微軟正黑體", sans-serif', fontSize: '26px', fill: '#2c3e50', fontStyle: 'bold' });
        this.add.text(20, 55, '💡 提示：在分子上「連續點擊兩下」可反轉 180 度', { fontSize: '14px', fill: '#e67e22', fontStyle: 'bold', backgroundColor: '#fff3e0', padding: { x: 8, y: 4 } });

        this.score = 0;
        this.scoreText = this.add.text(20, 95, '💰 營業額: \$0', { fontFamily: '"微軟正黑體", sans-serif', fontSize: '22px', fill: '#27ae60', fontStyle: 'bold', backgroundColor: '#e8f8f5', padding: { x: 10, y: 5 }, borderRadius: 8 });

        let recipeBtn = this.add.text(20, 140, '📚 查看食譜', {
            fontFamily: '"微軟正黑體", sans-serif', fontSize: '18px', fill: '#ffffff',
            backgroundColor: '#3498db', padding: { x: 10, y: 5 }, borderRadius: 8
        }).setInteractive({ useHandCursor: true }).setDepth(200);

        recipeBtn.on('pointerover', () => recipeBtn.setBackgroundColor('#2980b9'));
        recipeBtn.on('pointerout', () => recipeBtn.setBackgroundColor('#3498db'));
        recipeBtn.on('pointerdown', () => { this.showRecipes(); });

        this.recipePopupContainer = this.add.container(0, 0).setDepth(3000).setVisible(false);

        this.currentCombo = 0;
        this.comboText = this.add.text(230, 95, '', { fontFamily: '"微軟正黑體", sans-serif', fontSize: '22px', fill: '#e74c3c', fontStyle: 'bold' });

        this.maxCombo = 0;
        this.isGameActive = true;

        this.gameTimeMax = 180000;
        this.gameTimeLeft = this.gameTimeMax;

        this.gameTimerText = this.add.text(400, 35, '⏳ 04:00', {
            fontFamily: '"微軟正黑體", sans-serif', fontSize: '32px', fill: '#34495e',
            fontStyle: 'bold', backgroundColor: '#fdfefe', padding: { x: 15, y: 5 },
            shadow: { offsetX: 2, offsetY: 2, color: '#bdc3c7', blur: 0, fill: true }
        }).setOrigin(0.5).setDepth(200);

        this.isFeverMode = false;
        this.feverTimer = null;
        this.feverOverlay = this.add.rectangle(400, 300, 800, 600, 0xffd700).setAlpha(0).setDepth(0);

        this.add.rectangle(640, 100, 300, 150, 0xfff9c4).setStrokeStyle(4, 0xf1c40f);
        this.add.text(640, 35, '📝 顧客訂單', { fontFamily: '"微軟正黑體", sans-serif', fontSize: '18px', fill: '#d35400', fontStyle: 'bold' }).setOrigin(0.5);
        this.orderText = this.add.text(640, 100, '準備中...', { fontFamily: '"微軟正黑體", sans-serif', fontSize: '18px', fill: '#2c3e50', fontStyle: 'bold', align: 'center' }).setOrigin(0.5);

        this.patienceBarBg = this.add.rectangle(640, 160, 260, 15, 0xbdc3c7).setOrigin(0.5);
        this.patienceBar = this.add.rectangle(510, 160, 260, 15, 0x2ecc71).setOrigin(0, 0.5);

        this.orderTimeMax = 60000;
        this.orderTimeLeft = this.orderTimeMax;
        this.isTimerActive = false;

        this.framesLayer = this.add.container(0, 0);
        this.activeFrames = [];
        this.requiresMonomerAssembly = false;
        this.recentOrders = [];

        this.menuItemCount = 0;

        this.levelDefs = [
            { level: 1, req: 0, items: ['glucose', 'fructose', 'glycerol', 'fatty_acid'], orders: ['sucrose', 'maltose', 'triglyceride'] },
            { level: 2, req: 50, items: ['galactose', 'phosphate_group'], orders: ['lactose', 'phospholipid', 'starch'] },
            { level: 3, req: 200, items: ['carbon', 'amino_group', 'carboxyl_group', 'side_chain_01'], orders: ['amino_acid', 'dipeptide', 'polypeptide'] },
            { level: 4, req: 300, items: ['ribose', 'deoxyribose', 'phosphate_group_nucleotide', 'base_a', 'base_t', 'base_c', 'base_g', 'base_u'], orders: ['dna_nucleotide', 'rna_nucleotide', 'dna_dinucleotide', 'rna_dinucleotide', 'dna_double_strand'] }
        ];

        this.currentLevel = 1;
        this.unlockedOrders = [...this.levelDefs[0].orders];
        this.menuItems = menuItems;
        this.orderDatabase = orderDatabase;
        this.currentOrder = null;

        this.orderManager = new OrderManager(this);
        this.orderManager.generateNewOrder();

        this.submitZone = this.add.rectangle(720, 260, 130, 80, 0xd4edda).setStrokeStyle(4, 0x2ecc71);
        this.add.text(720, 260, '🛎️ 出餐區', { fontFamily: '"微軟正黑體", sans-serif', fontSize: '18px', fill: '#27ae60', fontStyle: 'bold' }).setOrigin(0.5);

        this.trashZone = this.add.rectangle(720, 360, 130, 80, 0xff4757, 0.15).setStrokeStyle(3, 0xff4757);
        this.add.text(720, 360, '🗑️ 銷毀', { fontFamily: '"微軟正黑體", sans-serif', fontSize: '18px', fill: '#ff4757', fontStyle: 'bold' }).setOrigin(0.5);

        const dock = this.add.graphics();
        dock.fillStyle(0x2c3e50, 1); dock.fillRect(0, 480, 800, 120);
        dock.lineStyle(4, 0x1a252f, 1); dock.strokeRect(0, 480, 800, 120);
        this.add.text(12, 495, '📦 食材庫', { fontFamily: '"微軟正黑體", sans-serif', fontSize: '15px', fill: '#ecf0f1', fontStyle: 'bold' });

        this.workspaceItems = [];
        this.originalItems = [];
        this.previewLine = this.add.graphics();
        this.itemIdCounter = 0;
        this.spacing = 80;
        this.menuScrollGroup = [];
        this.currentMenuScroll = 0;

        this.addNewMenuItems(this.levelDefs[0].items);

        let btnBgL = this.add.circle(48, 555, 20, 0x3498db).setInteractive().setDepth(10);
        this.add.text(48, 555, '◀', { fontSize: '16px', fill: '#ffffff' }).setOrigin(0.5).setDepth(11);
        btnBgL.on('pointerdown', () => this.scrollMenu(this.spacing * 2));

        let btnBgR = this.add.circle(770, 540, 20, 0x3498db).setInteractive().setDepth(10);
        this.add.text(770, 540, '▶', { fontSize: '16px', fill: '#ffffff' }).setOrigin(0.5).setDepth(11);
        btnBgR.on('pointerdown', () => this.scrollMenu(-this.spacing * 2));

        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => { this.scrollMenu(deltaY > 0 ? -40 : 40); });

        this.createSideChainMenu();

        this.particles = new ParticleSystem(this);
        this.particles.init();
        this.currentSnap = null;

        this.input.on('pointerdown', (pointer, gameObjects) => {
            let clickedContainer = gameObjects.find(go => go.type === 'Container' && !go.isOriginal) ||
                (gameObjects[0]?.parentContainer && !gameObjects[0].parentContainer.isOriginal ? gameObjects[0].parentContainer : null);
            if (clickedContainer) {
                let now = this.time.now;
                if (clickedContainer.lastClickTime && now - clickedContainer.lastClickTime < 350) {
                    MoleculeLogic.flipGroup(this, clickedContainer.moleculeGroup);
                    clickedContainer.lastClickTime = 0;
                } else {
                    clickedContainer.lastClickTime = now;
                }
            }
        });

        // ==========================================
        // 🌟 拖曳移動事件 (drag)
        // ==========================================
        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            if (gameObject.type !== 'Container' || gameObject.isOriginal) return;
            let dx = dragX - gameObject.x; let dy = dragY - gameObject.y;

            if (gameObject.moleculeGroup) {
                gameObject.moleculeGroup.forEach(item => { if (item.type === 'Container') { item.x += dx; item.y += dy; } });
                gameObject.moleculeGroup.forEach(item => {
                    if (item.type === 'Graphics') {
                        item.x = 0; item.y = 0;
                        if (item.isBond) {
                            item.clear();
                            if (item.isHBond) item.lineStyle(4, 0x3498db, 0.8);
                            else item.lineStyle(5, 0x333333, 1);
                            item.lineBetween(item.itemA.x + item.magA.x, item.itemA.y + item.magA.y, item.itemB.x + item.magB.x, item.itemB.y + item.magB.y);
                        } else if (item.isRedSlash) {
                            item.clear(); item.lineStyle(4, 0xff4757, 1);
                            let cAngle = item.carboxyl.img.angle % 360 !== 0 ? -1 : 1;
                            let aAngle = item.amino.img.angle % 360 !== 0 ? -1 : 1;

                            let cx = item.carboxyl.x + (item.cOffset.x * cAngle);
                            let cy = item.carboxyl.y + (item.cOffset.y * cAngle);
                            let ax = item.amino.x + (item.aOffset.x * aAngle);
                            let ay = item.amino.y + (item.aOffset.y * aAngle);

                            // 👉 叉叉放大：原本是 8，放大為 11
                            item.lineBetween(cx - 11, cy + 11, cx + 11, cy - 11);
                            item.lineBetween(ax - 11, ay + 11, ax + 11, ay - 11);
                        }
                    }
                });
            }

            this.previewLine.clear();
            this.currentSnap = null;
            let closestDistance = 55; // 👉 寬容度放大：配合圖形變大，設為 55
            let draggingGroup = gameObject.moleculeGroup || [gameObject];

            gameObject.moleculeGroup.forEach(groupItem => {
                if (groupItem.type !== 'Container') return;
                groupItem.magnets.forEach(myMag => {
                    if (myMag.isUsed) return;
                    let myWorldX = groupItem.x + myMag.x; let myWorldY = groupItem.y + myMag.y;

                    this.workspaceItems.forEach(target => {
                        if (target.moleculeGroup && target.moleculeGroup.includes(groupItem)) return;
                        let targetGroup = target.moleculeGroup;

                        if (this.requiresMonomerAssembly) {
                            let allFramesMet = this.activeFrames.every(f => f.isMet);
                            let aValid = draggingGroup.some(i => i.isValidatedMonomer);
                            let bValid = targetGroup.some(i => i.isValidatedMonomer);
                            if (!allFramesMet) {
                                if (aValid || bValid) return;
                            } else {
                                if ((aValid && !bValid) || (!aValid && bValid)) return;
                            }
                        }

                        target.magnets.forEach(targetMag => {
                            if (targetMag.isUsed) return;
                            if (!MoleculeLogic.isValidConnection(groupItem, myMag, target, targetMag)) return;

                            if (this.currentOrder && this.currentOrder.id === 'dna_double_strand') {
                                if (groupItem.isLockedChain || target.isLockedChain) return;
                                let isHbond = myMag.y === 0 && targetMag.y === 0 && groupItem.textureKey.startsWith('base') && target.textureKey.startsWith('base');
                                if (this.currentOrder.dnaStage < 5 && isHbond) return;
                            }

                            let targetWorldX = target.x + targetMag.x; let targetWorldY = target.y + targetMag.y;
                            let dist = Phaser.Math.Distance.Between(myWorldX, myWorldY, targetWorldX, targetWorldY);

                            if (dist < closestDistance) {
                                closestDistance = dist;
                                this.currentSnap = { myItem: groupItem, myMag: myMag, targetItem: target, targetMag: targetMag, targetWorldX: targetWorldX, targetWorldY: targetWorldY };
                            }
                        });
                    });
                });
            });

            if (this.currentSnap) {
                let s = this.currentSnap;
                this.previewLine.lineStyle(5, 0x3498db, 0.8);
                this.previewLine.lineBetween(s.targetWorldX, s.targetWorldY, s.myItem.x + s.myMag.x, s.myItem.y + s.myMag.y);
            }
        });

        // ==========================================
        // 🌟 開始拖曳事件 (dragstart)
        // ==========================================
        this.input.on('dragstart', (pointer, gameObject) => {
            if (gameObject.type !== 'Container') return;
            if (gameObject.moleculeGroup) {
                gameObject.moleculeGroup.forEach(item => { if (item.setDepth) item.setDepth(10); });
            }

            if (gameObject.isOriginal) {
                gameObject.isOriginal = false;
                gameObject.list[0].setTint(0xaaaaaa);
                gameObject.magnets.forEach(m => { if (!m.isUsed) m.visual.setVisible(true); });

                // 👉 圖形放大：原本 0.6，放大至 0.75
                let WS_SCALE = 0.75;
                gameObject.img.setScale(gameObject.itemData.scale * WS_SCALE);
                gameObject.img.x = gameObject.itemData.imageOffset ? gameObject.itemData.imageOffset.x * WS_SCALE : 0;
                gameObject.img.y = gameObject.itemData.imageOffset ? gameObject.itemData.imageOffset.y * WS_SCALE : 0;
                if (gameObject.itemData.key === 'glycerol') {
                    gameObject.img.setScale(gameObject.itemData.scale * WS_SCALE);
                    gameObject.img.y = gameObject.itemData.imageOffset ? gameObject.itemData.imageOffset.y * WS_SCALE : 0;
                }

                let replacement = this.spawnIngredient(gameObject.originalX, gameObject.originalY, gameObject.itemData, true);
                let scrollEntry = this.menuScrollGroup.find(entry => entry.container === gameObject);
                if (scrollEntry) scrollEntry.container = replacement;

                gameObject.moleculeGroup = [gameObject];
                gameObject.setDepth(10);
                this.workspaceItems.push(gameObject);
            } else {
                if (!gameObject.isLockedChain) gameObject.list[0].setTint(0xcccccc);
            }
        });

        // ==========================================
        // 🌟 結束拖曳事件 (dragend)
        // ==========================================
        this.input.on('dragend', (pointer, gameObject) => {
            if (gameObject.type !== 'Container') return;
            if (gameObject.moleculeGroup) {
                gameObject.moleculeGroup.forEach(item => { if (item.setDepth) item.setDepth(1); });
            }
            if (gameObject.list && gameObject.list.length > 0 && !gameObject.isLockedChain) {
                gameObject.list[0].clearTint();
            }
            this.previewLine.clear();

            if (this.currentSnap) {
                let s = this.currentSnap;
                let draggingGroup = [...s.myItem.moleculeGroup];
                let targetGroup = [...s.targetItem.moleculeGroup];
                let canSnap = true;

                if (this.requiresMonomerAssembly) {
                    let allFramesMet = this.activeFrames.every(f => f.isMet);
                    let aValid = draggingGroup.some(i => i.isValidatedMonomer);
                    let bValid = targetGroup.some(i => i.isValidatedMonomer);

                    if (!allFramesMet) {
                        if (aValid || bValid) {
                            if (!this.shownWarning) {
                                this.showFeedbackText(400, 200, '⚠️ 鎖定中！請先完成所有單體，才能進行連接！', '#e67e22');
                                this.shownWarning = true;
                                this.time.delayedCall(2000, () => this.shownWarning = false);
                            }
                            canSnap = false;
                        }
                    } else {
                        if ((aValid && !bValid) || (!aValid && bValid)) {
                            if (!this.shownWarning) {
                                this.showFeedbackText(400, 200, '⚠️ 做好的單體只能與其他做好的單體連接喔！', '#e67e22');
                                this.shownWarning = true;
                                this.time.delayedCall(2000, () => this.shownWarning = false);
                            }
                            canSnap = false;
                        }
                    }
                }

                if (canSnap) {
                    let newBonds = []; let redSlashes = []; let bondsFormed = 0;
                    let bondedPairs = new Set();
                    let hasDehydration = false;
                    let hasHBond = false;

                    draggingGroup.forEach(dragItem => {
                        if (dragItem.type !== 'Container') return;
                        dragItem.magnets.forEach(dragMag => {
                            if (dragMag.isUsed) return;
                            let dWorldX = dragItem.x + dragMag.x; let dWorldY = dragItem.y + dragMag.y;

                            targetGroup.forEach(targetItem => {
                                if (targetItem.type !== 'Container') return;
                                let pairId = Math.min(dragItem.uniqueId, targetItem.uniqueId) + "_" + Math.max(dragItem.uniqueId, targetItem.uniqueId);
                                if (bondedPairs.has(pairId)) return;

                                targetItem.magnets.forEach(targetMag => {
                                    if (targetMag.isUsed || bondedPairs.has(pairId)) return;
                                    if (!MoleculeLogic.isValidConnection(dragItem, dragMag, targetItem, targetMag)) return;

                                    if (this.currentOrder && this.currentOrder.id === 'dna_double_strand') {
                                        if (dragItem.isLockedChain || targetItem.isLockedChain) return;
                                        let isHbond = dragMag.y === 0 && targetMag.y === 0 && dragItem.textureKey.startsWith('base') && targetItem.textureKey.startsWith('base');
                                        if (this.currentOrder.dnaStage < 5 && isHbond) return;
                                    }

                                    let tWorldX = targetItem.x + targetMag.x; let tWorldY = targetItem.y + targetMag.y;
                                    let dist = Phaser.Math.Distance.Between(dWorldX, dWorldY, tWorldX, tWorldY);
                                    let isPrimarySnap = (dragMag === s.myMag && targetMag === s.targetMag);

                                    let keyA = dragItem.textureKey;
                                    let keyB = targetItem.textureKey;
                                    let isDNAPair = keyA.startsWith('base_') && keyB.startsWith('base_');

                                    // 👉 寬容度放大：配合圖形變大，改為 55
                                    if (isPrimarySnap || (isDNAPair && dist < 55)) { 
                                        bondedPairs.add(pairId);
                                        dragMag.isUsed = true; targetMag.isUsed = true;
                                        dragMag.visual.setVisible(false); targetMag.visual.setVisible(false);

                                        dragItem.connectedItems.push({ item: targetItem, myMag: dragMag, targetMag: targetMag });
                                        targetItem.connectedItems.push({ item: dragItem, myMag: targetMag, targetMag: dragMag });

                                        let bondLine = this.add.graphics();
                                        bondLine.isBond = true; bondLine.itemA = dragItem; bondLine.magA = dragMag; bondLine.itemB = targetItem; bondLine.magB = targetMag;

                                        bondLine.isHBond = isDNAPair;
                                        bondLine.isDehydration = false;

                                        if (!isDNAPair) {
                                            let isInternalAmino = keyA === 'carbon' || keyB === 'carbon' || keyA.startsWith('side_chain') || keyB.startsWith('side_chain');
                                            let isSugarBase = (keyA.includes('ribose') && keyB.startsWith('base_')) || (keyB.includes('ribose') && keyA.startsWith('base_'));
                                            let isSugarPhos = (keyA.includes('ribose') && keyB === 'phosphate_group_nucleotide') || (keyB.includes('ribose') && keyA === 'phosphate_group_nucleotide');

                                            if (isSugarPhos) {
                                                let sugarMag = keyA.includes('ribose') ? dragMag : targetMag;
                                                if (sugarMag.y > 5) bondLine.isDehydration = true;
                                            } else if (!isInternalAmino && !isSugarBase) {
                                                bondLine.isDehydration = true;
                                            }
                                        }

                                        if (bondLine.isDehydration) hasDehydration = true;
                                        if (bondLine.isHBond) hasHBond = true;

                                        if (bondLine.isHBond) bondLine.lineStyle(4, 0x3498db, 0.8);
                                        else bondLine.lineStyle(5, 0x333333, 1);

                                        bondLine.lineBetween(tWorldX, tWorldY, dWorldX, dWorldY);
                                        bondLine.setDepth(0);
                                        newBonds.push(bondLine); bondsFormed++;

                                        let isPeptideBond = (keyA === 'carboxyl_group' && keyB === 'amino_group') || (keyA === 'amino_group' && keyB === 'carboxyl_group');

                                        if (isPeptideBond) {
                                            let redSlash = this.add.graphics();
                                            redSlash.isRedSlash = true;
                                            redSlash.carboxyl = keyA === 'carboxyl_group' ? dragItem : targetItem;
                                            redSlash.amino = keyA === 'amino_group' ? dragItem : targetItem;

                                            redSlash.cOffset = redSlash.carboxyl.strikeOffset;
                                            redSlash.aOffset = redSlash.amino.strikeOffset;

                                            redSlash.lineStyle(4, 0xff4757, 1);
                                            let cAngle = redSlash.carboxyl.img.angle % 360 !== 0 ? -1 : 1;
                                            let aAngle = redSlash.amino.img.angle % 360 !== 0 ? -1 : 1;

                                            let kx = redSlash.carboxyl.x + (redSlash.cOffset.x * cAngle);
                                            let ky = redSlash.carboxyl.y + (redSlash.cOffset.y * cAngle);
                                            let kx2 = redSlash.amino.x + (redSlash.aOffset.x * aAngle);
                                            let ky2 = redSlash.amino.y + (redSlash.aOffset.y * aAngle);

                                            // 👉 叉叉放大：原本是 8，放大為 11
                                            redSlash.lineBetween(kx - 11, ky + 11, kx + 11, ky - 11);
                                            redSlash.lineBetween(kx2 - 11, ky2 + 11, kx2 + 11, ky2 - 11);
                                            redSlash.setDepth(5);
                                            redSlashes.push(redSlash);
                                        }
                                    }
                                });
                            });
                        });
                    });

                    if (bondsFormed > 0) {
                        let mergedGroup = [...targetGroup, ...draggingGroup, ...newBonds, ...redSlashes];
                        mergedGroup.forEach(item => { if (item.type === 'Container') item.moleculeGroup = mergedGroup; });
                        gameObject.moleculeGroup = mergedGroup;

                        if (hasHBond) {
                            this.particles.playHydrogenBond(s.myItem.x, s.myItem.y);
                        } else if (hasDehydration) {
                            this.particles.playWater(s.myItem.x, s.myItem.y);
                        }
                    }
                }
                this.currentSnap = null;
            }

            let inSubmitZone = false;
            let inTrashZone = false;
            let px = pointer.x;
            let py = pointer.y;

            let checkSubmit = (x, y) => { return x > (720 - 65 - 20) && x < (720 + 65 + 20) && y > (260 - 40 - 20) && y < (260 + 40 + 20); };
            let checkTrash = (x, y) => { return y > 480 || (x > (720 - 65 - 20) && x < (720 + 65 + 20) && y > (360 - 40 - 20) && y < (360 + 40 + 20)); };

            if (checkSubmit(px, py)) inSubmitZone = true;
            if (checkTrash(px, py)) inTrashZone = true;

            if (gameObject.moleculeGroup) {
                if (!inSubmitZone) {
                    inSubmitZone = gameObject.moleculeGroup.some(item => item.type === 'Container' && checkSubmit(item.x, item.y));
                }
                if (!inTrashZone) {
                    inTrashZone = gameObject.moleculeGroup.some(item => item.type === 'Container' && checkTrash(item.x, item.y));
                }
            }

            if (inSubmitZone) inTrashZone = false;

            if (inSubmitZone) {
                this.orderManager.evaluateOrder(gameObject.moleculeGroup);
                return;
            }

            if (inTrashZone) {
                if (!gameObject.isOriginal && gameObject.moleculeGroup) {
                    gameObject.moleculeGroup.forEach(item => {
                        if (item.type === 'Container') { this.workspaceItems = this.workspaceItems.filter(i => i !== item); }
                        item.destroy();
                    });
                }
                return;
            }

            if (this.requiresMonomerAssembly || (this.currentOrder && this.currentOrder.id === 'dna_double_strand')) {
                let draggingGroup = gameObject.moleculeGroup;
                let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
                draggingGroup.forEach(g => {
                    if (g.type === 'Container') { minX = Math.min(minX, g.x); maxX = Math.max(maxX, g.x); minY = Math.min(minY, g.y); maxY = Math.max(maxY, g.y); }
                });
                let groupCx = (minX + maxX) / 2;
                let groupCy = (minY + maxY) / 2;

                this.activeFrames.forEach(frame => {
                    let inBounds = Math.abs(groupCx - frame.x) < (frame.width / 2) && Math.abs(groupCy - frame.y) < (frame.height / 2);

                    if (inBounds) {
                        // 🌟 核心防禦：如果這框已經被別人佔用，或者這分子已經佔用了別的框，直接跳過！
                       if (frame.isMet && frame.satisfiedBy && frame.satisfiedBy !== draggingGroup[0]) return;
                        
                        // 🌟 修正：只檢查目前「畫面上的有效框」，忽略上一個階段已經消失的舊框！
                        if (draggingGroup[0].satisfiedFrame && this.activeFrames.includes(draggingGroup[0].satisfiedFrame) && draggingGroup[0].satisfiedFrame !== frame) return;

                        let statusCheck = 0;
                        if (frame.monomerType === 'dna_chain') {
                            statusCheck = this.orderManager.checkDinucleotide(draggingGroup, frame.base1, frame.base2) ? 1 : -1;
                        } else {
                            statusCheck = MoleculeLogic.checkMonomer(draggingGroup, frame.monomerType, frame.specificKey);
                        }

                        if (statusCheck === 1 && !frame.isMet) {
                            frame.isMet = true;
                            frame.satisfiedBy = draggingGroup[0]; // 綁定
                            draggingGroup[0].satisfiedFrame = frame; // 綁定

                            frame.rect.setStrokeStyle(4, 0x2ecc71);
                            frame.status.setText('✅ 已完成').setColor('#2ecc71');
                            draggingGroup.forEach(gItem => gItem.isValidatedMonomer = true);
                            let flash = this.add.rectangle(frame.x, frame.y, frame.width, frame.height, 0x2ecc71, 0.4);
                            this.tweens.add({ targets: flash, alpha: 0, duration: 500, onComplete: () => flash.destroy() });

                            if (this.currentOrder && this.currentOrder.id === 'dna_double_strand') {
                                this.time.delayedCall(400, () => this.orderManager.checkDNAStage());
                            }
                        } else if (statusCheck === -1) {
                            frame.isMet = false;
                            frame.satisfiedBy = null; // 解除綁定
                            draggingGroup[0].satisfiedFrame = null; // 解除綁定
                            
                            frame.rect.setStrokeStyle(4, 0xe74c3c);
                            frame.status.setText('❌ 錯位').setColor('#e74c3c');
                        }
                    }
                });
            }
        });
    }



    // 👉 強制將錯誤提示文字顯示在畫面上方中央 (Y=150)，且強制置中不斷行出界
    showFeedbackText(x, y, text, color) {
        let feedback = this.add.text(400, 150, text, {
            fontFamily: '"微軟正黑體", sans-serif', fontSize: '20px', fill: '#ffffff',
            fontStyle: 'bold', backgroundColor: color, padding: { x: 15, y: 10 },
            borderRadius: 8, wordWrap: { width: 750 }, align: 'center'
        }).setOrigin(0.5).setDepth(3000);
        this.tweens.add({ targets: feedback, y: 100, alpha: 0, duration: 3000, onComplete: () => feedback.destroy() });
    }

    scrollMenu(shiftAmount) {
        let minX = - (this.menuItemCount * this.spacing - 600);
        if (minX > 0) minX = 0;
        let newScroll = this.currentMenuScroll + shiftAmount;
        if (newScroll > 0) newScroll = 0;
        if (newScroll < minX) newScroll = minX;

        let actualShift = newScroll - this.currentMenuScroll;
        this.currentMenuScroll = newScroll;

        this.menuScrollGroup.forEach(item => { item.box.x += actualShift; item.nameText.x += actualShift; item.container.x += actualShift; item.container.originalX += actualShift; });
    }

    addNewMenuItems(itemKeys) {
        let startX = 140;
        itemKeys.forEach((key, i) => {
            let data = this.menuItems.find(m => m.key === key);
            if (!data) return;

            let cx = startX + (this.menuItemCount * this.spacing); let cy = 540;
            let box = this.add.graphics(); box.fillStyle(0xffffff, 1);
            box.fillRoundedRect(-35, -45, 70, 90, 8);
            box.lineStyle(2, 0x3498db, 1); box.strokeRoundedRect(-35, -45, 70, 90, 8);
            box.setPosition(cx, cy);

            let nameText = this.add.text(cx, cy - 35, data.name, { fontFamily: '"微軟正黑體", sans-serif', fontSize: '18px', fill: '#333333', fontStyle: 'bold' }).setOrigin(0.5);

            let container = this.spawnIngredient(cx, cy + 10, data, true);

            box.x += this.currentMenuScroll;
            nameText.x += this.currentMenuScroll;
            container.x += this.currentMenuScroll;
            container.originalX = container.x;

            this.menuScrollGroup.push({ box, nameText, container });

            box.alpha = 0; nameText.alpha = 0; container.alpha = 0;
            box.y += 30; nameText.y += 30; container.y += 30;
            this.tweens.add({ targets: [box, nameText, container], y: '-=30', alpha: 1, duration: 600, ease: 'Back.easeOut', delay: i * 100 });

            this.menuItemCount++;
        });
    }

    spawnIngredient(x, y, data, isMenuIcon = false) {
        let container = this.add.container(x, y);
        this.itemIdCounter++; container.uniqueId = this.itemIdCounter;

        // 👉 統一將所有圖形與磁吸點縮放至 60% (原本是 1.0)
        let WS_SCALE = 0.75;

        let imgX = data.imageOffset ? data.imageOffset.x * WS_SCALE : 0;
        let imgY = data.imageOffset ? data.imageOffset.y * WS_SCALE : 0;
        let img = this.add.image(imgX, imgY, data.key);

        if (isMenuIcon) {
            img.setScale(data.scale * 0.5); // 選單中再小一點點
            if (data.key === 'glycerol') {
                img.setScale(data.scale * 0.35);
                img.y += 10;
            }
        } else {
            img.setScale(data.scale * WS_SCALE); // 拖出來後變成統一 0.6 比例
        }

        container.add(img); container.img = img;

        container.magnets = [];
        if (data.magnets) {
            data.magnets.forEach(mag => {
                // 👉 吸附點座標統一照比例縮小
                let m = { x: mag.x * WS_SCALE, y: mag.y * WS_SCALE, isUsed: false };
                let dot = this.add.circle(m.x, m.y, 4, 0x3498db); m.visual = dot;
                if (isMenuIcon) dot.setVisible(false);
                container.add(dot); container.magnets.push(m);
            });
        }

        container.connectedItems = [];
        container.setSize(100, 100);
        container.textureKey = data.key;
        container.itemData = data;

        // 👉 紅線(脫水鍵)位移點也同步縮小
        container.strikeOffset = data.strikeOffset ? { x: data.strikeOffset.x * WS_SCALE, y: data.strikeOffset.y * WS_SCALE } : null;

        if (isMenuIcon) {
            container.isOriginal = true; container.originalX = x; container.originalY = y; this.originalItems.push(container);
            if (data.isSideChain) {
                container.setInteractive(); container.on('pointerdown', () => this.sideChainMenu.setVisible(true));
            } else {
                container.setInteractive(); this.input.setDraggable(container);
            }
        } else {
            container.isOriginal = false; container.moleculeGroup = [container]; container.setDepth(1);
            container.setInteractive(); this.input.setDraggable(container); this.workspaceItems.push(container);
        }
        return container;
    }

    createSideChainMenu() {
        this.sideChainMenu = this.add.container(0, 0).setDepth(200).setVisible(false);
        let overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.6).setInteractive();
        let panel = this.add.rectangle(400, 300, 640, 520, 0xffffff).setStrokeStyle(4, 0x2c3e50);
        let title = this.add.text(400, 70, '請選擇側鏈 (R 基團)', { fontFamily: '"微軟正黑體", sans-serif', fontSize: '28px', fill: '#2c3e50', fontStyle: 'bold' }).setOrigin(0.5);
        let closeBtn = this.add.text(680, 50, '✖', { fontSize: '28px', fill: '#e74c3c' }).setInteractive();
        closeBtn.on('pointerdown', () => this.sideChainMenu.setVisible(false));
        this.sideChainMenu.add([overlay, panel, title, closeBtn]);

        let startX = 180; let startY = 150;
        for (let i = 1; i <= 20; i++) {
            let num = i < 10 ? '0' + i : i.toString(); let textureName = `side_chain_${num}`;
            let row = Math.floor((i - 1) / 5); let col = (i - 1) % 5;
            let px = startX + col * 110; let py = startY + row * 85;

            let bgBox = this.add.rectangle(px, py, 90, 75, 0xf8f9fa).setStrokeStyle(2, 0xbdc3c7);
            let img = this.add.image(px, py - 10, textureName).setScale(0.12).setInteractive();
            let text = this.add.text(px, py + 22, `#${num}`, { fontFamily: '"微軟正黑體", sans-serif', fontSize: '15px', fill: '#2c3e50', fontStyle: 'bold' }).setOrigin(0.5);

            img.on('pointerdown', () => { this.sideChainMenu.setVisible(false); this.spawnSelectedSideChain(textureName); });
            img.on('pointerover', () => bgBox.setStrokeStyle(3, 0x3498db).setFillStyle(0xe8f4f8));
            img.on('pointerout', () => bgBox.setStrokeStyle(2, 0xbdc3c7).setFillStyle(0xf8f9fa));
            this.sideChainMenu.add([bgBox, img, text]);
        }
    }

    spawnSelectedSideChain(textureKey) {
        let baseData = this.menuItems.find(m => m.isSideChain);
        let newData = { ...baseData, key: textureKey, isSideChain: false };
        this.spawnIngredient(400, 250, newData, false);
    }

    handleOrderTimeout() {
        this.showFeedbackText(640, 145, '💢 顧客等太久生氣走掉了！', '#e74c3c');
        this.cameras.main.shake(300, 0.015);

        this.currentCombo = 0;
        this.updateComboUI();

        if (this.requiresMonomerAssembly) {
            this.activeFrames.forEach(frame => {
                frame.isMet = false;
                frame.rect.setStrokeStyle(4, 0xe74c3c);
                frame.status.setText('❌ 超時').setColor('#e74c3c');
            });
            this.workspaceItems.forEach(i => {
                if (i.type === 'Container') i.isValidatedMonomer = false;
            });
        }

        this.time.delayedCall(1500, () => {
            this.orderManager.generateNewOrder();
        });
    }

    updateComboUI() {
        if (this.currentCombo >= 2) {
            this.comboText.setText(`🔥 ${this.currentCombo} COMBO!`);
            this.tweens.add({ targets: this.comboText, scaleX: 1.3, scaleY: 1.3, yoyo: true, duration: 150 });

            if (this.currentCombo >= 5 && !this.isFeverMode) {
                this.startFeverMode();
            }
        } else {
            this.comboText.setText('');
        }
    }

    startFeverMode() {
        this.isFeverMode = true;

        let feverAnnounce = this.add.text(400, 250, '✨ FEVER TIME! 營收雙倍 ✨', {
            fontFamily: '"微軟正黑體", sans-serif', fontSize: '28px', fill: '#ffffff', fontStyle: 'bold',
            backgroundColor: '#f39c12', padding: { x: 20, y: 10 }, borderRadius: 8,
            shadow: { offsetX: 2, offsetY: 2, color: '#d35400', blur: 0, stroke: false, fill: true }
        }).setOrigin(0.5).setDepth(200);

        this.tweens.add({
            targets: feverAnnounce, y: 150, alpha: 0, scale: 1.1, duration: 2000, ease: 'Cubic.easeOut',
            onComplete: () => feverAnnounce.destroy()
        });

        this.feverBanner = this.add.text(400, 25, '🔥 狂熱時間 🔥', {
            fontFamily: '"微軟正黑體", sans-serif', fontSize: '20px', fill: '#ffffff', fontStyle: 'bold',
            backgroundColor: '#e67e22', padding: { x: 20, y: 5 }, borderRadius: 8,
            shadow: { offsetX: 2, offsetY: 2, color: '#d35400', blur: 0, fill: true }
        }).setOrigin(0.5).setDepth(200);

        this.tweens.add({ targets: this.feverBanner, scaleX: 1.1, scaleY: 1.1, yoyo: true, repeat: -1, duration: 500 });

        this.feverOverlay.setAlpha(0.6);
        this.feverTween = this.tweens.add({ targets: this.feverOverlay, alpha: 0.35, duration: 600, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });

        if (this.feverTimer) this.feverTimer.remove();
        this.feverTimer = this.time.delayedCall(15000, () => {
            this.endFeverMode();
        });
    }

    endFeverMode() {
        this.isFeverMode = false;
        this.currentCombo = 0;
        this.updateComboUI();

        if (this.feverBanner) {
            this.feverBanner.destroy();
            this.feverBanner = null;
        }

        if (this.feverTween) this.feverTween.stop();
        this.tweens.add({ targets: this.feverOverlay, alpha: 0, duration: 500 });

        this.showFeedbackText(400, 300, '❄️ Fever 結束', '#3498db');
    }

    update(time, delta) {
        if (!this.isGameActive) return;

        this.gameTimeLeft -= delta;
        if (this.gameTimeLeft <= 0) {
            this.gameTimeLeft = 0;
            this.endGame();
        }

        let minutes = Math.floor(this.gameTimeLeft / 60000);
        let seconds = Math.floor((this.gameTimeLeft % 60000) / 1000);
        this.gameTimerText.setText(`⏳ ${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);

        if (this.gameTimeLeft <= 30000) {
            this.gameTimerText.setColor('#e74c3c');
            if (Math.floor(this.gameTimeLeft / 250) % 2 === 0) this.gameTimerText.setAlpha(1); else this.gameTimerText.setAlpha(0.5);
        }

        if (!this.isTimerActive || !this.currentOrder) return;

        if (!this.isFeverMode) {
            this.orderTimeLeft -= delta;
            if (this.orderTimeLeft <= 0) {
                this.orderTimeLeft = 0;
                this.isTimerActive = false;
                this.handleOrderTimeout();
            }
        }

        if (this.patienceBar) {
            let percentage = this.orderTimeLeft / this.orderTimeMax;
            this.patienceBar.width = 260 * percentage;
            if (this.isFeverMode) {
                this.patienceBar.fillColor = 0xf1c40f;
            } else if (percentage > 0.5) {
                this.patienceBar.fillColor = 0x2ecc71;
            } else if (percentage > 0.25) {
                this.patienceBar.fillColor = 0xf39c12;
            } else {
                this.patienceBar.fillColor = 0xe74c3c;
            }
        }
    }

    endGame() {
        this.isGameActive = false;
        this.isTimerActive = false;

        let overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.85).setDepth(1000).setInteractive();
        this.add.text(400, 100, '⏰ 營業結束！', { fontFamily: '"微軟正黑體", sans-serif', fontSize: '48px', fill: '#f1c40f', fontStyle: 'bold' }).setOrigin(0.5).setDepth(1001);

        let scoreBoard = this.add.rectangle(400, 200, 450, 100, 0xffffff).setStrokeStyle(6, 0x3498db).setDepth(1001);
        this.add.text(400, 180, `💰 總營業額: $${this.score}`, { fontFamily: '"微軟正黑體", sans-serif', fontSize: '28px', fill: '#27ae60', fontStyle: 'bold' }).setOrigin(0.5).setDepth(1002);
        this.add.text(400, 220, `🔥 最高連擊數: ${this.maxCombo} Combo`, { fontFamily: '"微軟正黑體", sans-serif', fontSize: '20px', fill: '#e74c3c', fontStyle: 'bold' }).setOrigin(0.5).setDepth(1002);

        // 🌟 改變作法：用 Phaser 畫出假的「輸入框按鈕」，點擊後彈出原生輸入視窗
        this.add.text(280, 300, '班別:', { fontFamily: '"微軟正黑體", sans-serif', fontSize: '24px', fill: '#ffffff', fontStyle: 'bold' }).setOrigin(1, 0.5).setDepth(1002);
        this.add.text(280, 360, '學號:', { fontFamily: '"微軟正黑體", sans-serif', fontSize: '24px', fill: '#ffffff', fontStyle: 'bold' }).setOrigin(1, 0.5).setDepth(1002);

        let classVal = "4A";
        let numVal = "1";

        let classBtnBg = this.add.rectangle(400, 300, 200, 40, 0xffffff).setInteractive({ useHandCursor: true }).setDepth(1002);
        let classTxt = this.add.text(400, 300, classVal, { fontSize: '22px', fill: '#000' }).setOrigin(0.5).setDepth(1003);

        let numBtnBg = this.add.rectangle(400, 360, 200, 40, 0xffffff).setInteractive({ useHandCursor: true }).setDepth(1002);
        let numTxt = this.add.text(400, 360, numVal, { fontSize: '22px', fill: '#000' }).setOrigin(0.5).setDepth(1003);

        // 點擊後彈出系統預設的輸入框 (絕不跑位)
        classBtnBg.on('pointerdown', () => {
            let input = prompt("請輸入班別 (例如 4A, 5B)：", classVal);
            if (input) { classVal = input; classTxt.setText(classVal); }
        });
        numBtnBg.on('pointerdown', () => {
            let input = prompt("請輸入學號 (1~40)：", numVal);
            if (input) { numVal = input; numTxt.setText(numVal); }
        });

        let statusMsg = this.add.text(400, 420, '', { fontFamily: '"微軟正黑體", sans-serif', fontSize: '18px', fill: '#2ecc71', fontStyle: 'bold' }).setOrigin(0.5).setDepth(1002);
        let submitBtn = this.add.text(400, 480, '📤 上傳分數', { fontFamily: '"微軟正黑體", sans-serif', fontSize: '26px', fill: '#ffffff', backgroundColor: '#e67e22', padding: { x: 20, y: 10 }, borderRadius: 8 }).setOrigin(0.5).setDepth(1002).setInteractive({ useHandCursor: true });
        let returnBtn = this.add.text(400, 550, '🏠 回主選單', { fontFamily: '"微軟正黑體", sans-serif', fontSize: '24px', fill: '#ffffff', backgroundColor: '#7f8c8d', padding: { x: 20, y: 10 }, borderRadius: 8 }).setOrigin(0.5).setDepth(1002).setInteractive({ useHandCursor: true });

        submitBtn.on('pointerdown', async () => {
            submitBtn.disableInteractive();
            submitBtn.setAlpha(0.5);
            statusMsg.setText('上傳中...').setColor('#f1c40f');
            let result = await saveScore(classVal, numVal, this.score);
            statusMsg.setText(result).setColor(result.includes('失敗') ? '#e74c3c' : '#2ecc71');
        });

        returnBtn.on('pointerdown', () => {
            this.scene.start('MainMenu');
        });
    }


    showRecipes() {
        this.recipePopupContainer.removeAll(true);
        this.recipePopupContainer.setVisible(true);

        let overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8).setInteractive();
        let panel = this.add.rectangle(400, 300, 650, 500, 0xecf0f1).setStrokeStyle(6, 0xbdc3c7);
        let title = this.add.text(400, 80, '📚 分子食譜', { fontFamily: '"微軟正黑體", sans-serif', fontSize: '32px', fill: '#2c3e50', fontStyle: 'bold' }).setOrigin(0.5);
        let closeBtn = this.add.text(690, 80, '✖', { fontSize: '30px', fill: '#e74c3c', fontStyle: 'bold' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        closeBtn.on('pointerdown', () => this.recipePopupContainer.setVisible(false));

        let recipes = ['recipe1', 'recipe2', 'recipe3', 'recipe4', 'recipe5'];
        let currentIndex = 0;

        let recipeImage = this.add.image(400, 300, recipes[currentIndex]).setDisplaySize(550, 350);
        let pageText = this.add.text(400, 510, `第 ${currentIndex + 1} / 5 頁`, { fontFamily: '"微軟正黑體", sans-serif', fontSize: '20px', fill: '#2c3e50', fontStyle: 'bold' }).setOrigin(0.5);

        let leftBtn = this.add.text(120, 300, '◀', { fontSize: '50px', fill: '#3498db' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        let rightBtn = this.add.text(680, 300, '▶', { fontSize: '50px', fill: '#3498db' }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        let updatePage = () => {
            recipeImage.setTexture(recipes[currentIndex]);
            pageText.setText(`第 ${currentIndex + 1} / 5 頁`);
        };

        leftBtn.on('pointerdown', () => {
            currentIndex = (currentIndex - 1 + recipes.length) % recipes.length;
            updatePage();
        });
        rightBtn.on('pointerdown', () => {
            currentIndex = (currentIndex + 1) % recipes.length;
            updatePage();
        });

        this.recipePopupContainer.add([overlay, panel, title, closeBtn, recipeImage, leftBtn, rightBtn, pageText]);
    }
}
