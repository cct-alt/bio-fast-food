import Phaser from 'phaser';

export const MoleculeLogic = {
    isValidConnection(itemA, magA, itemB, magB) {
        let keyA = itemA.textureKey;
        let keyB = itemB.textureKey;

        if ((keyA.includes('ribose') && keyB === 'phosphate_group_nucleotide') ||
            (keyB.includes('ribose') && keyA === 'phosphate_group_nucleotide')) {
            let sugarMag = keyA.includes('ribose') ? magA : magB;
            let phosMag = keyB === 'phosphate_group_nucleotide' ? magB : magA;
            let isInternal = (sugarMag.x < -10 && sugarMag.y < 5) && (phosMag.y > 15);
            let isChain = (sugarMag.x < 5 && sugarMag.y > 10) && (phosMag.y < -15);
            if (!isInternal && !isChain) return false;
        }

        let isPeptideA = keyA === 'carboxyl_group' && keyB === 'amino_group';
        let isPeptideB = keyB === 'carboxyl_group' && keyA === 'amino_group';
        if (isPeptideA || isPeptideB) {
            let carboxylMag = isPeptideA ? magA : magB;
            let aminoMag = isPeptideA ? magB : magA;
            if (carboxylMag.x <= 0 || aminoMag.x >= 0) return false;
        }

        if (keyA === 'carboxyl_group' && keyB === 'carboxyl_group') return false;
        if (keyA === 'amino_group' && keyB === 'amino_group') return false;
        if (keyA === 'carbon' && keyB === 'carbon') return false;

        let isBaseA = keyA.startsWith('base_');
        let isBaseB = keyB.startsWith('base_');
        if (isBaseA && isBaseB) {
            if (itemA.img.angle % 360 === itemB.img.angle % 360) return false;
        }
        return true;
    },

    checkMonomer(group, type, specificKey) {
        let items = group.filter(i => i.type === 'Container');
        let counts = {};
        items.forEach(i => { counts[i.textureKey] = (counts[i.textureKey] || 0) + 1; });

        try {
            if (type === 'amino_acid') {
                if (counts['carbon'] === 1 && counts['amino_group'] === 1 && counts['carboxyl_group'] === 1 && counts[specificKey] === 1 && items.length === 4) {
                    let carbon = items.find(i => i.textureKey === 'carbon');
                    let hasLeft = carbon.connectedItems.some(c => c.item.textureKey === 'amino_group' && c.myMag.x < -15);
                    let hasRight = carbon.connectedItems.some(c => c.item.textureKey === 'carboxyl_group' && c.myMag.x > 15);
                    let hasSide = carbon.connectedItems.some(c => c.item.textureKey === specificKey && Math.abs(c.myMag.y) > 15);
                    if (hasLeft && hasRight && hasSide) return 1;
                    return -1;
                }
            } else if (type === 'dna_nucleotide' || type === 'rna_nucleotide') {
                let sugarKey = type === 'dna_nucleotide' ? 'deoxyribose' : 'ribose';
                if (counts[sugarKey] === 1 && counts['phosphate_group_nucleotide'] === 1 && counts[specificKey] === 1 && items.length === 3) {
                    let sugar = items.find(i => i.textureKey === sugarKey);
                    let hasTopLeft = sugar.connectedItems.some(c => c.item.textureKey === 'phosphate_group_nucleotide' && c.myMag.x < -10 && c.myMag.y < 5 && c.targetMag.y > 15);
                    let hasTopRight = sugar.connectedItems.some(c => c.item.textureKey === specificKey && c.myMag.x > 0 && c.myMag.y < 0);
                    if (hasTopLeft && hasTopRight) return 1;
                    return -1;
                }
            }
        } catch (e) { }
        return 0;
    },

    flipGroup(scene, group) {
        if (group.isFlipping) return;
        group.isFlipping = true;

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        let containers = group.filter(g => g.type === 'Container');
        containers.forEach(c => {
            minX = Math.min(minX, c.x); maxX = Math.max(maxX, c.x);
            minY = Math.min(minY, c.y); maxY = Math.max(maxY, c.y);
        });
        let cx = (minX + maxX) / 2; let cy = (minY + maxY) / 2;

        let startStates = [];
        containers.forEach(c => {
            startStates.push({ item: c, startX: c.x, startY: c.y, startAngle: c.img.angle });
        });

        group.forEach(item => {
            if (item.type === 'Graphics') {
                item.x = 0; item.y = 0;
                if (item.isBond) {
                    item.startAx = item.itemA.x + item.magA.x; item.startAy = item.itemA.y + item.magA.y;
                    item.startBx = item.itemB.x + item.magB.x; item.startBy = item.itemB.y + item.magB.y;
                } else if (item.isRedSlash) {
                    let cAngle = item.carboxyl.img.angle % 360 !== 0 ? -1 : 1;
                    let aAngle = item.amino.img.angle % 360 !== 0 ? -1 : 1;
                    item.startKx = item.carboxyl.x + (item.cOffset.x * cAngle); item.startKy = item.carboxyl.y + (item.cOffset.y * cAngle);
                    item.startKx2 = item.amino.x + (item.aOffset.x * aAngle); item.startKy2 = item.amino.y + (item.aOffset.y * aAngle);
                }
            }
        });

        let hint = scene.add.text(cx, cy - 50, '🔄 反轉中...', { fontFamily: '"微軟正黑體", sans-serif', fontSize: '16px', fill: '#ffffff', fontStyle: 'bold', backgroundColor: '#3498db', padding: { x: 8, y: 4 }, borderRadius: 4 }).setOrigin(0.5).setDepth(150);
        scene.tweens.add({ targets: hint, y: cy - 80, alpha: 0, duration: 800, onComplete: () => hint.destroy() });

        scene.tweens.addCounter({
            from: 0, to: 180, duration: 400, ease: 'Cubic.easeInOut',
            onUpdate: (tween) => {
                let angle = tween.getValue();
                let rad = Phaser.Math.DegToRad(angle);
                let cos = Math.cos(rad); let sin = Math.sin(rad);

                let getOrbitedPoint = (sx, sy) => {
                    let dx = sx - cx; let dy = sy - cy;
                    return { x: cx + (dx * cos - dy * sin), y: cy + (dx * sin + dy * cos) };
                };

                startStates.forEach(state => {
                    let p = getOrbitedPoint(state.startX, state.startY);
                    state.item.x = p.x; state.item.y = p.y;
                    state.item.img.angle = state.startAngle + angle;
                });

                group.forEach(item => {
                    if (item.type === 'Graphics' && item.isBond) {
                        let pA = getOrbitedPoint(item.startAx, item.startAy);
                        let pB = getOrbitedPoint(item.startBx, item.startBy);
                        item.clear();
                        // 【修改】動畫中依然保留氫鍵的顏色標記
                        if (item.isHBond) item.lineStyle(4, 0x3498db, 0.8);
                        else item.lineStyle(5, 0x333333, 1);
                        item.lineBetween(pA.x, pA.y, pB.x, pB.y);
                    } else if (item.type === 'Graphics' && item.isRedSlash) {
                        let pK = getOrbitedPoint(item.startKx, item.startKy);
                        let pK2 = getOrbitedPoint(item.startKx2, item.startKy2);
                        item.clear(); item.lineStyle(4, 0xff4757, 1);
                        item.lineBetween(pK.x - 8, pK.y + 8, pK.x + 8, pK.y - 8);
                        item.lineBetween(pK2.x - 8, pK2.y + 8, pK2.x + 8, pK2.y - 8);
                    }
                });
            },
            onComplete: () => {
                startStates.forEach(state => {
                    let dx = state.startX - cx; let dy = state.startY - cy;
                    state.item.x = cx - dx; state.item.y = cy - dy;
                    state.item.img.x = -state.item.img.x; state.item.img.y = -state.item.img.y;
                    state.item.img.angle = state.startAngle + 180;

                    state.item.magnets.forEach(m => {
                        m.x = -m.x; m.y = -m.y;
                        m.visual.setPosition(m.x, m.y);
                    });
                });

                group.forEach(item => {
                    if (item.type === 'Graphics') {
                        item.x = 0; item.y = 0;
                        if (item.isBond) {
                            item.clear();
                            // 【修改】動畫結束後保留氫鍵的顏色標記
                            if (item.isHBond) item.lineStyle(4, 0x3498db, 0.8);
                            else item.lineStyle(5, 0x333333, 1);
                            let ax = item.itemA.x + item.magA.x; let ay = item.itemA.y + item.magA.y;
                            let bx = item.itemB.x + item.magB.x; let by = item.itemB.y + item.magB.y;
                            item.lineBetween(ax, ay, bx, by);
                        } else if (item.isRedSlash) {
                            item.clear(); item.lineStyle(4, 0xff4757, 1);
                            let cAngle = item.carboxyl.img.angle % 360 !== 0 ? -1 : 1;
                            let aAngle = item.amino.img.angle % 360 !== 0 ? -1 : 1;
                            let kx = item.carboxyl.x + (item.cOffset.x * cAngle); let ky = item.carboxyl.y + (item.cOffset.y * cAngle);
                            let kx2 = item.amino.x + (item.aOffset.x * aAngle); let ky2 = item.amino.y + (item.aOffset.y * aAngle);
                            item.lineBetween(kx - 8, ky + 8, kx + 8, ky - 8);
                            item.lineBetween(kx2 - 8, ky2 + 8, kx2 + 8, ky2 - 8);
                        }
                    }
                });
                group.isFlipping = false;
            }
        });
    }

};
