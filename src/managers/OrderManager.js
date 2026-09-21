import Phaser from 'phaser';
import { MoleculeLogic } from '../MoleculeLogic.js';

export default class OrderManager {
    constructor(scene) {
        this.scene = scene;
    }

    fmtBase(b) {
        return b.replace('base_', '').toUpperCase();
    }

    createFrame(mType, key, label, w, h, cx, cy, base1 = null, base2 = null) {
        const scene = this.scene;
        let rect = scene.add.rectangle(cx, cy, w, h, 0xffffff, 0.5).setStrokeStyle(2, 0x95a5a6).setInteractive();
        let text = scene.add.text(cx, cy - (h / 2 - 20), label, { fontFamily: '"微軟正黑體", sans-serif', fontSize: '13px', fill: '#34495e', fontStyle: 'bold', align: 'center' }).setOrigin(0.5);
        let status = scene.add.text(cx, cy + (h / 2 - 20), '未完成', { fontFamily: '"微軟正黑體", sans-serif', fontSize: '12px', fill: '#e74c3c', fontStyle: 'bold' }).setOrigin(0.5);
        scene.framesLayer.add([rect, text, status]);
        scene.activeFrames.push({ x: cx, y: cy, width: w, height: h, rect, text, status, monomerType: mType, specificKey: key, base1: base1, base2: base2, isMet: false });
    }

    checkDinucleotide(group, b1, b2) {
        let sugars = group.filter(i => i.textureKey === 'deoxyribose');
        if (sugars.length !== 2) return false;

        let polymerBonds = 0; let validPolymerBonds = 0;
        let headSugar = null; let tailSugar = null;

        sugars.forEach(s => {
            let botLeftPhos = s.connectedItems.find(c => c.item.textureKey === 'phosphate_group_nucleotide' && c.myMag.x < 10 && c.myMag.y > 5);
            if (botLeftPhos) {
                polymerBonds++;
                if (botLeftPhos.targetMag.y < -5) validPolymerBonds++;
                headSugar = s;
            } else { tailSugar = s; }
        });

        if (polymerBonds !== 1 || validPolymerBonds !== 1) return false;
        if (!headSugar || !tailSugar) return false;

        let baseItem1 = headSugar.connectedItems.find(c => c.item.textureKey.startsWith('base_') && c.myMag.x > 0 && c.myMag.y < 0);
        let baseItem2 = tailSugar.connectedItems.find(c => c.item.textureKey.startsWith('base_') && c.myMag.x > 0 && c.myMag.y < 0);

        if (!baseItem1 || !baseItem2) return false;
        if (baseItem1.item.textureKey === b1 && baseItem2.item.textureKey === b2) return true;
        return false;
    }

