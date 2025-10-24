// src/utils/common.js の先頭
import { GAME_MASTER_DATA } from '../data/gameData.js';

// Function to get the Game ID from URL parameters
export function getGameId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('gameId');
}

// MODIFIED: Added export to use this function in the wizard
export function getWeightMods(totalWeight, slideValue) {
    let initialIndex = -1;
    GAME_MASTER_DATA.weightBonusTable.forEach((row, index) => {
        if (totalWeight >= row.range[0] && totalWeight <= row.range[1]) {
            initialIndex = index;
        }
    });

    if (initialIndex === -1) {
        initialIndex = totalWeight < GAME_MASTER_DATA.weightBonusTable[0].range[0] ? 0 : GAME_MASTER_DATA.weightBonusTable.length - 1;
    }
    
    // Ensure the final index is within the bounds of the table array
    const finalIndex = Math.max(0, Math.min(GAME_MASTER_DATA.weightBonusTable.length - 1, initialIndex - slideValue));
    const mods = GAME_MASTER_DATA.weightBonusTable[finalIndex];

    return {
        evadeMod: mods.evade,
        moveMod: mods.move,
        moveEnMod: mods.moveEn
    };
}


/**
 * Calculates the SR cost for a given action from data objects, independent of the DOM.
 * @param {object} unitData - The unit performing the action.
 * @param {object} actionData - The action plan data for a specific SR.
 * @returns {number} The calculated SR cost.
 */
export function calculateSrCostFromData(unitData, actionData) {
    if (!actionData || !actionData.action) return 1;

    const action = GAME_MASTER_DATA.ACTION_LIST.find(a => a.name === actionData.action);
    if (!action) return 1;

    // 1. Handle actions with a simple, fixed numeric SR
    if (typeof action.sr === 'number') {
        return action.sr;
    }

    // 2. Handle actions whose SR is based on a weapon
    if (typeof action.sr === 'string' && action.sr.toLowerCase().includes('武器sr')) {

        // Handle multi-weapon actions
        if (action.name === '同時攻撃' || action.name === '一斉射撃') {
            let totalWeaponSr = 0;
            if (Array.isArray(actionData.multiWeaponIndices)) {
                actionData.multiWeaponIndices.forEach(weaponIndex => {
                    const weapon = unitData.weapons[weaponIndex];
                    // Ensure weapon and finalSr exist, and finalSr can be parsed to a number
                    if (weapon && weapon.finalSr) {
                        // `finalSr` can be a number or a string like '1+x'. Parse it safely.
                        const srAsNum = parseInt(String(weapon.finalSr), 10);
                        if (!isNaN(srAsNum)) {
                            totalWeaponSr += srAsNum;
                        }
                    }
                });
            }

            if (totalWeaponSr > 0) {
                if (action.name === '同時攻撃') {
                    // Formula from game-data.js: 1 + ⌈(武器SR合計) / 2⌉
                    return 1 + Math.ceil(totalWeaponSr / 2);
                } else { // 一斉射撃
                    // Formula from game-data.js: 目標数 + ⌈(武器SR合計) / 2⌉
                    const targetCount = actionData.targetCount || 1;
                    return targetCount + Math.ceil(totalWeaponSr / 2);
                }
            }
             // If no weapons are selected for a multi-weapon attack, it's an invalid state.
             // Returning 1 prevents an infinite loop, but the action is effectively a "pass".
            return 1; 

        } else { // Handle single-weapon actions
            const weaponIndex = actionData.weaponIndex;
            if (weaponIndex !== undefined && weaponIndex > -1 && unitData.weapons && unitData.weapons[weaponIndex]) {
                const weapon = unitData.weapons[weaponIndex];
                if (weapon && weapon.finalSr) {
                    let finalSr = parseInt(String(weapon.finalSr), 10);
                    if (isNaN(finalSr)) return 1; // Default if parsing fails

                    // Apply modifiers from action.sr string (e.g., '武器SR-1', '武器SR+2')
                    if (action.sr.includes('-1')) finalSr -= 1;
                    if (action.sr.includes('+1')) finalSr += 1;
                    if (action.sr.includes('+2')) finalSr += 2;
                    if (action.sr.includes('+4')) finalSr += 4;
                    
                    return Math.max(1, finalSr);
                }
            }
            // If weapon is needed but not found, default to 1
            return 1;
        }
    }
    
    // 3. Handle other string-based SRs, like '1以上' for 照準
    const simpleParsedSr = parseInt(action.sr, 10);
    if (!isNaN(simpleParsedSr)) {
        return simpleParsedSr;
    }

    // 4. Final fallback
    return 1;
}



