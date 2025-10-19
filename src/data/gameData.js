// This file contains all the master data for the game, such as weapon stats, size charts, etc.
// This is the single source of truth for all game rules and stats.

const ACTION_LIST = [
    // Fallback/Empty Action
    { name: '---', category: 'その他', sr: 0, needsWeapon: false, condition: '-', description: '行動なし' },

    // 攻撃
    { name: '射撃', category: '攻撃', sr: '武器SR', needsWeapon: true, condition: '射撃武器を構えている', description: '単一の目標に対して射撃攻撃を行います。' },
    { name: '両手射撃', category: '攻撃', sr: '武器SR-1', needsWeapon: true, condition: '事前に「両手持ち」を行っている', description: '両手射撃攻撃を行う、ただし射界は胴体射界となる。' },
    { name: '同時攻撃', category: '攻撃', sr: '1 + ⌈(武器SR合計) / 2⌉', needsWeapon: true, condition: '複数武装で同一目標を攻撃', description: '複数の武器で単一の目標を同時に攻撃します。命中判定は1回のみ。' },
    { name: '一斉射撃', category: '攻撃', sr: '目標数 + ⌈(武器SR合計) / 2⌉', needsWeapon: true, condition: '複数武装で複数目標を攻撃', description: '複数の武器で、それぞれ異なる目標を同時に攻撃します。命中判定は目標ごとに行う。' },
    { name: '支援攻撃', category: '攻撃', sr: '武器SR', needsWeapon: true, condition: '特殊効果「支援攻撃」を持つ武器', description: 'ヘックスに対して攻撃して、そのヘックスにデバフ効果を与える。' },
    { name: '斬る', category: '攻撃', sr: '武器SR', needsWeapon: true, condition: '「斬る」が可能な格闘武器', description: '斬撃属性の格闘攻撃を行います。（特殊効果「ノックバック」）' },
    { name: '突く', category: '攻撃', sr: '武器SR', needsWeapon: true, condition: '「突く」が可能な格闘武器', description: '刺突属性の格闘攻撃を行います。（特殊効果「貫通」）' },
    { name: '殴る', category: '攻撃', sr: '武器SR', needsWeapon: true, condition: '「殴る」が可能な格闘武器', description: '打撃属性の格闘攻撃を行います。（特殊効果「ノックバック」）' },
    { name: '回転攻撃', category: '攻撃', sr: '武器SR+1', needsWeapon: true, condition: '特殊効果「回転攻撃」を持つ武器', description: 'ユニットの周囲の範囲を攻撃できる。' },

    // 防御
    { name: '回避', category: '防御', sr: 1, needsWeapon: false, condition: '攻撃を受けた時', description: '相手の攻撃を回避する、回避するたびに次の回避が1/2になる。' },
    { name: '受け', category: '防御', sr: 1, needsWeapon: false, condition: '格闘攻撃を受けた時', description: 'シールド、格闘武器で相手の格闘攻撃を受ける。' },
    { name: '迎撃', category: '防御', sr: '武器SR', needsWeapon: true, condition: '迎撃可能武器のみ可能', description: '成功段階LV分のファンネル・ミサイルを破壊できる。' },
    { name: '防御', category: '防御', sr: 1, needsWeapon: false, condition: '-', description: '防御中は全部位のAPが1.5倍（切り上げ）になる。' },
    
    // 移動
    { name: '立体機動', category: '移動', sr: 1, needsWeapon: false, condition: '-', description: '相手の命中に-30%、消費エネルギーは3倍消費。' },
    { name: '全力移動', category: '移動', sr: 1, needsWeapon: false, condition: '-', description: '1SRごとの移動力を1.5倍（切り上げ）、消費エネルギーは3倍。' },
    { name: '通常移動', category: '移動', sr: 1, needsWeapon: false, condition: '-', description: '機体の移動力分移動する。' },
    { name: '変形（完全）', category: '移動', sr: 1, needsWeapon: false, condition: 'キットで完全変形が可能', description: '形態を変更します。' },
    { name: '変形（差替）', category: '移動', sr: 2, needsWeapon: false, condition: 'キットで差し替えによる変形が可能', description: '形態を変更します。消費SRが2。' },

    // 準備
    { name: '武器を構える', category: '準備', sr: 1, needsWeapon: true, condition: '手持ち武器を所持', description: '武器を攻撃できる状態にする。' },
    { name: '両手持ち', category: '準備', sr: 1, needsWeapon: true, condition: '手持ち武器を所持', description: '「両手射撃」の前提条件。' },
    { name: 'シールドを構える', category: '準備', sr: 1, needsWeapon: true, condition: 'シールドを装備', description: 'シールドでカバーする位置を選択する。' },
    { name: '武器を捨てる', category: '準備', sr: 1, needsWeapon: true, condition: '手持ち、または固定(換)の武器を所持', description: '武器を捨てて、他の武器を攻撃できる状態にする。' },
    { name: '武器を収納する', category: '準備', sr: 2, needsWeapon: false, condition: '-', description: '武器を収納して、他の武器を攻撃できる状態にする。' },
    { name: '照準', category: '準備', sr: '1以上', needsWeapon: false, condition: '-', description: '消費したSR*10%のプラス補正が次の攻撃にかかる。' },
    { name: 'ファンネル展開', category: '準備', sr: 1, needsWeapon: true, condition: 'ファンネルを搭載', description: 'ファンネルを射出する。1回の行動で6機まで。' },
    { name: 'チャージ', category: '準備', sr: '1以上', needsWeapon: false, condition: 'チャージが必要な武器を所持', description: '高出力の武器を使用するためにエネルギーを溜める。' },
    { name: '切替', category: '準備', sr: 1, needsWeapon: true, condition: 'モード切替などが可能な武器を所持', description: '武器の出力やモードを切り替える。' },
    { name: '部位狙い', category: '準備', sr: '武器SR+2', needsWeapon: true, condition: '狙う部位が遮蔽されていない', description: '命中率は1/2になり、狙った部位に命中する。' },
    { name: '箇所狙い', category: '準備', sr: '武器SR+4', needsWeapon: true, condition: '狙う箇所が遮蔽されていない', description: '命中率は1/4になり、狙った箇所に命中する。' },
];