    checkDNAStage() {
        const scene = this.scene;
        let order = scene.currentOrder;
        if (!order || order.id !== 'dna_double_strand') return;

        let allMet = scene.activeFrames.every(f => f.isMet);
        if (!allMet) return;

        let left1 = order.targetSequenceLeft[0]; let left2 = order.targetSequenceLeft[1];
        let right1 = order.targetSequenceRight[0]; let right2 = order.targetSequenceRight[1];

        if (order.dnaStage === 1) {
            order.dnaStage = 2;
            scene.framesLayer.removeAll(true);
            scene.activeFrames = [];
            scene.requiresMonomerAssembly = false;

            this.createFrame('dna_chain', null, `左鏈\n(${this.fmtBase(left1)}-${this.fmtBase(left2)})`, 200, 280, 280, 280, left1, left2);
            order.instructionText = scene.add.text(400, 200, '步驟 2: 請將這 2 個單體相連成「左鏈」\n(並放入左方檢查框中)', { fontFamily: '"微軟正黑體", sans-serif', fontSize: '18px', fill: '#d35400', fontStyle: 'bold', align: 'center' }).setOrigin(0.5);
            scene.framesLayer.add(order.instructionText);
        }
        else if (order.dnaStage === 2) {
            scene.workspaceItems.forEach(i => {
                if (i.isValidatedMonomer && !i.isLockedChain) {
                    i.isLockedChain = true;
                    if (!i.isOriginal) i.list[0].setTint(0xccffff);
                }
            });

            order.dnaStage = 3;
            scene.framesLayer.removeAll(true);
            scene.activeFrames = [];
            scene.requiresMonomerAssembly = true;

            this.createFrame('dna_nucleotide', right1, `右鏈單體 1\n(${this.fmtBase(right1)})`, 130, 130, 440, 280);
            this.createFrame('dna_nucleotide', right2, `右鏈單體 2\n(${this.fmtBase(right2)})`, 130, 130, 580, 280);
            order.instructionText = scene.add.text(400, 200, '步驟 3: 左鏈已固定！\n現在依照提示組合「右鏈」的 2 個單體', { fontFamily: '"微軟正黑體", sans-serif', fontSize: '18px', fill: '#2980b9', fontStyle: 'bold', align: 'center' }).setOrigin(0.5);
            scene.framesLayer.add(order.instructionText);
        }
        else if (order.dnaStage === 3) {
            order.dnaStage = 4;
            scene.framesLayer.removeAll(true);
            scene.activeFrames = [];
            scene.requiresMonomerAssembly = false;

            this.createFrame('dna_chain', null, `右鏈\n(${this.fmtBase(right1)}-${this.fmtBase(right2)})`, 200, 280, 510, 280, right1, right2);
            order.instructionText = scene.add.text(400, 200, '步驟 4: 請將這 2 個單體相連成「右鏈」\n(並放入右方檢查框中)', { fontFamily: '"微軟正黑體", sans-serif', fontSize: '18px', fill: '#d35400', fontStyle: 'bold', align: 'center' }).setOrigin(0.5);
            scene.framesLayer.add(order.instructionText);
        }
        else if (order.dnaStage === 4) {
            scene.workspaceItems.forEach(i => {
                i.isLockedChain = false;
                if (!i.isOriginal) i.list[0].clearTint();
            });

            order.dnaStage = 5;
            scene.framesLayer.removeAll(true);
            scene.activeFrames = [];
            order.instructionText = scene.add.text(400, 200, '步驟 5: 左右鏈皆完成！🎉\n請將「右鏈」反轉 (連點兩下)，與左鏈配對後出餐！', { fontFamily: '"微軟正黑體", sans-serif', fontSize: '20px', fill: '#27ae60', fontStyle: 'bold', align: 'center' }).setOrigin(0.5);
            scene.framesLayer.add(order.instructionText);
        }
    }

