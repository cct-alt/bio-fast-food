// src/data.js

export const menuItems = [
    { key: 'glucose', name: '葡萄糖', scale: 0.15, imageOffset: { x: 1, y: 0 }, magnets: [{ x: -15, y: -21 }, { x: 11, y: -21 }, { x: 25, y: -1 }, { x: 13, y: 22 }, { x: -14, y: 22 }, { x: -27, y: 1 }] },
    { key: 'fructose', name: '果糖', scale: 0.15, imageOffset: { x: 1, y: 0 }, magnets: [{ x: -13, y: -24 }, { x: 12, y: -23 }, { x: 25, y: 0 }, { x: 13, y: 21 }, { x: -14, y: 22 }, { x: -27, y: 0 }] },
    { key: 'galactose', name: '半乳糖', scale: 0.15, imageOffset: { x: 2, y: 0 }, magnets: [{ x: -13, y: -23 }, { x: 12, y: -22 }, { x: 24, y: -1 }, { x: 13, y: 21 }, { x: -13, y: 21 }, { x: -25, y: 0 }] },
    { key: 'glycerol', name: '甘油', scale: 0.3, imageOffset: { x: 0, y: 0 }, magnets: [{ x: 13, y: -67 }, { x: 13, y: -3 }, { x: 13, y: 70 }, { x: -17, y: -68 }, { x: -17, y: -2 }, { x: -17, y: 70 }] },
    { key: 'fatty_acid', name: '脂肪酸', scale: 0.15, imageOffset: { x: 3, y: -1 }, magnets: [{ x: -44, y: 0 }, { x: 0, y: -18 }, { x: 0, y: 16 }, { x: 44, y: 0 }] },
    { key: 'phosphate_group', name: '磷酸鹽', scale: 0.15, imageOffset: { x: 1, y: 0 }, magnets: [{ x: -2, y: -32 }, { x: -34, y: -2 }, { x: -2, y: 28 }, { x: 30, y: -1 }] },
    { key: 'carbon', name: '碳原子', scale: 0.15, imageOffset: { x: 0, y: 0 }, magnets: [{ x: -1, y: -32 }, { x: -33, y: 0 }, { x: 31, y: -1 }, { x: -1, y: 29 }] },
    { key: 'amino_group', name: '氨基', scale: 0.15, strikeOffset: { x: 22, y: 4 }, imageOffset: { x: 1, y: 0 }, magnets: [{ x: -41, y: 0 }, { x: -2, y: -26 }, { x: 38, y: -1 }, { x: -1, y: 23 }] },
    { key: 'carboxyl_group', name: '羧基', scale: 0.15, strikeOffset: { x: 15, y: 0 }, imageOffset: { x: 1, y: 1 }, magnets: [{ x: -2, y: -28 }, { x: 39, y: 0 }, { x: 0, y: 26 }, { x: -41, y: 0 }] },
    { key: 'side_chain_01', name: '側鏈(R)', scale: 0.15, isSideChain: true, imageOffset: { x: 0, y: 0 }, magnets: [{ x: -1, y: -30 }, { x: 28, y: 0 }, { x: -1, y: 28 }, { x: -31, y: 0 }] },
    { key: 'ribose', name: '核糖', scale: 0.15, imageOffset: { x: 0, y: 1 }, magnets: [{ x: -1, y: -23 }, { x: 23, y: -5 }, { x: 13, y: 21 }, { x: -16, y: 21 }, { x: -23, y: -3 }] },
    { key: 'deoxyribose', name: '脫氧核糖', scale: 0.15, imageOffset: { x: 1, y: 1 }, magnets: [{ x: 0, y: -22 }, { x: 22, y: -5 }, { x: 14, y: 20 }, { x: -15, y: 22 }, { x: -24, y: -6 }] },
    { key: 'phosphate_group_nucleotide', name: '磷酸鹽基', scale: 0.15, imageOffset: { x: 1, y: 0 }, magnets: [{ x: -2, y: -33 }, { x: 30, y: -2 }, { x: -2, y: 28 }, { x: -33, y: -1 }] },
    { key: 'base_a', name: '含氮鹼基 A', scale: 0.15, imageOffset: { x: 4, y: 0 }, magnets: [{ x: -1, y: -28 }, { x: -36, y: -1 }, { x: 0, y: 28 }, { x: 40, y: -1 }] },
    { key: 'base_t', name: '含氮鹼基 T', scale: 0.15, imageOffset: { x: 4, y: 0 }, magnets: [{ x: -35, y: -1 }, { x: -1, y: 30 }, { x: -1, y: -30 }, { x: 25, y: -1 }] },
    { key: 'base_c', name: '含氮鹼基 C', scale: 0.23, imageOffset: { x: 3, y: -1 }, magnets: [{ x: -36, y: -1 }, { x: -1, y: -30 }, { x: 0, y: 29 }, { x: 21, y: 2 }] },
    { key: 'base_g', name: '含氮鹼基 G', scale: 0.15, imageOffset: { x: 6, y: -1 }, magnets: [{ x: -36, y: -1 }, { x: -1, y: -29 }, { x: -1, y: 26 }, { x: 44, y: 0 }] },
    { key: 'base_u', name: '含氮鹼基 U', scale: 0.15, imageOffset: { x: 5, y: -1 }, magnets: [{ x: -1, y: -29 }, { x: -34, y: -3 }, { x: -1, y: 26 }, { x: 26, y: -1 }] }
];

export const orderDatabase = [
    { id: 'maltose', name: '麥芽糖' },
    { id: 'sucrose', name: '蔗糖' },
    { id: 'lactose', name: '乳糖' },
    { id: 'starch', name: '澱粉 / 糖原\n(支鏈)' },
    { id: 'triglyceride', name: '甘油三酯\n(脂肪)' },
    { id: 'phospholipid', name: '磷脂' },
    { id: 'amino_acid', name: '完整氨基酸' },
    { id: 'dipeptide', name: '雙肽\n(兩個氨基酸)' },
    { id: 'polypeptide', name: '多肽\n(三個氨基酸)' }, // 已更名為多肽
    { id: 'dna_nucleotide', name: 'DNA 核苷酸' },
    { id: 'rna_nucleotide', name: 'RNA 核苷酸' },
    { id: 'dna_dinucleotide', name: 'DNA 雙核苷酸' }
];
