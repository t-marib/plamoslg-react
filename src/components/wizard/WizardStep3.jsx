import { GAME_MASTER_DATA } from '../../data/gameData';
import { getWeightMods } from '../../utils/common';

const Input = ({ label, ...props }) => (
    <div className="h-full flex flex-col">
        {label && <label className="block text-xs text-gray-400 mb-1">{label}</label>}
        <input className="block w-full bg-gray-700/80 border-gray-600 rounded shadow-sm p-2 text-sm" {...props} />
    </div>
);
const Select = ({ label, children, ...props }) => (
    <div className="h-full flex flex-col">
        {label && <label className="block text-xs text-gray-400 mb-1">{label}</label>}
        <select className="mt-auto block w-full bg-gray-700/80 border-gray-600 rounded shadow-sm p-2 text-sm" {...props}>{children}</select>
    </div>
);
const Checkbox = ({ label, ...props }) => ( <label className="flex items-center text-sm whitespace-nowrap"><input type="checkbox" className="rounded bg-gray-700 border-gray-600 text-cyan-600 shadow-sm focus:ring-cyan-500" {...props} /><span className="ml-2 text-gray-300">{label}</span></label> );

function WizardStep3({ unitData, handleUnitDataChange }) {
    const allPartsAndArmaments = (unitData.hitLocationTable || []).map(h => h.part);

    const addWeapon = () => {
        const newWeapon = { baseWeaponId: '', customName: '', mountType: 'internal', equippedPart: '', slotIndex: 1, isDedicated: false, hasLed: false, simultaneousAttacks: 1 };
        handleUnitDataChange('weapons', [...(unitData.weapons || []), newWeapon]);
    };

    const removeWeapon = (index) => {
        handleUnitDataChange('weapons', (unitData.weapons || []).filter((_, i) => i !== index));
    };

    const addTank = () => {
        const newTank = { customName: '', baseTankIndex: '', mountType: 'internal', equippedPart: '', slotIndex: 1, isDedicated: false };
        handleUnitDataChange('tanks', [...(unitData.tanks || []), newTank]);
    };
    
    const removeTank = (index) => {
        handleUnitDataChange('tanks', (unitData.tanks || []).filter((_, i) => i !== index));
    };

    const getEquipmentForPart = (partName) => {
        const part = unitData.parts?.[partName];
        if (!part) return [];
        const slots = Array(6).fill(null);
        (part.internalEquipment || []).forEach((eq, i) => { if (i < 6) slots[i] = eq; });
        (part.externalEquipment || []).forEach((eq, i) => { if (i < 6 && !slots[i]) slots[i] = eq; });
        return slots;
    }

    // --- CALCULATIONS FOR SUMMARY BAR ---
    let totalWeight = 0;
    (unitData.weapons || []).forEach(w => {
        if (w.mountType !== 'unequipped' && w.baseWeaponId) {
            const base = GAME_MASTER_DATA.weaponMasterList.find(b => b.id === w.baseWeaponId);
            if (!base) return;
            let weight = Number(base.weight) || 0;
            const initialWeight = weight;
            if (w.isDedicated) weight -= 1;
            if (w.mountType === 'fixed_permanent') weight = Math.floor(weight / 2);
            if (w.mountType === 'internal') weight = Math.floor(weight / 3);
            const finalWeight = (initialWeight > 0) ? Math.max(1, weight) : 0;
            totalWeight += finalWeight * (w.simultaneousAttacks || 1);
        }
    });
    (unitData.tanks || []).forEach(t => {
        const base = GAME_MASTER_DATA.propellantTanks[t.baseTankIndex];
        if (t.mountType !== 'unequipped' && base) {
            let weight = base.weight || 0;
            const initialWeight = weight;
            if (t.isDedicated) weight -= 1;
            if (t.mountType === 'fixed_permanent' || t.mountType === 'fixed_exchangeable') {
                weight = Math.floor(weight / 2);
            }
            if (t.mountType === 'internal') {
                weight = Math.floor(weight / 3);
            }
            const finalWeight = (initialWeight > 0) ? Math.max(1, weight) : 0;
            totalWeight += finalWeight;
        }
    });

    let totalMoveThrusters = 0;
    let totalAttitudeThrusters = 0;
    Object.values(unitData.parts || {}).forEach(part => {
        (part.internalEquipment || []).forEach(eq => { totalMoveThrusters += eq.moveThrusters || 0; totalAttitudeThrusters += eq.attitudeThrusters || 0; });
        (part.externalEquipment || []).forEach(eq => { totalMoveThrusters += eq.moveThrusters || 0; totalAttitudeThrusters += eq.attitudeThrusters || 0; });
    });
    const slideValue = Math.floor((totalMoveThrusters + totalAttitudeThrusters) / 10);
    const weightMods = getWeightMods(totalWeight, slideValue);
    // --- END CALCULATIONS ---

    return (
        <div className="bg-gray-900 p-4 rounded-lg space-y-6">
            <h3 className="font-bold text-lg mb-3 text-cyan-400">ステップ3: 武装 & 装備設定</h3>
            {/* Weapon Section */}
            <div className="space-y-3">
                {(unitData.weapons || []).map((weapon, index) => {
                    const baseWeapon = GAME_MASTER_DATA.weaponMasterList.find(w => w.id === weapon.baseWeaponId);
                    const equippedPart = weapon.equippedPart;
                    const equipmentInPart = equippedPart ? getEquipmentForPart(equippedPart) : Array(6).fill(null);

                    let finalWeight = 0;
                    if (baseWeapon) {
                        let weight = Number(baseWeapon.weight) || 0;
                        const initialWeight = weight;
                        if (weapon.isDedicated) weight -= 1;
                        if (weapon.mountType === 'fixed_permanent') weight = Math.floor(weight / 2);
                        if (weapon.mountType === 'internal') weight = Math.floor(weight / 3);
                        finalWeight = (initialWeight > 0) ? Math.max(1, weight) : 0;
                    }

                    return (
                        <div key={index} className="p-4 bg-gray-800 rounded-lg relative">
                            <div className="flex flex-col gap-y-4">
                                {/* Row 1 */}
                                <div className="flex items-end gap-x-4">
                                    <div style={{ flex: '1 1 25%' }}><Input label="カスタム名" value={weapon.customName || ''} onChange={e => handleUnitDataChange(`weapons.${index}.customName`, e.target.value)} /></div>
                                    <div style={{ flex: '1 1 25%' }}>
                                        <Select label="基本武装" value={weapon.baseWeaponId || ''} onChange={e => handleUnitDataChange(`weapons.${index}.baseWeaponId`, e.target.value)}>
                                            <option value="">-- 選択 --</option>
                                            {GAME_MASTER_DATA.weaponMasterList.map(w => <option key={w.id} value={w.id}>{w.size} {w.attribute}{w.weaponName}</option>)}
                                        </Select>
                                    </div>
                                    <div style={{ flex: '0 1 180px' }}>
                                        <label className="block text-xs text-gray-400 mb-1">SR/DMG</label>
                                        <div className="flex gap-2">
                                            <input className="block w-1/3 bg-gray-700/50 border-gray-600 rounded shadow-sm p-2 text-sm" value={baseWeapon?.sr || ''} readOnly />
                                            <input className="block w-2/3 bg-gray-700/50 border-gray-600 rounded shadow-sm p-2 text-sm" value={baseWeapon?.damage || ''} readOnly />
                                        </div>
                                    </div>
                                    <div style={{ flex: '0 1 100px' }}><Input label="装弾数" value={baseWeapon?.enOrAmmo === 0 ? 'N/A' : baseWeapon?.enOrAmmo || 'N/A'} readOnly disabled className="bg-gray-700/50" /></div>
                                    <div style={{ flex: '0 1 120px' }}><Input type="number" label="同時回数" value={weapon.simultaneousAttacks || 1} onChange={e => handleUnitDataChange(`weapons.${index}.simultaneousAttacks`, parseInt(e.target.value) || 1)} /></div>
                                </div>
                                
                                {/* Row 2 */}
                                <div className="flex items-end gap-x-4">
                                    <div style={{ flex: '1 1 15%' }}><Select label="マウント形式" value={weapon.mountType || 'internal'} onChange={e => handleUnitDataChange(`weapons.${index}.mountType`, e.target.value)}><option value="handheld">手持</option><option value="fixed_exchangeable">固定(換)</option><option value="fixed_permanent">固定(永)</option><option value="internal">内蔵</option><option value="unequipped">未装備</option></Select></div>
                                    <div style={{ flex: '1 1 15%' }}><Select label="搭載部位" value={weapon.equippedPart || ''} onChange={e => handleUnitDataChange(`weapons.${index}.equippedPart`, e.target.value)}><option value="">-- 未装備 --</option>{allPartsAndArmaments.map(p => <option key={p} value={p}>{p}</option>)}</Select></div>
                                    <div style={{ flex: '1 1 35%' }}>
                                        <Select label="スロット" value={weapon.slotIndex || 1} onChange={e => handleUnitDataChange(`weapons.${index}.slotIndex`, parseInt(e.target.value) || 1)}>
                                            {[1,2,3,4,5,6].map(i => <option key={i} value={i}>{i}: {equipmentInPart[i-1]?.name || '空き'}</option>)}
                                        </Select>
                                    </div>
                                    <div style={{ flex: '1 1 20%' }} className="flex flex-row items-center justify-start gap-4 h-full pb-1">
                                        <Checkbox label="専用" checked={weapon.isDedicated || false} onChange={e => handleUnitDataChange(`weapons.${index}.isDedicated`, e.target.checked)} />
                                        <Checkbox label="LED" checked={weapon.hasLed || false} onChange={e => handleUnitDataChange(`weapons.${index}.hasLed`, e.target.checked)} />
                                    </div>
                                    <div style={{ flex: '1 1 15%' }}><Input label="重量" value={finalWeight} readOnly disabled className="bg-gray-700/50" /></div>
                                </div>
                            </div>
                            <button onClick={() => removeWeapon(index)} className="absolute top-3 right-3 text-red-500 hover:text-red-400 font-bold text-2xl leading-none">×</button>
                        </div>
                    );
                })}
            </div>
            <button onClick={addWeapon} className="mt-3 bg-blue-600 hover:bg-blue-500 font-bold py-2 px-4 rounded-md">+ 武装を追加</button>
            
            {/* Tank Section */}
            <div>
                <h4 className="font-bold text-md mb-2 text-green-300">プロペラントタンク</h4>
                <div className="space-y-3">
                    {(unitData.tanks || []).map((tank, index) => {
                        const baseTank = GAME_MASTER_DATA.propellantTanks[tank.baseTankIndex];
                        const equippedPart = tank.equippedPart;
                        const equipmentInPart = equippedPart ? getEquipmentForPart(equippedPart) : Array(6).fill(null);

                        let finalWeight = 0;
                        if (baseTank) {
                            let weight = baseTank.weight || 0;
                            const initialWeight = weight;
                            if (tank.isDedicated) weight -= 1;
                            if (tank.mountType === 'fixed_permanent' || tank.mountType === 'fixed_exchangeable') weight = Math.floor(weight / 2);
                            if (tank.mountType === 'internal') weight = Math.floor(weight / 3);
                            finalWeight = (initialWeight > 0) ? Math.max(1, weight) : 0;
                        }

                        return (
                            <div key={index} className="p-4 bg-gray-800 rounded-lg relative">
                                <div className="flex items-end gap-x-4">
                                    <div style={{ flex: '1 1 20%' }}><Input label="カスタム名" value={tank.customName || ''} onChange={e => handleUnitDataChange(`tanks.${index}.customName`, e.target.value)} /></div>
                                    <div style={{ flex: '1 1 20%' }}>
                                        <Select label="タンク種別" value={tank.baseTankIndex === undefined ? '' : tank.baseTankIndex} onChange={e => handleUnitDataChange(`tanks.${index}.baseTankIndex`, e.target.value !== '' ? parseInt(e.target.value) : '')}>
                                            <option value="">-- 選択 --</option>{GAME_MASTER_DATA.propellantTanks.map((t, i) => <option key={i} value={i}>{t.name}</option>)}
                                        </Select>
                                    </div>
                                    <div style={{ flex: '0 1 100px' }}><Input label="エネルギー" value={baseTank ? `+${baseTank.energy}` : ''} readOnly disabled className="bg-gray-700/50" /></div>
                                    <div style={{ flex: '1 1 15%' }}><Select label="装備方法" value={tank.mountType || 'internal'} onChange={e => handleUnitDataChange(`tanks.${index}.mountType`, e.target.value)}><option value="internal">内蔵</option><option value="fixed_exchangeable">固定(換)</option><option value="fixed_permanent">固定(永)</option></Select></div>
                                    <div style={{ flex: '1 1 35%' }}>
                                        <label className="block text-xs text-gray-400 mb-1">搭載部位/スロット</label>
                                        <div className="flex gap-2">
                                            <select className="mt-auto block w-2/3 bg-gray-700/80 border-gray-600 rounded shadow-sm p-2 text-sm" value={tank.equippedPart || ''} onChange={e => handleUnitDataChange(`tanks.${index}.equippedPart`, e.target.value)}><option value="">-- 部位 --</option>{allPartsAndArmaments.map(p => <option key={p} value={p}>{p}</option>)}</select>
                                            <select className="mt-auto block w-1/3 bg-gray-700/80 border-gray-600 rounded shadow-sm p-2 text-sm" value={tank.slotIndex || 1} onChange={e => handleUnitDataChange(`tanks.${index}.slotIndex`, parseInt(e.target.value) || 1)}>{[1,2,3,4,5,6].map(i => <option key={i} value={i}>{i}: {equipmentInPart[i-1]?.name || '空き'}</option>)}</select>
                                        </div>
                                    </div>
                                    <div style={{ flex: '0 1 80px' }} className="flex items-center h-full pb-1 pt-5">
                                        <Checkbox label="専用" checked={tank.isDedicated || false} onChange={e => handleUnitDataChange(`tanks.${index}.isDedicated`, e.target.checked)} />
                                    </div>
                                    <div style={{ flex: '0 1 80px' }}><Input label="重量" value={finalWeight} readOnly disabled className="bg-gray-700/50" /></div>
                                </div>
                                <button onClick={() => removeTank(index)} className="absolute top-3 right-3 text-red-500 hover:text-red-400 font-bold text-2xl leading-none">×</button>
                            </div>
                        );
                    })}
                 </div>
                 <button onClick={addTank} className="mt-3 bg-green-600 hover:bg-green-500 font-bold py-2 px-4 rounded-md">+ タンクを追加</button>
            </div>
            
            {/* Summary Bar */}
            <div className="mt-4 p-3 bg-gray-950 rounded-lg flex justify-around text-center">
                <div>
                    <p className="text-sm text-gray-400">武装・装備 重量合計</p>
                    <p className="text-xl font-bold text-red-400">{totalWeight}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-400">スライド値</p>
                    <p className="text-xl font-bold text-blue-400">{slideValue}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-400">スライド補正(回避)</p>
                    <p className="text-xl font-bold text-green-400">{weightMods.evadeMod >= 0 ? `+${weightMods.evadeMod}` : weightMods.evadeMod}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-400">スライド補正(移動)</p>
                    <p className="text-xl font-bold text-yellow-400">{weightMods.moveMod >= 0 ? `+${weightMods.moveMod}` : weightMods.moveMod}</p>
                </div>
            </div>
        </div>
    );
}

export default WizardStep3;