    generateNewOrder() {
        const scene = this.scene;
        scene.framesLayer.removeAll(true);
        scene.activeFrames = [];
        scene.requiresMonomerAssembly = false;

        let orderTypes = scene.unlockedOrders;
        let availableTypes = orderTypes.filter(t => !scene.recentOrders.includes(t));
        if (availableTypes.length === 0) availableTypes = orderTypes;

        let type;
        if (scene.currentLevel >= 3) {
            let highLevelOrders = availableTypes.filter(t =>
                scene.levelDefs[2].orders.includes(t) || (scene.levelDefs[3] && scene.levelDefs[3].orders.includes(t))
            );
            let lowLevelOrders = availableTypes.filter(t => !highLevelOrders.includes(t));

            if (highLevelOrders.length > 0 && Math.random() < 0.8) {
                type = Phaser.Utils.Array.GetRandom(highLevelOrders);
            } else if (lowLevelOrders.length > 0) {
                type = Phaser.Utils.Array.GetRandom(lowLevelOrders);
            } else {
                type = Phaser.Utils.Array.GetRandom(availableTypes);
            }
        } else {
            type = Phaser.Utils.Array.GetRandom(availableTypes);
        }

        scene.recentOrders.push(type);
        if (scene.recentOrders.length > 5) scene.recentOrders.shift();
        let order = { id: type, req: {} };

        const getSC = () => { let n = Math.floor(Math.random() * 20) + 1; return 'side_chain_' + (n < 10 ? '0' + n : n); };
        const getDNA = () => Phaser.Utils.Array.GetRandom(['base_a', 'base_t', 'base_c', 'base_g']);
        const getRNA = () => Phaser.Utils.Array.GetRandom(['base_a', 'base_u', 'base_c', 'base_g']);
        const fmtSC = (s) => s.replace('side_chain_', '#');

        let cx = 110;

        if (type === 'sucrose') { order.name = '蔗糖'; order.req = { 'glucose': 1, 'fructose': 1 }; }
        else if (type === 'maltose') { order.name = '麥芽糖'; order.req = { 'glucose': 2 }; }
        else if (type === 'lactose') { order.name = '乳糖'; order.req = { 'glucose': 1, 'galactose': 1 }; }
        else if (type === 'triglyceride') { order.name = '甘油三酯\n(脂肪)'; order.req = { 'glycerol': 1, 'fatty_acid': 3 }; }
        else if (type === 'phospholipid') { order.name = '磷脂'; order.req = { 'glycerol': 1, 'fatty_acid': 2, 'phosphate_group': 1 }; }
        else if (type === 'starch') { order.name = '澱粉片段\n(需8個相連，含分支)'; order.req = { 'glucose': 8 }; }
        else if (type === 'amino_acid') {
            let sc = getSC(); order.name = `單一氨基酸\n(需使用側鏈 ${fmtSC(sc)})`; order.req = { 'carbon': 1, 'amino_group': 1, 'carboxyl_group': 1, [sc]: 1 };
            order.specificKey = sc;
        }
        else if (type === 'dipeptide') {
            let sc1 = getSC(), sc2 = getSC();
            order.name = `雙肽\n序列：${fmtSC(sc1)} - ${fmtSC(sc2)}`;
            order.req = { 'carbon': 2, 'amino_group': 2, 'carboxyl_group': 2, [sc1]: (sc1 === sc2 ? 2 : 1), [sc2]: (sc1 === sc2 ? 2 : 1) };
            order.targetSequence = [sc1, sc2]; scene.requiresMonomerAssembly = true;
            this.createFrame('amino_acid', sc1, `步驟 1: 組裝\n(${fmtSC(sc1)})`, 140, 140, cx, 280); cx += 160;
            this.createFrame('amino_acid', sc2, `步驟 2: 組裝\n(${fmtSC(sc2)})`, 140, 140, cx, 280);
        }
        else if (type === 'polypeptide') {
            let sc1 = getSC(), sc2 = getSC(), sc3 = getSC();
            order.name = `多肽\n序列：${fmtSC(sc1)} - ${fmtSC(sc2)} - ${fmtSC(sc3)}`;
            order.req = { 'carbon': 3, 'amino_group': 3, 'carboxyl_group': 3 };
            order.req[sc1] = (order.req[sc1] || 0) + 1; order.req[sc2] = (order.req[sc2] || 0) + 1; order.req[sc3] = (order.req[sc3] || 0) + 1;
            order.targetSequence = [sc1, sc2, sc3]; scene.requiresMonomerAssembly = true;
            this.createFrame('amino_acid', sc1, `單體 1\n(${fmtSC(sc1)})`, 140, 140, cx, 280); cx += 160;
            this.createFrame('amino_acid', sc2, `單體 2\n(${fmtSC(sc2)})`, 140, 140, cx, 280); cx += 160;
            this.createFrame('amino_acid', sc3, `單體 3\n(${fmtSC(sc3)})`, 140, 140, cx, 280);
        }
        else if (type === 'dna_nucleotide') {
            let b = getDNA(); order.name = `DNA 核苷酸\n(配對鹼基 ${this.fmtBase(b)})`; order.req = { 'deoxyribose': 1, 'phosphate_group_nucleotide': 1, [b]: 1 };
            order.specificKey = b;
        }
        else if (type === 'rna_nucleotide') {
            let b = getRNA(); order.name = `RNA 核苷酸\n(配對鹼基 ${this.fmtBase(b)})`; order.req = { 'ribose': 1, 'phosphate_group_nucleotide': 1, [b]: 1 };
            order.specificKey = b;
        }
        else if (type === 'rna_dinucleotide') {
            let b1 = getRNA(), b2 = getRNA();
            order.name = `RNA 雙核苷酸\n序列：${this.fmtBase(b1)} - ${this.fmtBase(b2)}`;
            order.req = { 'ribose': 2, 'phosphate_group_nucleotide': 2 };
            order.req[b1] = (order.req[b1] || 0) + 1; order.req[b2] = (order.req[b2] || 0) + 1;
            order.targetSequence = [b1, b2]; scene.requiresMonomerAssembly = true;
            this.createFrame('rna_nucleotide', b1, `核苷酸 1\n(${this.fmtBase(b1)})`, 140, 140, cx, 280); cx += 160;
            this.createFrame('rna_nucleotide', b2, `核苷酸 2\n(${this.fmtBase(b2)})`, 140, 140, cx, 280);
        }
        else if (type === 'dna_dinucleotide') {
            let b1 = getDNA(), b2 = getDNA();
            order.name = `DNA 雙核苷酸\n序列：${this.fmtBase(b1)} - ${this.fmtBase(b2)}`;
            order.req = { 'deoxyribose': 2, 'phosphate_group_nucleotide': 2 };
            order.req[b1] = (order.req[b1] || 0) + 1; order.req[b2] = (order.req[b2] || 0) + 1;
            order.targetSequence = [b1, b2]; scene.requiresMonomerAssembly = true;
            this.createFrame('dna_nucleotide', b1, `核苷酸 1\n(${this.fmtBase(b1)})`, 140, 140, cx, 280); cx += 160;
            this.createFrame('dna_nucleotide', b2, `核苷酸 2\n(${this.fmtBase(b2)})`, 140, 140, cx, 280);
        }
        else if (type === 'dna_double_strand') {
            let bL1 = getDNA(), bL2 = getDNA();
            const comp = (b) => { if (b === 'base_a') return 'base_t'; if (b === 'base_t') return 'base_a'; if (b === 'base_c') return 'base_g'; return 'base_c'; };
            let bR1 = comp(bL2), bR2 = comp(bL1);

            order.name = `DNA雙螺旋(2對)\n左: ${this.fmtBase(bL1)}-${this.fmtBase(bL2)} | 右: ${this.fmtBase(bR1)}-${this.fmtBase(bR2)}`;
            order.req = { 'deoxyribose': 4, 'phosphate_group_nucleotide': 4 };
            order.req[bL1] = (order.req[bL1] || 0) + 1; order.req[bL2] = (order.req[bL2] || 0) + 1;
            order.req[bR1] = (order.req[bR1] || 0) + 1; order.req[bR2] = (order.req[bR2] || 0) + 1;

            order.targetSequenceLeft = [bL1, bL2];
            order.targetSequenceRight = [bR1, bR2];

            order.dnaStage = 1;
            scene.requiresMonomerAssembly = true;
            this.createFrame('dna_nucleotide', bL1, `左鏈單體 1\n(${this.fmtBase(bL1)})`, 130, 130, 200, 280);
            this.createFrame('dna_nucleotide', bL2, `左鏈單體 2\n(${this.fmtBase(bL2)})`, 130, 130, 360, 280);

            order.instructionText = scene.add.text(400, 200, '步驟 1: 依照提示框，組合「左鏈」需要的 2 個單體', { fontFamily: '"微軟正黑體", sans-serif', fontSize: '18px', fill: '#34495e', fontStyle: 'bold', align: 'center' }).setOrigin(0.5);
            scene.framesLayer.add(order.instructionText);
        }

        if (['sucrose', 'maltose', 'lactose'].includes(type)) { scene.orderTimeMax = 20000; }
        else if (['triglyceride', 'phospholipid'].includes(type)) { scene.orderTimeMax = 30000; }
        else if (['dna_double_strand', 'polypeptide'].includes(type)) { scene.orderTimeMax = 60000; }
        else { scene.orderTimeMax = 40000; }

        scene.orderTimeLeft = scene.orderTimeMax;
        scene.isTimerActive = true;

        scene.currentOrder = order;
        scene.orderText.setText(scene.currentOrder.name);
        scene.tweens.add({ targets: scene.orderText, scaleX: 1.1, scaleY: 1.1, yoyo: true, duration: 200 });
    }