export function calculateAllFinalStats(unitData) {
    const finalUnitData = JSON.parse(JSON.stringify(unitData));
    finalUnitData.finalStats = {};
    finalUnitData.baseValues = {};

    // --- Active Form Determination ---
    const activeFormIndex = unitData.activeFormIndex || 0;
    const activeForm = (unitData.forms && unitData.forms[activeFormIndex]) 
        ? unitData.forms[activeFormIndex] 
        : { name: '通常形態', moveType: '全方向' }; // Default form if not defined
    finalUnitData.finalStats.activeFormName = activeForm.name;
    finalUnitData.finalStats.activeFormIndex = activeFormIndex;
    finalUnitData.finalStats.activeMoveType = activeForm.moveType;

    // --- Apparent Size Calculation ---
    let apparentSizeName = finalUnitData.types.size; // Default to base size

    // If an override is specifically set, use it. Otherwise, it remains the base size.
    if (finalUnitData.types.overrideApparentSize && finalUnitData.types.overrideApparentSize !== '') {
        apparentSizeName = finalUnitData.types.overrideApparentSize;
    }
    
    const apparentSizeNumber = GAME_MASTER_DATA.sizeChart.find(s => s.sizeName === apparentSizeName)?.sizeNumber || 3; // Default to M if not found

    finalUnitData.finalStats.apparentSize = apparentSizeName;
    finalUnitData.finalStats.apparentSizeNumber = apparentSizeNumber;

    // --- Apply Type Modifiers and Calculate Part HP/AP ---
    const unitTypeMod = GAME_MASTER_DATA.unitTypeModifiers[finalUnitData.types.unitType];
    finalUnitData.baseValues.unitTypeMod = unitTypeMod;

    const partNames = finalUnitData.hitLocationTable ? finalUnitData.hitLocationTable.map(p => p.part) : Object.keys(finalUnitData.parts);

    partNames.forEach(partName => {
        const part = finalUnitData.parts[partName];
        if (!part) return; // 部位が存在しない場合はスキップ

        // Find the corresponding entry in hitLocationTable to get basePartForStats
        const hitLocation = (finalUnitData.hitLocationTable || []).find(h => h.part === partName);
        
        // Determine the key for stats lookup. Default to the part's name if no hit location or base part is specified.
        const statKey = hitLocation?.basePartForStats || partName;
        
        const basePartStats = GAME_MASTER_DATA.sizeBasedStats[finalUnitData.types.size]?.parts[statKey] || { ap: 0, hp: 0 };
        
        part.ap = (basePartStats.ap || 0) + (unitTypeMod.ap || 0);
        part.maxHp = (basePartStats.hp || 0) + (unitTypeMod.hp || 0);
        // Preserve current HP if it exists, otherwise calculate from maxHp
        part.hp = (part.hp !== undefined) ? part.hp : part.maxHp;

        let partMoveThrusters = 0;
        let partAttitudeThrusters = 0;
        (part.internalEquipment || []).forEach(eq => {
             if (eq.status !== 'destroyed') {
                partMoveThrusters += eq.moveThrusters || 0;
                partAttitudeThrusters += eq.attitudeThrusters || 0;
            }
        });
        (part.externalEquipment || []).forEach(eq => {
             if (eq.status !== 'destroyed') {
                partMoveThrusters += eq.moveThrusters || 0;
                partAttitudeThrusters += eq.attitudeThrusters || 0;
            }
        });
        
        const dcpBonus = Math.floor((partMoveThrusters + partAttitudeThrusters) / 5);
        part.dcp = 5 + dcpBonus;
    });

    // --- Calculate HP/AP/DCP for Large Armaments ---
    if (finalUnitData.largeArmaments) {
        finalUnitData.largeArmaments.forEach(armament => {
            const armamentSize = armament.size || finalUnitData.types.size;
            // 大型武装のベースステータスは「胸部」を基準にする
            const baseArmamentStats = GAME_MASTER_DATA.sizeBasedStats[armamentSize]?.parts["胸部"] || { ap: 0, hp: 0 };
            
            armament.ap = (baseArmamentStats.ap || 0) + (unitTypeMod.ap || 0);
            armament.hp = (armament.hp !== undefined) ? armament.hp : (baseArmamentStats.hp || 0) + (unitTypeMod.hp || 0);
            armament.maxHp = (baseArmamentStats.hp || 0) + (unitTypeMod.hp || 0);

            let armamentMoveThrusters = 0;
            let armamentAttitudeThrusters = 0;
            (armament.internalEquipment || []).forEach(eq => { if (eq.status !== 'destroyed') { armamentMoveThrusters += eq.moveThrusters || 0; armamentAttitudeThrusters += eq.attitudeThrusters || 0; } });
            (armament.externalEquipment || []).forEach(eq => { if (eq.status !== 'destroyed') { armamentMoveThrusters += eq.moveThrusters || 0; armamentAttitudeThrusters += eq.attitudeThrusters || 0; } });
            
            const dcpBonus = Math.floor((armamentMoveThrusters + armamentAttitudeThrusters) / 5);
            armament.dcp = 5 + dcpBonus;
        });
    }
    
    // --- [FIXED] Calculate Totals from Base Data (Moved to after HP calculation) ---
    let totalUnitPoints = 0,
        totalMoveThrusters = 0,
        totalAttitudeThrusters = 0;

    Object.values(finalUnitData.parts).forEach(part => {
        if (part.hp > 0) {
            totalUnitPoints += part.unitPoints || 0;
            
            (part.internalEquipment || []).forEach(eq => {
                if (eq.status !== 'destroyed') {
                    totalMoveThrusters += eq.moveThrusters || 0;
                    totalAttitudeThrusters += eq.attitudeThrusters || 0;
                }
            });
            (part.externalEquipment || []).forEach(eq => {
                if (eq.status !== 'destroyed') {
                    totalMoveThrusters += eq.moveThrusters || 0;
                    totalAttitudeThrusters += eq.attitudeThrusters || 0;
                }
            });
        }
    });

    if (finalUnitData.largeArmaments) {
        finalUnitData.largeArmaments.forEach(armament => {
            if (armament.hp > 0) {
                totalUnitPoints += armament.unitPoints || 0;
                
                (armament.internalEquipment || []).forEach(eq => {
                    if (eq.status !== 'destroyed') {
                        totalMoveThrusters += eq.moveThrusters || 0;
                        totalAttitudeThrusters += eq.attitudeThrusters || 0;
                    }
                });
                (armament.externalEquipment || []).forEach(eq => {
                    if (eq.status !== 'destroyed') {
                        totalMoveThrusters += eq.moveThrusters || 0;
                        totalAttitudeThrusters += eq.attitudeThrusters || 0;
                    }
                });
            }
        });
    }

    finalUnitData.baseValues.unitPointsTotal = totalUnitPoints;
    finalUnitData.baseValues.moveThrustersTotal = totalMoveThrusters;
    finalUnitData.baseValues.attitudeThrustersTotal = totalAttitudeThrusters;


    // --- Calculate Total Weight ---
    let totalWeight = 0;
    (finalUnitData.weapons || []).forEach(w => {
        if (w.status !== 'destroyed' && w.mountType !== 'unequipped' && w.baseWeaponId) {
            const base = GAME_MASTER_DATA.weaponMasterList.find(b => b.id === w.baseWeaponId);
            if (!base) {
                w.finalWeight = 0;
                return;
            }

            // If the weapon is a deployed funnel, its weight is not counted for the main body.
            if (base.type === 'funnel' && w.isDeployed) {
                w.finalWeight = 0;
            } else {
                let weight = Number(base.weight) || 0;
                const initialWeight = weight;
                if (w.isDedicated) weight = weight - 1;
                if (w.mountType === 'fixed_permanent') weight = Math.floor(weight / 2);
                if (w.mountType === 'internal') weight = Math.floor(weight / 3);
                w.finalWeight = (initialWeight > 0) ? Math.max(1, weight) : 0;
                w.finalWeight *= (w.simultaneousAttacks || 1);
            }
            totalWeight += w.finalWeight;
        } else {
             w.finalWeight = 0;
        }
    });
    (finalUnitData.tanks || []).forEach(t => {
        if (t.status !== 'destroyed' && t.mountType !== 'unequipped') {
            const base = GAME_MASTER_DATA.propellantTanks[t.baseTankIndex];
            if(!base) return;
            let weight = base.weight || 0;
            const initialWeight = weight;
            if (t.isDedicated) weight = weight - 1;
            if (t.mountType === 'fixed_permanent') weight = Math.floor(weight / 2);
            if (t.mountType === 'internal') weight = Math.floor(weight / 3);
            t.finalWeight = (initialWeight > 0) ? Math.max(1, weight) : 0;
            totalWeight += t.finalWeight;
        } else {
             t.finalWeight = 0;
        }
    });
    finalUnitData.baseValues.totalWeight = totalWeight;

    // --- Calculate Final Stats ---
    const slideValue = Math.floor((totalMoveThrusters + totalAttitudeThrusters) / 10);
    finalUnitData.baseValues.slideValue = slideValue;
    
    const weightMods = getWeightMods(totalWeight, slideValue);
    finalUnitData.baseValues.weightMods = weightMods;
    
    const combatTypeMod = GAME_MASTER_DATA.combatTypeModifiers[finalUnitData.types.combatType];
    finalUnitData.baseValues.combatTypeMod = combatTypeMod;
    
    const sizeMod = GAME_MASTER_DATA.sizeBasedStats[finalUnitData.types.size];
    finalUnitData.baseValues.sizeMod = sizeMod;

    finalUnitData.finalStats.baseShootingHit = totalUnitPoints - totalWeight + (combatTypeMod.shootHit || 0);
    finalUnitData.finalStats.baseMeleeHit = totalUnitPoints - totalWeight + (combatTypeMod.meleeHit || 0);

    finalUnitData.finalStats.evade = totalUnitPoints - totalWeight + weightMods.evadeMod + totalAttitudeThrusters + (unitTypeMod.evade || 0);
    finalUnitData.finalStats.parry = totalUnitPoints - totalWeight + (combatTypeMod.parry || 0);
    
    const movePowerBonus = Math.ceil(totalMoveThrusters / 5); 
    const baseMove = sizeMod?.baseMove || 6;
    finalUnitData.baseValues.movePowerBonus = movePowerBonus;
    finalUnitData.baseValues.baseMove = baseMove;
    let finalMove = baseMove + weightMods.moveMod + (unitTypeMod.move || 0) + movePowerBonus;

    // Apply transformation move bonus
    if (activeForm.moveType === '前方のみ') {
        finalMove = Math.floor(finalMove * 1.5);
    }
    finalUnitData.finalStats.move = finalMove;
    
    const baseMoveEn = sizeMod?.baseMoveEn || 1;
    finalUnitData.baseValues.baseMoveEn = baseMoveEn;
    
    finalUnitData.finalStats.moveEnCost = baseMoveEn + weightMods.moveEnMod + slideValue;
    
    let energyBonus = 0;
    (finalUnitData.tanks || []).forEach(t => {
        if (t.status !== 'destroyed' && t.mountType !== 'unequipped') {
            energyBonus += (GAME_MASTER_DATA.propellantTanks[t.baseTankIndex]?.energy || 0);
        }
    });
    const baseEN = sizeMod?.baseEN || 100;
    finalUnitData.baseValues.baseEN = baseEN;
    finalUnitData.baseValues.energyBonus = energyBonus;
    finalUnitData.finalStats.maxEN = baseEN + energyBonus;
    
    // --- FIX: Correctly read currentEN from the root of the unit data object ---
    finalUnitData.finalStats.currentEN = (finalUnitData.currentEN !== undefined && finalUnitData.currentEN !== null) ? finalUnitData.currentEN : finalUnitData.finalStats.maxEN;


    // --- Calculate Final Weapon Stats ---
    (finalUnitData.weapons || []).forEach((w, index) => {
        let base;
        if (w.baseWeaponId) {
            base = GAME_MASTER_DATA.weaponMasterList.find(b => b.id === w.baseWeaponId);
        } else if (w.baseWeaponIndex !== undefined) {
            base = GAME_MASTER_DATA.weaponMasterList[w.baseWeaponIndex];
        }

        if (!base) return;

        w.finalHit = (base.hitChance || 0) + (w.isDedicated ? 10 : 0);
        
        const simultaneousAttacks = w.simultaneousAttacks || 1;
        
        let finalBaseEnCost = base.enCost || 0;
        if (base.attribute === 'ビーム') {
            finalBaseEnCost += (sizeMod.weaponEnCostMod || 0);
        }
        w.finalEnCost = Math.max(1, finalBaseEnCost) * simultaneousAttacks;
        
        const hasOwnSupply = (base.type === 'funnel' && (base.enOrAmmo || 0) > 0) || (base.attribute === '実体' && base.category === '射撃');
        if (hasOwnSupply) {
            let maxAmmo = (w.enOrAmmo !== undefined) ? w.enOrAmmo : (base.enOrAmmo || 0);
            if (base.type === 'funnel') {
                maxAmmo = maxAmmo * simultaneousAttacks;
            }
            w.finalEnOrAmmo = maxAmmo;
            if (w.currentAmmo === undefined || w.currentAmmo === null) {
                w.currentAmmo = maxAmmo;
            }
        } else {
             w.finalEnOrAmmo = 0; // Explicitly set to 0 for main body powered weapons
        }

        let damageBonus = 0;
        if (w.isDedicated) damageBonus++;
        if (w.hasLed) damageBonus++;
        damageBonus += (sizeMod.weaponDamageMod || 0);
        
        const armamentTypeMod = GAME_MASTER_DATA.armamentTypeModifiers[finalUnitData.types.armamentType];
        if (base.attribute === 'ビーム') damageBonus += armamentTypeMod.beamDmg || 0;
        if (base.attribute === '実体') damageBonus += armamentTypeMod.solidDmg || 0;
        if (base.category === '射撃') damageBonus += combatTypeMod["射撃ダメ"] || 0;
        if (base.category === '格闘') damageBonus += combatTypeMod.meleeDmg || 0;
        
        if (base.damage && base.damage.includes('+')) {
            const parts = base.damage.split('+');
            w.finalDamage = `${parts[0]}+${(parseInt(parts[1]) || 0) + damageBonus}`;
        } else {
            w.finalDamage = `${base.damage || '0'}+${damageBonus}`;
        }
        
        const numericSr = parseInt(base.sr, 10);
        w.finalSr = isNaN(numericSr) ? base.sr : numericSr;
        
        w.hasSrBonus = (finalUnitData.types.srReducedWeaponIndices || []).includes(index);

        if (w.hasSrBonus && !isNaN(numericSr)) {
            w.finalSr = Math.max(1, numericSr - (combatTypeMod.srReduce || 0));
        }
    });

    // --- Inject equipped weapons into part equipment lists for hit detection ---
    (finalUnitData.weapons || []).forEach((weapon, index) => {
        if (weapon.mountType === 'unequipped' || weapon.status === 'destroyed' || !weapon.equippedPart) return;

        let baseWeapon = GAME_MASTER_DATA.weaponMasterList.find(b => b.id === weapon.baseWeaponId);
        if (!baseWeapon) return;

        const weaponEquipmentObject = {
            name: weapon.customName,
            ap: baseWeapon.ap || 0,
            hp: baseWeapon.ap || 0, // Equipment HP is based on its AP
            dcp: baseWeapon.dcp || 0,
            status: weapon.status,
            isWeapon: true,
            weaponIndex: index
        };

        // Find the container part or large armament
        let container = finalUnitData.parts[weapon.equippedPart];
        if (!container) {
            container = (finalUnitData.largeArmaments || []).find(la => la.name === weapon.equippedPart);
        }
        if (!container) return;

        // Find the correct equipment array
        const eqType = weapon.slotType === 'internal' ? 'internalEquipment' : 'externalEquipment';
        if (!container[eqType]) {
            container[eqType] = [];
        }
        
        // Find the slot and insert/replace
        const slotIndex = (weapon.slotIndex || 1) - 1; // 1-based to 0-based
        // Ensure array is long enough
        while (container[eqType].length <= slotIndex) {
            container[eqType].push({});
        }
        container[eqType][slotIndex] = weaponEquipmentObject;
    });

    return finalUnitData;
}