const FUNNEL_ACTION_LIST = [
    { name: '待機' },
    { name: '射撃' },
    { name: '移動' },
    { name: '帰投' },
];

export const GAME_MASTER_DATA = {
    ACTION_LIST: ACTION_LIST,
    FUNNEL_ACTION_LIST: FUNNEL_ACTION_LIST,
    weaponMasterList: [
        // Rifles
        { weaponName: 'ライフル', id: 'rifle_beam_s', category: '射撃', attribute: 'ビーム', canIntercept: false, size: 'S', damage: '1D6+5', sr: 1, attacks: 4, hitChance: -10, parryChance: -20, ap: 2, enCost: 1, weight: 3, enOrAmmo: 0, ammoWeight: 5, dcp: 5, range: { near: 5, mid: -999, far: -999, vfar: -999 }, specialAction: '', specialEffect: '貫通', notes: 'ビームスプレーガンなど' },
        { weaponName: 'ライフル', id: 'rifle_beam_m', category: '射撃', attribute: 'ビーム', canIntercept: false, size: 'M', damage: '1D8+7', sr: 2, attacks: 3, hitChance: 0, parryChance: -10, ap: 2, enCost: 2, weight: 6, enOrAmmo: 0, ammoWeight: 7, dcp: 15, range: { near: 15, mid: 20, far: 10, vfar: -999 }, specialAction: '', specialEffect: '貫通', notes: 'ガンダムのビームライフル' },
        { weaponName: 'ライフル', id: 'rifle_beam_l', category: '射撃', attribute: 'ビーム', canIntercept: false, size: 'L', damage: '2D8+7', sr: 3, attacks: 2, hitChance: 0, parryChance: -15, ap: 2, enCost: 3, weight: 8, enOrAmmo: 0, ammoWeight: 7, dcp: -5, range: { near: -5, mid: 15, far: 20, vfar: 10 }, specialAction: '', specialEffect: '貫通', notes: 'νガンダムのビームライフル' },
        { weaponName: 'ライフル', id: 'rifle_beam_ll', category: '射撃', attribute: 'ビーム', canIntercept: false, size: 'LL', damage: '3D8+7', sr: 4, attacks: 1, hitChance: 0, parryChance: -20, ap: 2, enCost: 4, weight: 10, enOrAmmo: 0, ammoWeight: 7, dcp: -15, range: { near: -15, mid: 0, far: 15, vfar: 20 }, specialAction: '', specialEffect: '貫通', notes: 'スナイパーライフル、ビームマグナムなど' },
        { weaponName: 'ライフル', id: 'rifle_solid_s', category: '射撃', attribute: '実体', canIntercept: false, size: 'S', damage: '2D6', sr: 1, attacks: 4, hitChance: -10, parryChance: -20, ap: 2, enCost: 1, weight: 2, enOrAmmo: 5, ammoWeight: 5, dcp: 0, range: { near: 0, mid: -999, far: -999, vfar: -999 }, specialAction: '', specialEffect: '貫通', notes: '' },
        { weaponName: 'ライフル', id: 'rifle_solid_m', category: '射撃', attribute: '実体', canIntercept: false, size: 'M', damage: '2D8', sr: 2, attacks: 3, hitChance: -5, parryChance: -10, ap: 2, enCost: 1, weight: 4, enOrAmmo: 5, ammoWeight: 7, dcp: 10, range: { near: 15, mid: 15, far: 0, vfar: -999 }, specialAction: '', specialEffect: '貫通', notes: '' },
        { weaponName: 'ライフル', id: 'rifle_solid_l', category: '射撃', attribute: '実体', canIntercept: false, size: 'L', damage: '3D8', sr: 3, attacks: 2, hitChance: -5, parryChance: -15, ap: 2, enCost: 1, weight: 5, enOrAmmo: 5, ammoWeight: 7, dcp: -10, range: { near: 10, mid: 15, far: 5, vfar: -999 }, specialAction: '', specialEffect: '貫通', notes: '' },
        { weaponName: 'ライフル', id: 'rifle_solid_ll', category: '射撃', attribute: '実体', canIntercept: false, size: 'LL', damage: '4D8', sr: 4, attacks: 1, hitChance: -5, parryChance: -20, ap: 2, enCost: 1, weight: 6, enOrAmmo: 5, ammoWeight: 7, dcp: -20, range: { near: -5, mid: 10, far: 15, vfar: -999 }, specialAction: '', specialEffect: '貫通', notes: '' },
        // Machine Guns
        { weaponName: 'マシンガン', id: 'machinegun_beam_s', category: '射撃', attribute: 'ビーム', canIntercept: true, size: 'S', damage: '1D4+3', sr: 1, attacks: 5, hitChance: -5, parryChance: -20, ap: 2, enCost: 1, weight: 3, enOrAmmo: 0, ammoWeight: 5, dcp: 10, range: { near: 0, mid: -999, far: -999, vfar: -999 }, specialAction: '', specialEffect: '行動阻害', notes: 'ヘッドバルカン・アレックスの内蔵ガトリング等' },
        { weaponName: 'マシンガン', id: 'machinegun_beam_m', category: '射撃', attribute: 'ビーム', canIntercept: true, size: 'M', damage: '1D6+5', sr: 2, attacks: 4, hitChance: -5, parryChance: -10, ap: 2, enCost: 1, weight: 6, enOrAmmo: 0, ammoWeight: 7, dcp: 15, range: { near: 10, mid: 0, far: -999, vfar: -999 }, specialAction: '', specialEffect: '行動阻害', notes: 'ザクマシンガン' },
        { weaponName: 'マシンガン', id: 'machinegun_beam_l', category: '射撃', attribute: 'ビーム', canIntercept: true, size: 'L', damage: '2D6+5', sr: 3, attacks: 3, hitChance: -10, parryChance: -15, ap: 2, enCost: 2, weight: 8, enOrAmmo: 0, ammoWeight: 7, dcp: -5, range: { near: 15, mid: 10, far: -999, vfar: -999 }, specialAction: '', specialEffect: '行動阻害', notes: 'ジャイアントガトリング' },
        { weaponName: 'マシンガン', id: 'machinegun_solid_s', category: '射撃', attribute: '実体', canIntercept: true, size: 'S', damage: '2D4', sr: 1, attacks: 5, hitChance: -10, parryChance: 0, ap: 0, enCost: 1, weight: 3, enOrAmmo: 5, ammoWeight: 0, dcp: 5, range: { near: 0, mid: -999, far: -999, vfar: -999 }, specialAction: '', specialEffect: '行動阻害', notes: '' },
        { weaponName: 'マシンガン', id: 'machinegun_solid_m', category: '射撃', attribute: '実体', canIntercept: true, size: 'M', damage: '2D6', sr: 2, attacks: 4, hitChance: -10, parryChance: -10, ap: 2, enCost: 1, weight: 6, enOrAmmo: 5, ammoWeight: 7, dcp: 10, range: { near: 5, mid: 0, far: -999, vfar: -999 }, specialAction: '', specialEffect: '行動阻害', notes: '' },
        { weaponName: 'マシンガン', id: 'machinegun_solid_l', category: '射撃', attribute: '実体', canIntercept: true, size: 'L', damage: '3D6', sr: 3, attacks: 3, hitChance: -15, parryChance: -15, ap: 2, enCost: 1, weight: 8, enOrAmmo: 5, ammoWeight: 7, dcp: -10, range: { near: 10, mid: 5, far: -999, vfar: -999 }, specialAction: '', specialEffect: '行動阻害', notes: '' },
        // Bazookas
        { weaponName: 'バズーカ', id: 'bazooka_beam_m', category: '射撃', attribute: 'ビーム', canIntercept: false, size: 'M', damage: '1D8+7', sr: 3, attacks: 2, hitChance: -15, parryChance: -15, ap: 2, enCost: 1, weight: 10, enOrAmmo: 0, ammoWeight: 7, dcp: -5, range: { near: -10, mid: -15, far: 0, vfar: -999 }, specialAction: '', specialEffect: '貫通', notes: '' },
        { weaponName: 'バズーカ', id: 'bazooka_beam_l', category: '射撃', attribute: 'ビーム', canIntercept: false, size: 'L', damage: '2D8+7', sr: 4, attacks: 1, hitChance: -20, parryChance: -20, ap: 2, enCost: 7, weight: 10, enOrAmmo: 0, ammoWeight: 7, dcp: -10, range: { near: -15, mid: -10, far: -10, vfar: -999 }, specialAction: '', specialEffect: '貫通', notes: '' },
        { weaponName: 'バズーカ', id: 'bazooka_solid_m', category: '射撃', attribute: '実体', canIntercept: false, size: 'M', damage: '2D8', sr: 3, attacks: 2, hitChance: -20, parryChance: -15, ap: 2, enCost: 1, weight: 8, enOrAmmo: 5, ammoWeight: 7, dcp: -10, range: { near: -15, mid: -20, far: 0, vfar: -999 }, specialAction: '', specialEffect: '複数破壊', notes: '' },
        { weaponName: 'バズーカ', id: 'bazooka_solid_l', category: '射撃', attribute: '実体', canIntercept: false, size: 'L', damage: '3D8', sr: 4, attacks: 1, hitChance: -25, parryChance: -20, ap: 2, enCost: 1, weight: 8, enOrAmmo: 5, ammoWeight: 7, dcp: -15, range: { near: -20, mid: -15, far: -15, vfar: -999 }, specialAction: '', specialEffect: '複数破壊', notes: '' },
        // Cannons
        { weaponName: 'キャノン', id: 'cannon_beam_m', category: '射撃', attribute: 'ビーム', canIntercept: false, size: 'M', damage: '2D10+9', sr: 3, attacks: 3, hitChance: -5, parryChance: -15, ap: 2, enCost: 3, weight: 6, enOrAmmo: 0, ammoWeight: 7, dcp: 0, range: { near: -20, mid: 20, far: 30, vfar: -999 }, specialAction: '', specialEffect: '貫通', notes: '' },
        { weaponName: 'キャノン', id: 'cannon_beam_l', category: '射撃', attribute: 'ビーム', canIntercept: false, size: 'L', damage: '3D10+9', sr: 4, attacks: 2, hitChance: -10, parryChance: -20, ap: 2, enCost: 5, weight: 8, enOrAmmo: 0, ammoWeight: 7, dcp: 0, range: { near: -25, mid: 25, far: 30, vfar: -999 }, specialAction: '', specialEffect: '貫通', notes: '' },
        { weaponName: 'キャノン', id: 'cannon_beam_ll', category: '射撃', attribute: 'ビーム', canIntercept: false, size: 'LL', damage: '4D10+9', sr: 5, attacks: 1, hitChance: -15, parryChance: -25, ap: 2, enCost: 7, weight: 10, enOrAmmo: 0, ammoWeight: 7, dcp: 0, range: { near: -30, mid: 25, far: 35, vfar: -999 }, specialAction: '', specialEffect: '貫通', notes: '' },
        { weaponName: 'キャノン', id: 'cannon_solid_m', category: '射撃', attribute: '実体', canIntercept: false, size: 'M', damage: '3D10', sr: 3, attacks: 3, hitChance: -10, parryChance: -15, ap: 2, enCost: 1, weight: 6, enOrAmmo: 5, ammoWeight: 7, dcp: 0, range: { near: -25, mid: 15, far: 25, vfar: -999 }, specialAction: '', specialEffect: 'ノックバック', notes: '' },
        { weaponName: 'キャノン', id: 'cannon_solid_l', category: '射撃', attribute: '実体', canIntercept: false, size: 'L', damage: '4D10', sr: 4, attacks: 2, hitChance: -15, parryChance: -20, ap: 2, enCost: 1, weight: 8, enOrAmmo: 5, ammoWeight: 7, dcp: 0, range: { near: -30, mid: 20, far: 25, vfar: -999 }, specialAction: '', specialEffect: 'ノックバック', notes: '' },
        { weaponName: 'キャノン', id: 'cannon_solid_ll', category: '射撃', attribute: '実体', canIntercept: false, size: 'LL', damage: '5D10', sr: 5, attacks: 1, hitChance: -20, parryChance: -25, ap: 2, enCost: 1, weight: 10, enOrAmmo: 5, ammoWeight: 7, dcp: 0, range: { near: -35, mid: 20, far: 30, vfar: -999 }, specialAction: '', specialEffect: 'ノックバック', notes: '' },
        // Funnels
        { weaponName: 'ファンネル', id: 'funnel_beam_s', type: 'funnel', category: '射撃', attribute: 'ビーム', canIntercept: true, size: 'S', damage: '2D4', sr: 1, attacks: 5, hitChance: 20, parryChance: 0, ap: 1, enCost: 1, weight: 1, enOrAmmo: 10, ammoWeight: 0, dcp: 7, range: { near: 10, mid: -999, far: -999, vfar: -999 }, specialAction: '', specialEffect: '', notes: '1ユニットは6機以内で自由に割り振る, キュベレイ、クシャトリヤ' },
        { weaponName: 'ファンネル', id: 'funnel_beam_m', type: 'funnel', category: '射撃', attribute: 'ビーム', canIntercept: true, size: 'M', damage: '2D6', sr: 1, attacks: 4, hitChance: 10, parryChance: 0, ap: 1, enCost: 1, weight: 2, enOrAmmo: 15, ammoWeight: 0, dcp: 7, range: { near: 10, mid: -999, far: -999, vfar: -999 }, specialAction: '', specialEffect: '', notes: '1ユニット1機, サザビー' },
        { weaponName: 'ファンネル', id: 'funnel_beam_l', type: 'funnel', category: '射撃', attribute: 'ビーム', canIntercept: true, size: 'L', damage: '3D6', sr: 1, attacks: 3, hitChance: 5, parryChance: 0, ap: 2, enCost: 1, weight: 3, enOrAmmo: 20, ammoWeight: 0, dcp: 7, range: { near: 10, mid: -999, far: -999, vfar: -999 }, specialAction: '', specialEffect: '', notes: '1ユニット1機, νガンダム、エルメス' },
        // Missiles
        { weaponName: 'ミサイル', id: 'missile_solid_s', category: '射撃', attribute: '実体', canIntercept: false, size: 'S', damage: '2D6', sr: 1, attacks: 0, hitChance: 0, parryChance: 0, ap: 2, enCost: 1, weight: 0, enOrAmmo: 5, ammoWeight: 8, dcp: 0, range: { near: -5, mid: -10, far: -999, vfar: -999 }, specialAction: '一斉射撃', specialEffect: '', notes: '10連奏以上' },
        { weaponName: 'ミサイル', id: 'missile_solid_m', category: '射撃', attribute: '実体', canIntercept: false, size: 'M', damage: '3D6', sr: 2, attacks: 0, hitChance: 0, parryChance: 0, ap: 2, enCost: 1, weight: '1xX+3', enOrAmmo: 5, ammoWeight: 8, dcp: 0, range: { near: -10, mid: -15, far: -15, vfar: -999 }, specialAction: '一斉射撃', specialEffect: '', notes: '1~9連奏' },
        { weaponName: 'ミサイル', id: 'missile_solid_l', category: '射撃', attribute: '実体', canIntercept: false, size: 'L', damage: '4D6', sr: 3, attacks: 0, hitChance: 0, parryChance: 0, ap: 2, enCost: 1, weight: 8, enOrAmmo: 5, ammoWeight: 8, dcp: 0, range: { near: -15, mid: -20, far: -20, vfar: -999 }, specialAction: '一斉射撃', specialEffect: '', notes: '1発式' },
        { weaponName: 'ミサイル', id: 'missile_solid_ll', category: '射撃', attribute: '実体', canIntercept: false, size: 'LL', damage: '5D6', sr: 4, attacks: 0, hitChance: 0, parryChance: 0, ap: 2, enCost: 1, weight: 8, enOrAmmo: 5, ammoWeight: 8, dcp: 0, range: { near: -15, mid: -20, far: -20, vfar: -999 }, specialAction: '一斉射撃', specialEffect: '', notes: '1発式' },
        // Grenades
        { weaponName: 'グレネード', id: 'grenade_solid_m', category: '射撃', attribute: '実体', canIntercept: false, size: '-', damage: '1D6+3', sr: 2, attacks: 0, hitChance: -15, parryChance: -15, ap: 2, enCost: 1, weight: 6, enOrAmmo: 5, ammoWeight: 8, dcp: -10, range: { near: 0, mid: -999, far: -999, vfar: -999 }, specialAction: '', specialEffect: '', notes: '' },
        { weaponName: '手投げグレネード', id: 'grenade_solid_s', category: '射撃', attribute: '実体', canIntercept: false, size: '-', damage: '1D6+3', sr: 3, attacks: 0, hitChance: 0, parryChance: 0, ap: 0, enCost: 1, weight: 1, enOrAmmo: 5, ammoWeight: 8, dcp: 0, range: { near: 0, mid: -999, far: -999, vfar: -999 }, specialAction: '', specialEffect: '', notes: '' },
        // Melee Weapons
        { weaponName: 'ダガー', id: 'dagger_beam_s', category: '格闘', attribute: 'ビーム', canIntercept: false, size: 'S', damage: '1D6+7', sr: 1, attacks: 0, hitChance: 15, parryChance: 10, ap: 1, enCost: 1, weight: 1, enOrAmmo: 0, ammoWeight: 7, dcp: 0, range: { near: 0, mid: -999, far: -999, vfar: -999 }, specialAction: '斬・突', specialEffect: '', notes: '' },
        { weaponName: 'ダガー', id: 'dagger_solid_s', category: '格闘', attribute: '実体', canIntercept: false, size: 'S', damage: '2D6+2', sr: 1, attacks: 0, hitChance: 15, parryChance: 10, ap: 3, enCost: 'H-1', weight: 2, enOrAmmo: 0, ammoWeight: 0, dcp: 0, range: { near: 0, mid: -999, far: -999, vfar: -999 }, specialAction: '斬・突', specialEffect: '', notes: '' },
        { weaponName: 'ソード', id: 'sword_beam_m', category: '格闘', attribute: 'ビーム', canIntercept: false, size: 'M', damage: '1D8+9', sr: 2, attacks: '※', hitChance: 20, parryChance: 15, ap: 2, enCost: 2, weight: 1, enOrAmmo: 0, ammoWeight: 7, dcp: 0, range: { near: 0, mid: -999, far: -999, vfar: -999 }, specialAction: '斬・突', specialEffect: '', notes: '' },
        { weaponName: 'ソード', id: 'sword_beam_l', category: '格闘', attribute: 'ビーム', canIntercept: false, size: 'L', damage: '2D8+9', sr: 3, attacks: '※', hitChance: 10, parryChance: 5, ap: 1, enCost: 3, weight: 2, enOrAmmo: 0, ammoWeight: 7, dcp: 0, range: { near: 0, mid: -999, far: -999, vfar: -999 }, specialAction: '斬・突', specialEffect: '', notes: '両手持ち' },
        { weaponName: 'ソード', id: 'sword_solid_m', category: '格闘', attribute: '実体', canIntercept: false, size: 'M', damage: '2D8+2', sr: 2, attacks: '※', hitChance: 20, parryChance: 15, ap: 6, enCost: 'H-1', weight: 4, enOrAmmo: 0, ammoWeight: 0, dcp: 0, range: { near: 0, mid: -999, far: -999, vfar: -999 }, specialAction: '斬・突', specialEffect: '', notes: '' },
        { weaponName: 'ソード', id: 'sword_solid_l', category: '格闘', attribute: '実体', canIntercept: false, size: 'L', damage: '3D8+2', sr: 3, attacks: '※', hitChance: 10, parryChance: 5, ap: 8, enCost: 0, weight: 6, enOrAmmo: 0, ammoWeight: 0, dcp: 0, range: { near: 0, mid: -999, far: -999, vfar: -999 }, specialAction: '斬・突', specialEffect: '', notes: '両手持ち' },
        { weaponName: 'アックス', id: 'axe_solid_m', category: '格闘', attribute: '実体', canIntercept: false, size: 'M', damage: '2D8+4', sr: 2, attacks: '※', hitChance: 10, parryChance: 5, ap: 5, enCost: 0, weight: 6, enOrAmmo: 0, ammoWeight: 0, dcp: 0, range: { near: 0, mid: -999, far: -999, vfar: -999 }, specialAction: '斬', specialEffect: 'ノックバック', notes: '' },
        { weaponName: 'アックス', id: 'axe_beam_m', category: '格闘', attribute: 'ビーム', canIntercept: false, size: 'M', damage: '1D8+11', sr: 2, attacks: '※', hitChance: 10, parryChance: 5, ap: 4, enCost: 2, weight: 4, enOrAmmo: 0, ammoWeight: 7, dcp: 0, range: { near: 0, mid: -999, far: -999, vfar: -999 }, specialAction: '斬', specialEffect: 'ノックバック', notes: '' },
        { weaponName: 'ポールアーム', id: 'polearm_beam_l', category: '格闘', attribute: 'ビーム', canIntercept: false, size: 'L', damage: '2D10+9', sr: 3, attacks: '※', hitChance: -10, parryChance: 5, ap: 6, enCost: 4, weight: 6, enOrAmmo: 0, ammoWeight: 7, dcp: 0, range: { near: 0, mid: -999, far: -999, vfar: -999 }, specialAction: '※', specialEffect: '', notes: '両手持ち、武器の形によって斬・突・殴がある' },
        { weaponName: 'ポールアーム', id: 'polearm_solid_l', category: '格闘', attribute: '実体', canIntercept: false, size: 'L', damage: '3D10+2', sr: 3, attacks: '※', hitChance: -10, parryChance: 5, ap: 10, enCost: 0, weight: 8, enOrAmmo: 0, ammoWeight: 0, dcp: 0, range: { near: 0, mid: -999, far: -999, vfar: -999 }, specialAction: '斬・突', specialEffect: '', notes: '両手持ち' },
        { weaponName: 'スピア', id: 'spear_beam_m', category: '格闘', attribute: 'ビーム', canIntercept: false, size: 'M', damage: '2D6+5', sr: 2, attacks: '※', hitChance: 20, parryChance: 15, ap: 4, enCost: 2, weight: 4, enOrAmmo: 0, ammoWeight: 7, dcp: 0, range: { near: 0, mid: -999, far: -999, vfar: -999 }, specialAction: '突', specialEffect: '', notes: '' },
        { weaponName: 'スピア', id: 'spear_solid_m', category: '格闘', attribute: '実体', canIntercept: false, size: 'M', damage: '3D6', sr: 2, attacks: '※', hitChance: 20, parryChance: 15, ap: 6, enCost: 0, weight: 6, enOrAmmo: 0, ammoWeight: 0, dcp: 0, range: { near: 0, mid: -999, far: -999, vfar: -999 }, specialAction: '突', specialEffect: '', notes: '' },
        { weaponName: 'ランス', id: 'lance_beam_l', category: '格闘', attribute: 'ビーム', canIntercept: false, size: 'L', damage: '2D12+9', sr: 3, attacks: '※', hitChance: 5, parryChance: 0, ap: 8, enCost: 4, weight: 8, enOrAmmo: 0, ammoWeight: 7, dcp: 0, range: { near: 0, mid: -999, far: -999, vfar: -999 }, specialAction: '突・チャージ', specialEffect: '', notes: '' },
        { weaponName: 'ランス', id: 'lance_solid_l', category: '格闘', attribute: '実体', canIntercept: false, size: 'L', damage: '3D12+4', sr: 3, attacks: '※', hitChance: 5, parryChance: 0, ap: 12, enCost: 0, weight: 10, enOrAmmo: 0, ammoWeight: 0, dcp: 0, range: { near: 0, mid: -999, far: -999, vfar: -999 }, specialAction: '突・チャージ', specialEffect: '', notes: '' },
        { weaponName: 'ハンマー', id: 'hammer_beam_m', category: '格闘', attribute: 'ビーム', canIntercept: false, size: 'M', damage: '1D8+10', sr: 3, attacks: '※', hitChance: 10, parryChance: 5, ap: 8, enCost: 3, weight: 6, enOrAmmo: 0, ammoWeight: 7, dcp: 0, range: { near: 0, mid: -999, far: -999, vfar: -999 }, specialAction: '殴', specialEffect: '装甲軽減', notes: '' },
        { weaponName: 'ハンマー', id: 'hammer_solid_m', category: '格闘', attribute: '実体', canIntercept: false, size: 'M', damage: '2D8+3', sr: 3, attacks: '※', hitChance: 10, parryChance: 5, ap: 10, enCost: 0, weight: 10, enOrAmmo: 0, ammoWeight: 0, dcp: 0, range: { near: 0, mid: -999, far: -999, vfar: -999 }, specialAction: '殴', specialEffect: '装甲軽減', notes: '' },
        { weaponName: 'パンチ', id: 'punch_solid_s', category: '格闘', attribute: '実体', canIntercept: false, size: 'S', damage: '1D3', sr: 3, attacks: '※', hitChance: 20, parryChance: 15, ap: 0, enCost: 0, weight: 0, enOrAmmo: 0, ammoWeight: 0, dcp: 0, range: { near: 0, mid: -999, far: -999, vfar: -999 }, specialAction: '殴', specialEffect: '', notes: '' },
        { weaponName: 'キック', id: 'kick_solid_s', category: '格闘', attribute: '実体', canIntercept: false, size: 'S', damage: '1D6', sr: 3, attacks: '※', hitChance: 10, parryChance: 5, ap: 0, enCost: 0, weight: 0, enOrAmmo: 0, ammoWeight: 0, dcp: 0, range: { near: 0, mid: -999, far: -999, vfar: -999 }, specialAction: '殴', specialEffect: '', notes: '' },
        { weaponName: 'シールド', id: 'shield_attack_beam_s', category: '格闘', attribute: 'ビーム', canIntercept: false, size: 'S', damage: '1D4+2', sr: 3, attacks: '※', hitChance: 5, parryChance: 10, ap: 6, enCost: 0, weight: 3, enOrAmmo: 0, ammoWeight: 0, dcp: 0, range: { near: 0, mid: -999, far: -999, vfar: -999 }, specialAction: '殴', specialEffect: '', notes: '' },
        { weaponName: 'シールド', id: 'shield_attack_beam_m', category: '格闘', attribute: 'ビーム', canIntercept: false, size: 'M', damage: '1D6+3', sr: 4, attacks: '※', hitChance: 10, parryChance: 20, ap: 8, enCost: 0, weight: 4, enOrAmmo: 0, ammoWeight: 0, dcp: 0, range: { near: 0, mid: -999, far: -999, vfar: -999 }, specialAction: '殴', specialEffect: '', notes: '' },
        { weaponName: 'シールド', id: 'shield_attack_solid_s', category: '格闘', attribute: '実体', canIntercept: false, size: 'S', damage: '1D4', sr: 3, attacks: '※', hitChance: 5, parryChance: 10, ap: 6, enCost: 0, weight: 6, enOrAmmo: 0, ammoWeight: 0, dcp: 0, range: { near: 0, mid: -999, far: -999, vfar: -999 }, specialAction: '殴', specialEffect: '', notes: '' },
        { weaponName: 'シールド', id: 'shield_attack_solid_m', category: '格闘', attribute: '実体', canIntercept: false, size: 'M', damage: '1D6', sr: 4, attacks: '※', hitChance: 10, parryChance: 20, ap: 8, enCost: 0, weight: 8, enOrAmmo: 0, ammoWeight: 0, dcp: 0, range: { near: 0, mid: -999, far: -999, vfar: -999 }, specialAction: '殴', specialEffect: '', notes: '' },
        // Added at the end to maintain index compatibility
        { weaponName: 'ガトリング', id: 'gatling_beam_m', category: '射撃', attribute: 'ビーム', canIntercept: true, size: 'M', damage: '2D6+5', sr: 3, attacks: 3, hitChance: -5, parryChance: -10, ap: 2, enCost: 2, weight: 7, enOrAmmo: 0, ammoWeight: 7, dcp: 15, range: { near: 10, mid: 0, far: -999, vfar: -999 }, specialAction: '', specialEffect: '行動阻害', notes: '' },
        { weaponName: 'ガトリング', id: 'gatling_beam_l', category: '射撃', attribute: 'ビーム', canIntercept: true, size: 'L', damage: '3D6+5', sr: 4, attacks: 2, hitChance: -10, parryChance: -15, ap: 2, enCost: 3, weight: 9, enOrAmmo: 0, ammoWeight: 7, dcp: -5, range: { near: 15, mid: 10, far: -999, vfar: -999 }, specialAction: '', specialEffect: '行動阻害', notes: '' },
        { weaponName: 'ガトリング', id: 'gatling_solid_s', category: '射撃', attribute: '実体', canIntercept: true, size: 'S', damage: '2D6', sr: 2, attacks: 4, hitChance: -10, parryChance: -20, ap: 2, enCost: 1, weight: 5, enOrAmmo: 5, ammoWeight: 7, dcp: 5, range: { near: 5, mid: 0, far: -999, vfar: -999 }, specialAction: '', specialEffect: '行動阻害', notes: '' },
        { weaponName: 'ガトリング', id: 'gatling_solid_m', category: '射撃', attribute: '実体', canIntercept: true, size: 'M', damage: '3D6', sr: 3, attacks: 3, hitChance: -10, parryChance: -10, ap: 2, enCost: 1, weight: 7, enOrAmmo: 5, ammoWeight: 7, dcp: 10, range: { near: 10, mid: 5, far: -999, vfar: -999 }, specialAction: '', specialEffect: '行動阻害', notes: '' },
        { weaponName: 'ガトリング', id: 'gatling_solid_l', category: '射撃', attribute: '実体', canIntercept: true, size: 'L', damage: '4D6', sr: 4, attacks: 2, hitChance: -15, parryChance: -15, ap: 2, enCost: 1, weight: 9, enOrAmmo: 5, ammoWeight: 7, dcp: -10, range: { near: 10, mid: 5, far: -999, vfar: -999 }, specialAction: '', specialEffect: '行動阻害', notes: '' },
        { weaponName: 'ショットガン', id: 'shotgun_beam_s', category: '射撃', attribute: 'ビーム', canIntercept: true, size: 'S', damage: '1D6+5', sr: 2, attacks: 2, hitChance: -5, parryChance: -20, ap: 2, enCost: 3, weight: 3, enOrAmmo: 0, ammoWeight: 7, dcp: 10, range: { near: 5, mid: 0, far: -999, vfar: -999 }, specialAction: '', specialEffect: '複数部位', notes: '' },
        { weaponName: 'ショットガン', id: 'shotgun_beam_m', category: '射撃', attribute: 'ビーム', canIntercept: true, size: 'M', damage: '1D8+7', sr: 3, attacks: 2, hitChance: -5, parryChance: -10, ap: 2, enCost: 5, weight: 6, enOrAmmo: 0, ammoWeight: 7, dcp: 15, range: { near: 10, mid: 5, far: -999, vfar: -999 }, specialAction: '', specialEffect: '複数部位', notes: '' },
        { weaponName: 'ショットガン', id: 'shotgun_beam_l', category: '射撃', attribute: 'ビーム', canIntercept: true, size: 'L', damage: '2D8+7', sr: 4, attacks: 1, hitChance: -10, parryChance: -15, ap: 2, enCost: 7, weight: 8, enOrAmmo: 0, ammoWeight: 7, dcp: -5, range: { near: 15, mid: 10, far: -999, vfar: -999 }, specialAction: '', specialEffect: '複数部位', notes: '' },
        { weaponName: 'ショットガン', id: 'shotgun_solid_s', category: '射撃', attribute: '実体', canIntercept: true, size: 'S', damage: '2D6', sr: 2, attacks: 2, hitChance: -10, parryChance: -20, ap: 2, enCost: 1, weight: 3, enOrAmmo: 5, ammoWeight: 7, dcp: 5, range: { near: 5, mid: 0, far: -999, vfar: -999 }, specialAction: '', specialEffect: '複数部位', notes: '' },
        { weaponName: 'ショットガン', id: 'shotgun_solid_m', category: '射撃', attribute: '実体', canIntercept: true, size: 'M', damage: '2D8', sr: 3, attacks: 2, hitChance: -10, parryChance: -10, ap: 2, enCost: 1, weight: 6, enOrAmmo: 5, ammoWeight: 7, dcp: 10, range: { near: 10, mid: 5, far: -999, vfar: -999 }, specialAction: '', specialEffect: '複数部位', notes: '' },
        { weaponName: 'ショットガン', id: 'shotgun_solid_l', category: '射撃', attribute: '実体', canIntercept: true, size: 'L', damage: '3D8', sr: 4, attacks: 1, hitChance: -15, parryChance: -15, ap: 2, enCost: 1, weight: 8, enOrAmmo: 5, ammoWeight: 7, dcp: -10, range: { near: 10, mid: 5, far: -999, vfar: -999 }, specialAction: '', specialEffect: '複数部位', notes: '' },
    ],
    propellantTanks: [
        { name: "プロペラントタンク(小)", size: "S", energy: 20, weight: 4, ap: 1, hp: 1, dcp: 7 },
        { name: "プロペラントタンク(中)", size: "M", energy: 40, weight: 6, ap: 1, hp: 1, dcp: 7 },
        { name: "プロペラントタンク(大)", size: "L", energy: 80, weight: 8, ap: 1, hp: 1, dcp: 7 },
        { name: "プロペラントタンク(特大)", size: "LL", energy: 160, weight: 16, ap: 1, hp: 1, dcp: 8 }
    ],
    sizeChart: [
        { sizeName: 'S', sizeNumber: 1, category: 'S' },
        { sizeName: '2S', sizeNumber: 2, category: 'S' },
        { sizeName: 'M', sizeNumber: 3, category: 'M' },
        { sizeName: '2M', sizeNumber: 4, category: 'M' },
        { sizeName: 'L', sizeNumber: 5, category: 'L' },
        { sizeName: '2L', sizeNumber: 6, category: 'L' },
        { sizeName: 'XL', sizeNumber: 7, category: 'XL' },
        { sizeName: '2XL', sizeNumber: 8, category: 'XL' },
        { sizeName: 'XXL', sizeNumber: 9, category: 'XXL' },
    ],
    sizeBasedStats: {
        "S":  { baseEN: 80,  baseMove: 6, baseMoveEn: 1, weaponDamageMod: -2, weaponEnCostMod: -1, parts: { "頭部": { ap: 5, hp: 3 }, "胸部": {ap: 7, hp: 10}, "腹部": {ap: 6, hp: 10}, "バックパック": {ap: 6, hp: 6}, "右腕部": {ap: 5, hp: 3}, "左腕部": {ap: 5, hp: 3}, "右脚部": {ap: 6, hp: 6}, "左脚部": {ap: 6, hp: 6} } },
        "2S": { baseEN: 100, baseMove: 6, baseMoveEn: 1, weaponDamageMod: -2, weaponEnCostMod: -1, parts: { "頭部": { ap: 6, hp: 5 }, "胸部": {ap: 8, hp: 12}, "腹部": {ap: 7, hp: 12}, "バックパック": {ap: 7, hp: 8}, "右腕部": {ap: 6, hp: 5}, "左腕部": {ap: 6, hp: 5}, "右脚部": {ap: 7, hp: 8}, "左脚部": {ap: 7, hp: 8} } },
        "M":  { baseEN: 140, baseMove: 6, baseMoveEn: 1, weaponDamageMod: 0,  weaponEnCostMod: 0,  parts: { "頭部": { ap: 7, hp: 7 }, "胸部": {ap: 9, hp: 14}, "腹部": {ap: 8, hp: 14}, "バックパック": {ap: 8, hp: 10}, "右腕部": {ap: 7, hp: 7}, "左腕部": {ap: 7, hp: 7}, "右脚部": {ap: 8, hp: 10}, "左脚部": {ap: 8, hp: 10} } },
        "2M": { baseEN: 160, baseMove: 6, baseMoveEn: 1, weaponDamageMod: 0,  weaponEnCostMod: 0,  parts: { "頭部": { ap: 8, hp: 9 }, "胸部": {ap: 10, hp: 16}, "腹部": {ap: 9, hp: 16}, "バックパック": {ap: 9, hp: 12}, "右腕部": {ap: 8, hp: 9}, "左腕部": {ap: 8, hp: 9}, "右脚部": {ap: 9, hp: 12}, "左脚部": {ap: 9, hp: 12} } },
        "L":  { baseEN: 200, baseMove: 6, baseMoveEn: 2, weaponDamageMod: 2,  weaponEnCostMod: 1,  parts: { "頭部": { ap: 9, hp: 11 }, "胸部": {ap: 11, hp: 18}, "腹部": {ap: 10, hp: 18}, "バックパック": {ap: 10, hp: 14}, "右腕部": {ap: 9, hp: 11}, "左腕部": {ap: 9, hp: 11}, "右脚部": {ap: 10, hp: 14}, "左脚部": {ap: 10, hp: 14} } },
        "2L": { baseEN: 220, baseMove: 6, baseMoveEn: 2, weaponDamageMod: 2,  weaponEnCostMod: 1,  parts: { "頭部": { ap: 10, hp: 13 }, "胸部": {ap: 12, hp: 20}, "腹部": {ap: 11, hp: 20}, "バックパック": {ap: 11, hp: 16}, "右腕部": {ap: 10, hp: 13}, "左腕部": {ap: 10, hp: 13}, "右脚部": {ap: 11, hp: 16}, "左脚部": {ap: 11, hp: 16} } },
        "XL": { baseEN: 260, baseMove: 6, baseMoveEn: 3, weaponDamageMod: 4,  weaponEnCostMod: 2,  parts: { "頭部": { ap: 11, hp: 15 }, "胸部": {ap: 13, hp: 22}, "腹部": {ap: 12, hp: 22}, "バックパック": {ap: 12, hp: 18}, "右腕部": {ap: 11, hp: 15}, "左腕部": {ap: 11, hp: 15}, "右脚部": {ap: 12, hp: 18}, "左脚部": {ap: 12, hp: 18} } },
        "2XL":{ baseEN: 280, baseMove: 6, baseMoveEn: 3, weaponDamageMod: 4,  weaponEnCostMod: 2,  parts: { "頭部": { ap: 12, hp: 17 }, "胸部": {ap: 14, hp: 24}, "腹部": {ap: 13, hp: 24}, "バックパック": {ap: 13, hp: 20}, "右腕部": {ap: 12, hp: 17}, "左腕部": {ap: 12, hp: 17}, "右脚部": {ap: 13, hp: 20}, "左脚部": {ap: 13, hp: 20} } },
        "XXL":{ baseEN: 320, baseMove: 6, baseMoveEn: 3, weaponDamageMod: 4,  weaponEnCostMod: 2,  parts: { "頭部": { ap: 13, hp: 19 }, "胸部": {ap: 15, hp: 26}, "腹部": {ap: 14, hp: 26}, "バックパック": {ap: 14, hp: 22}, "右腕部": {ap: 13, hp: 19}, "左腕部": {ap: 13, hp: 19}, "右脚部": {ap: 14, hp: 22}, "左脚部": {ap: 14, hp: 22} } },
    },
    weightBonusTable: [
        { range: [-9, -7], evade: 30, move: 3, moveEn: 0 },
        { range: [-6, -4], evade: 30, move: 2, moveEn: 0 },
        { range: [-3, -1], evade: 20, move: 2, moveEn: 0 },
        { range: [0, 7], evade: 20, move: 1, moveEn: 0 },
        { range: [8, 14], evade: 10, move: 1, moveEn: 0 },
        { range: [15, 21], evade: 0, move: 0, moveEn: 0 },
        { range: [22, 31], evade: -10, move: 0, moveEn: 1 },
        { range: [32, 41], evade: -10, move: -1, moveEn: 1 },
        { range: [42, 51], evade: -20, move: -1, moveEn: 2 },
        { range: [52, 61], evade: -20, move: -2, moveEn: 2 },
        { range: [62, 71], evade: -30, move: -2, moveEn: 3 },
        { range: [72, 81], evade: -30, move: -3, moveEn: 3 },
        { range: [82, 91], evade: -40, move: -3, moveEn: 4 },
        { range: [92, 101], evade: -40, move: -4, moveEn: 4 },
        { range: [102, 111], evade: -50, move: -4, moveEn: 5 },
        { range: [112, 121], evade: -50, move: -5, moveEn: 5 }
    ],
    unitTypeModifiers: {
        "汎用型": { ap: 0, hp: 0, moveEn: 0, evade: 0, move: 0 },
        "高機動型": { ap: -2, hp: -2, moveEn: -1, evade: 30, move: 2 },
        "重装甲型": { ap: 2, hp: 3, moveEn: 0, evade: -20, move: -1 }
    },
    combatTypeModifiers: {
        "汎用型": { meleeMove: 1, meleeDmg: 0, srReduce: 0, shootHit: 0, meleeHit: 0, parry: 0, "射撃ダメ": 0 },
        "格闘型": { meleeMove: 2, meleeDmg: 1, srReduce: 1, shootHit: -20, meleeHit: 20, parry: 20, "射撃ダメ": 0 },
        "射撃型": { meleeMove: 0, meleeDmg: 0, srReduce: 1, shootHit: 30, meleeHit: -30, parry: -20, "射撃ダメ": 1 }
    },
    armamentTypeModifiers: {
        "汎用型": { beamDmg: 0, solidDmg: 0 },
        "実体型": { beamDmg: 0, solidDmg: 1 },
        "ビーム型": { beamDmg: 1, solidDmg: 0 }
    },
    defaultHitLocationTable: [
        { range: [20, 20], part: '頭部' },
        { range: [19, 19], part: 'バックパック' },
        { range: [18, 17], part: '左腕部' },
        { range: [16, 15], part: '右腕部' },
        { range: [14, 11], part: '胸部' },
        { range: [10, 7], part: '腹部' },
        { range: [6, 4], part: '左脚部' },
        { range: [3, 1], part: '右脚部' }
    ]
};