    evaluateOrder(moleculeGroup) {
        const scene = this.scene;
        if (!scene.currentOrder || !moleculeGroup) return;

        let items = moleculeGroup.filter(i => i.type === 'Container');
        let counts = {};
        items.forEach(item => { counts[item.textureKey] = (counts[item.textureKey] || 0) + 1; });

        let isCorrect = false; let o = scene.currentOrder.id; let req = scene.currentOrder.req;
        let msg = "❌ 材料錯誤！請檢查是否有多拿或少拿材料。";

        let countMatch = true;
        for (let key in req) { if (counts[key] !== req[key]) countMatch = false; }
        for (let key in counts) { if (!req[key] || counts[key] !== req[key]) countMatch = false; }

        if (countMatch) {
            try {
                if (o === 'sucrose') {
                    let glu = items.find(i => i.textureKey === 'glucose');
                    let fru = items.find(i => i.textureKey === 'fructose');
                    if (glu && fru && glu.connectedItems.some(c => c.item === fru)) isCorrect = true;
                    else msg = "❌ 葡萄糖與果糖沒有連接起來！";
                }
                else if (o === 'maltose') {
                    let glus = items.filter(i => i.textureKey === 'glucose');
                    if (glus.length === 2 && glus[0].connectedItems.some(c => c.item === glus[1])) isCorrect = true;
                    else msg = "❌ 兩個葡萄糖沒有連接起來！";
                }
                else if (o === 'lactose') {
                    let glu = items.find(i => i.textureKey === 'glucose');
                    let gal = items.find(i => i.textureKey === 'galactose');
                    if (glu && gal && glu.connectedItems.some(c => c.item === gal)) isCorrect = true;
                    else msg = "❌ 葡萄糖與半乳糖沒有連接起來！";
                }
                else if (o === 'starch') {
                    let hasBranch = items.some(item => item.connectedItems && item.connectedItems.length >= 3);
                    if (hasBranch) isCorrect = true; else msg = "❌ 澱粉/糖原必須有「分支」！(某個葡萄糖必須接3個鄰居)";
                }
                else if (o === 'triglyceride') {
                    let glycerol = items.find(i => i.textureKey === 'glycerol');
                    let rightConnections = glycerol.connectedItems.filter(c => c.myMag.x > 0);
                    if (rightConnections.length === 3 && rightConnections.every(c => c.item.textureKey === 'fatty_acid')) isCorrect = true;
                    else msg = "❌ 3 個脂肪酸必須全部接在甘油的「右側(OH基)」上！";
                }
                else if (o === 'phospholipid') {
                    let glycerol = items.find(i => i.textureKey === 'glycerol');
                    let rightConnections = glycerol.connectedItems.filter(c => c.myMag.x > 0);
                    // 👉 座標寬容度調整
                    let leftBotConnections = glycerol.connectedItems.filter(c => c.myMag.x < 0 && c.myMag.y > 10);
                    if (rightConnections.length === 2 && leftBotConnections.length === 1 && leftBotConnections[0].item.textureKey === 'phosphate_group') isCorrect = true;
                    else msg = "❌ 磷脂需要：2個脂肪酸接在右側，1個磷酸鹽接在「左下側」！";
                }
                else if (o === 'amino_acid') {
                    if (MoleculeLogic.checkMonomer(items, 'amino_acid', scene.currentOrder.specificKey) === 1) isCorrect = true;
                    else msg = "❌ 氨基酸結構錯誤！(需中心碳連接氨基、羧基與側鏈)";
                }
                else if (o === 'dipeptide' || o === 'polypeptide') {
                    let carbons = items.filter(i => i.textureKey === 'carbon');
                    let headCarbons = [];

                    carbons.forEach(c => {
                        let amino = c.connectedItems.find(conn => conn.item.textureKey === 'amino_group')?.item;
                        if (amino) {
                            let isConnectedToCarboxyl = amino.connectedItems.some(conn => conn.item.textureKey === 'carboxyl_group');
                            if (!isConnectedToCarboxyl) {
                                headCarbons.push(c);
                            }
                        }
                    });

                    if (headCarbons.length !== 1) {
                        msg = "❌ 氨基酸沒有正確連接成一條連續的肽鏈！(是否忘記脫水結合了？)";
                    } else {
                        let currentCarbon = headCarbons[0];
                        let actualSeq = [];
                        let validChain = true;

                        while (currentCarbon) {
                            let sc = currentCarbon.connectedItems.find(conn => conn.item.textureKey.startsWith('side_chain'));
                            actualSeq.push(sc ? sc.item.textureKey : '無');

                            let carboxyl = currentCarbon.connectedItems.find(conn => conn.item.textureKey === 'carboxyl_group')?.item;
                            let nextAmino = carboxyl ? carboxyl.connectedItems.find(conn => conn.item.textureKey === 'amino_group')?.item : null;

                            if (nextAmino) {
                                currentCarbon = nextAmino.connectedItems.find(conn => conn.item.textureKey === 'carbon')?.item;
                                if (!currentCarbon) {
                                    validChain = false; break;
                                }
                            } else {
                                currentCarbon = null;
                            }
                        }

                        let targetSeq = scene.currentOrder.targetSequence;
                        if (validChain && actualSeq.length === targetSeq.length && actualSeq.join(',') === targetSeq.join(',')) {
                            isCorrect = true;
                        } else {
                            let fmt = k => k.replace('side_chain_', '#');
                            msg = `❌ 肽鏈連接錯誤或側鏈順序不對！\n訂單要：${targetSeq.map(fmt).join(' - ')}\n你做的是：${actualSeq.map(fmt).join(' - ')}`;
                        }
                    }
                }
                else if (o === 'dna_nucleotide' || o === 'rna_nucleotide') {
                    let typeStr = o === 'dna_nucleotide' ? 'dna_nucleotide' : 'rna_nucleotide';
                    if (MoleculeLogic.checkMonomer(items, typeStr, scene.currentOrder.specificKey) === 1) isCorrect = true;
                    else msg = `❌ ${o === 'dna_nucleotide' ? 'DNA' : 'RNA'} 核苷酸結構錯誤！(需核糖正確連接磷酸與鹼基)`;
                }
                else if (o === 'dna_dinucleotide' || o === 'rna_dinucleotide') {
                    let sugarKey = o === 'dna_dinucleotide' ? 'deoxyribose' : 'ribose';
                    let sugars = items.filter(i => i.textureKey === sugarKey);
                    let polymerBonds = 0; let validPolymerBonds = 0;
                    let headSugar = null; let tailSugar = null;

                    sugars.forEach(s => {
                        // 👉 座標寬容度調整
                        let botLeftPhos = s.connectedItems.find(c => c.item.textureKey === 'phosphate_group_nucleotide' && c.myMag.x < 10 && c.myMag.y > 5);
                        if (botLeftPhos) {
                            polymerBonds++;
                            if (botLeftPhos.targetMag.y < -5) validPolymerBonds++;
                            headSugar = s;
                        } else { tailSugar = s; }
                    });

                    if (polymerBonds !== 1 || validPolymerBonds !== 1) {
                        msg = "❌ 骨架連接位置錯誤！\n上方五碳糖的「左下角 (3'端)」\n必須連接下方磷酸的「最上方 (5'端)」！";
                    } else {
                        let base1 = headSugar.connectedItems.find(c => c.item.textureKey.startsWith('base_') && c.myMag.x > 0 && c.myMag.y < 0);
                        let base2 = tailSugar.connectedItems.find(c => c.item.textureKey.startsWith('base_') && c.myMag.x > 0 && c.myMag.y < 0);
                        if (base1 && base2) {
                            let actualSeq = [base1.item.textureKey, base2.item.textureKey];
                            let targetSeq = scene.currentOrder.targetSequence;
                            if (actualSeq.join(',') === targetSeq.join(',')) isCorrect = true;
                            else {
                                msg = `❌ 鹼基順序錯誤！\n訂單要：${targetSeq.map(this.fmtBase).join(' - ')}\n你做的是：${actualSeq.map(this.fmtBase).join(' - ')}`;
                            }
                        } else { msg = "❌ 鹼基沒有正確連接在五碳糖右上角！"; }
                    }
                }
                else if (o === 'dna_double_strand') {
                    if (scene.currentOrder.dnaStage < 5) {
                        msg = "❌ 請依照畫面上方的指示，一步一步完成雙鏈的組裝再出餐！";
                        isCorrect = false;
                    } else {
                        let sugars = items.filter(i => i.textureKey === 'deoxyribose');
                        let leftChains = sugars.filter(s => s.img.angle % 360 === 0);
                        let rightChains = sugars.filter(s => s.img.angle % 360 !== 0);

                        if (leftChains.length !== 2 || rightChains.length !== 2) {
                            msg = "❌ 必須將右側的 2 個核苷酸「雙擊反轉 180 度」才能結合！";
                        } else {
                            leftChains.sort((a, b) => a.y - b.y);
                            rightChains.sort((a, b) => a.y - b.y);

                            let lTop = leftChains[0], lBot = leftChains[1];
                            let rTop = rightChains[0], rBot = rightChains[1];

                            let getBase = (sugar) => sugar.connectedItems.find(c => c.item.textureKey.startsWith('base_'))?.item;
                            let bL1 = getBase(lTop), bL2 = getBase(lBot);
                            let bR_Top = getBase(rTop), bR_Bot = getBase(rBot);

                            if (!bL1 || !bL2 || !bR_Top || !bR_Bot) {
                                msg = "❌ 鹼基沒有正確裝在五碳糖上！";
                            } else {
                                let isPair1Linked = bL1.connectedItems.some(c => c.item === bR_Top);
                                let isPair2Linked = bL2.connectedItems.some(c => c.item === bR_Bot);

                                if (!isPair1Linked || !isPair2Linked) {
                                    msg = "❌ 左右鹼基沒有互相連結配對！(氫鍵未形成)";
                                } else {
                                    let targetLeft = scene.currentOrder.targetSequenceLeft;
                                    let targetRight = scene.currentOrder.targetSequenceRight;

                                    if (bL1.textureKey === targetLeft[0] && bL2.textureKey === targetLeft[1] &&
                                        bR_Bot.textureKey === targetRight[0] && bR_Top.textureKey === targetRight[1]) {
                                        isCorrect = true;
                                    } else {
                                        msg = `❌ 鹼基對錯誤！\n訂單要求：左 ${this.fmtBase(targetLeft[0])}-${this.fmtBase(targetLeft[1])}, 右 ${this.fmtBase(targetRight[0])}-${this.fmtBase(targetRight[1])}`;
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (e) {
                console.error(e);
                msg = "❌ 判斷出錯，請確認每個分子都正確連上了！";
            }
        }

        if (isCorrect) {
            scene.isTimerActive = false;

            let baseScore = 10;
            let timeBonus = 0;

            if (['sucrose', 'maltose', 'lactose'].includes(o)) { baseScore = 10; timeBonus = 0; }
            else if (['triglyceride', 'phospholipid'].includes(o)) { baseScore = 20; timeBonus = 0; }
            else if (o === 'starch') { baseScore = 40; timeBonus = 0; }
            else if (o === 'amino_acid') { baseScore = 40; timeBonus = 0; }
            else if (o === 'dipeptide') { baseScore = 60; timeBonus = 5000; }
            else if (o === 'polypeptide') { baseScore = 100; timeBonus = 8000; }
            else if (['dna_nucleotide', 'rna_nucleotide'].includes(o)) { baseScore = 80; timeBonus = 0; }
            else if (['dna_dinucleotide', 'rna_dinucleotide'].includes(o)) { baseScore = 150; timeBonus = 8000; }
            else if (o === 'dna_double_strand') { baseScore = 300; timeBonus = 15000; }

            scene.currentCombo += 1;
            if (scene.currentCombo > scene.maxCombo) scene.maxCombo = scene.currentCombo;
            let multiplier = 1.0;
            if (scene.currentCombo >= 5) multiplier = 2.0;
            else if (scene.currentCombo >= 3) multiplier = 1.5;
            else if (scene.currentCombo >= 2) multiplier = 1.2;

            if (scene.isFeverMode) multiplier *= 2.0;

            let finalEarned = Math.floor(baseScore * multiplier);
            scene.score += finalEarned;
            scene.scoreText.setText(`💰 營業額: $${scene.score}`);
            scene.updateComboUI();

            let comboStr = multiplier > 1.0 ? ` (x${multiplier} Combo!)` : '';
            scene.showFeedbackText(scene.submitZone.x, scene.submitZone.y, `✨ 出餐成功！ +${finalEarned}${comboStr}`, '#27ae60');

            if (timeBonus > 0) {
                scene.gameTimeLeft += timeBonus;
                if (scene.gameTimeLeft > scene.gameTimeMax) scene.gameTimeLeft = scene.gameTimeMax;

                let bonusSec = timeBonus / 1000;
                let timePopup = scene.add.text(400, 80, `⏰ +${bonusSec}秒`, {
                    fontFamily: '"微軟正黑體", sans-serif', fontSize: '28px', fill: '#2ecc71',
                    fontStyle: 'bold', stroke: '#ffffff', strokeThickness: 4
                }).setOrigin(0.5).setDepth(200);

                scene.tweens.add({
                    targets: timePopup, y: 30, alpha: 0, duration: 1500, ease: 'Cubic.easeOut',
                    onComplete: () => timePopup.destroy()
                });
            }

            scene.particles.playSuccess(scene.submitZone.x, scene.submitZone.y);

            let nextLevelDef = scene.levelDefs.find(l => l.level === scene.currentLevel + 1);
            if (nextLevelDef && scene.score >= nextLevelDef.req) {
                scene.currentLevel++;
                scene.unlockedOrders.push(...nextLevelDef.orders);
                let lvlText = scene.add.text(400, 300, `🎉 升級到 LV.${scene.currentLevel}！\n解鎖新食材與配方！`, { fontFamily: '"微軟正黑體", sans-serif', fontSize: '36px', fill: '#f1c40f', fontStyle: 'bold', align: 'center', stroke: '#d35400', strokeThickness: 6 }).setOrigin(0.5).setDepth(200);
                scene.tweens.add({ targets: lvlText, y: 150, alpha: 0, scale: 1.5, duration: 4000, ease: 'Power2', onComplete: () => lvlText.destroy() });
                scene.time.delayedCall(500, () => scene.addNewMenuItems(nextLevelDef.items));
            }

            moleculeGroup.forEach(item => {
                if (item.type === 'Container') scene.workspaceItems = scene.workspaceItems.filter(i => i !== item);
                item.destroy();
            });

            scene.time.delayedCall(1000, () => {
                this.generateNewOrder();
            });

        } else {
            scene.showFeedbackText(scene.submitZone.x, scene.submitZone.y, msg, '#e74c3c');
            scene.particles.playFail(scene.submitZone.x, scene.submitZone.y);
            scene.cameras.main.shake(200, 0.015);
            scene.currentCombo = 0;
            scene.updateComboUI();

            moleculeGroup.forEach(item => {
                scene.tweens.add({ targets: item, x: item.x - 150, duration: 300, ease: 'Back.easeOut' });
            });

                        if (scene.requiresMonomerAssembly || (scene.currentOrder && scene.currentOrder.id === 'dna_double_strand')) {
                
                if (scene.currentOrder.id === 'dna_double_strand') {
                    // 🌟 判斷出錯在哪個階段，精準決定退回哪一步！
                    if (scene.currentOrder.dnaStage === 2) {
                        scene.currentOrder.dnaStage = 1; // 錯在左鏈，退回檢查左1左2
                    } else if (scene.currentOrder.dnaStage === 4) {
                        scene.currentOrder.dnaStage = 3; // 錯在右鏈，退回檢查右1右2
                    } else if (scene.currentOrder.dnaStage === 5) {
                        scene.currentOrder.dnaStage = 1; // 雙鏈結合失敗 (兩條都毀了)，只能退回原點
                    }

                    scene.requiresMonomerAssembly = true;
                    scene.framesLayer.removeAll(true);
                    scene.activeFrames = [];

                    // 🌟 根據退回的階段，重新生成對應的檢查框
                    if (scene.currentOrder.dnaStage === 1) {
                        let bL1 = scene.currentOrder.targetSequenceLeft[0];
                        let bL2 = scene.currentOrder.targetSequenceLeft[1];
                        // 依照您的專案寫法，可能是 scene.createFrame 或是 this.scene.createFrame
                        // 這裡統一使用 scene.createFrame 來呼叫
                        scene.createFrame('dna_nucleotide', bL1, `左鏈單體 1\n(${scene.fmtBase(bL1)})`, 130, 130, 200, 280);
                        scene.createFrame('dna_nucleotide', bL2, `左鏈單體 2\n(${scene.fmtBase(bL2)})`, 130, 360, 200, 280);
                        scene.currentOrder.instructionText = scene.add.text(400, 200, '步驟 1: 依照提示框，組合「左鏈」需要的 2 個單體', { fontFamily: '"微軟正黑體", sans-serif', fontSize: '18px', fill: '#34495e', fontStyle: 'bold', align: 'center' }).setOrigin(0.5);
                        scene.framesLayer.add(scene.currentOrder.instructionText);
                    } else if (scene.currentOrder.dnaStage === 3) {
                        let bR1 = scene.currentOrder.targetSequenceRight[0];
                        let bR2 = scene.currentOrder.targetSequenceRight[1];
                        scene.createFrame('dna_nucleotide', bR1, `右鏈單體 1\n(${scene.fmtBase(bR1)})`, 130, 130, 200, 280);
                        scene.createFrame('dna_nucleotide', bR2, `右鏈單體 2\n(${scene.fmtBase(bR2)})`, 130, 360, 200, 280);
                        scene.currentOrder.instructionText = scene.add.text(400, 200, '步驟 3: 依照提示框，組合「右鏈」需要的 2 個單體\n(注意方向必須與左鏈相反)', { fontFamily: '"微軟正黑體", sans-serif', fontSize: '18px', fill: '#34495e', fontStyle: 'bold', align: 'center' }).setOrigin(0.5);
                        scene.framesLayer.add(scene.currentOrder.instructionText);
                    }
                } else {
                    // 一般多肽/單體出錯時的重置
                    scene.activeFrames.forEach(frame => {
                        frame.isMet = false;
                        frame.satisfiedBy = null; // 🌟 記得清除記錄
                        frame.rect.setStrokeStyle(2, 0x95a5a6);
                        frame.status.setText('未完成').setColor('#e74c3c');
                    });
                }

                scene.workspaceItems.forEach(i => {
                    if (i.type === 'Container') {
                        i.isValidatedMonomer = false;
                        i.isLockedChain = false; // 解除可能被錯誤鎖定的鏈
                        if (!i.isOriginal && i.list && i.list[0]) i.list[0].clearTint();
                    }
                });
            }


        }
    }
}
