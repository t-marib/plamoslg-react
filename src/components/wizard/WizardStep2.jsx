import { useState } from 'react';
import { GAME_MASTER_DATA } from '../../data/gameData';

// Reusable UI Components for this step
const Input = ({ ...props }) => <input className="block w-full bg-gray-700/50 border-gray-600 rounded-md shadow-sm p-1 text-sm text-center" {...props} />;
const Select = ({ children, ...props }) => <select className="block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm p-1.5 text-sm" {...props}>{children}</select>;

// A single row in the equipment grid
const EquipmentRow = ({ equipment, onDataChange, index }) => {
    const eq = equipment || {}; // Handle empty slots
    
    const handleInputChange = (field, value) => {
        const newEq = equipment ? {...equipment} : { name: '', ap: 0, hp: 0, moveThrusters: 0, attitudeThrusters: 0 };
        newEq[field] = value;
        onDataChange(newEq);
    };

    const handleRemove = () => {
        onDataChange(null); // Set to null to effectively delete
    }

    return (
        <tr>
            <td className="p-1 text-center text-gray-400">{index + 1}.</td>
            <td className="p-1"><Input placeholder="-" value={eq.name || ''} onChange={e => handleInputChange('name', e.target.value)} /></td>
            <td className="p-1"><Input type="number" placeholder="0" value={eq.ap || ''} onChange={e => handleInputChange('ap', parseInt(e.target.value) || 0)} /></td>
            <td className="p-1"><Input type="number" placeholder="0" value={eq.hp || ''} onChange={e => handleInputChange('hp', parseInt(e.target.value) || 0)} /></td>
            <td className="p-1"><Input type="number" placeholder="0" value={eq.moveThrusters || ''} onChange={e => handleInputChange('moveThrusters', parseInt(e.target.value) || 0)} /></td>
            <td className="p-1"><Input type="number" placeholder="0" value={eq.attitudeThrusters || ''} onChange={e => handleInputChange('attitudeThrusters', parseInt(e.target.value) || 0)} /></td>
            <td className="p-1 text-center">
                {equipment && <button onClick={handleRemove} className="text-red-500 hover:text-red-400 font-bold">×</button>}
            </td>
        </tr>
    );
};

// The 6-slot equipment grid
const EquipmentGrid = ({ title, equipmentData = [], path, onDataChange }) => {
    const slots = Array(6).fill(null);
    (equipmentData || []).forEach((eq, i) => { if(i < 6) slots[i] = eq });
    
    const addEquipment = () => {
        const currentList = equipmentData || [];
        if(currentList.length >= 6) return;
        onDataChange(path, [...currentList, { name: '', ap: 0, hp: 0, moveThrusters: 0, attitudeThrusters: 0 }]);
    };

    const handleSlotChange = (index, value) => {
        const newData = [...slots];
        newData[index] = value;
        onDataChange(path, newData.filter(item => item));
    };

    return (
        <div>
            <h5 className="font-semibold text-gray-400 mb-2">{title} (6スロット)</h5>
            <table className="w-full border-collapse text-xs table-fixed">
                <thead>
                    <tr className="bg-gray-900/50 text-gray-400 font-normal">
                        <th className="p-1 w-8">#</th><th className="p-1">装備名</th><th className="p-1 w-12">AP</th><th className="p-1 w-12">HP</th><th className="p-1 w-12">移</th><th className="p-1 w-12">姿</th><th className="p-1 w-8"></th>
                    </tr>
                </thead>
                <tbody>
                    {slots.map((eq, i) => (
                        <EquipmentRow
                            key={i} index={i} equipment={eq}
                            onDataChange={(value) => handleSlotChange(i, value)}
                        />
                    ))}
                </tbody>
            </table>
            <button onClick={addEquipment} className="mt-2 text-xs bg-gray-600 hover:bg-gray-500 py-1 px-2 rounded">+ スロットに追加</button>
        </div>
    );
};

// Editor for a standard body part or a large armament
const PartEditor = ({ partName, partData, allParts, size, unitType, onDataChange, isLargeArmament = false }) => {
    const [copySource, setCopySource] = useState('');
    const hitLocation = partData.hitLocation || {};
    const basePartForStats = isLargeArmament ? '胸部' : hitLocation.basePartForStats || partName;
    const baseStats = GAME_MASTER_DATA.sizeBasedStats[size]?.parts[basePartForStats] || { ap: 0, hp: 0 };
    
    const finalAP = baseStats.ap;
    const finalHP = baseStats.hp;

    const moveTotal = [...(partData.internalEquipment || []), ...(partData.externalEquipment || [])].reduce((sum, eq) => sum + (eq.moveThrusters || 0), 0);
    const attitudeTotal = [...(partData.internalEquipment || []), ...(partData.externalEquipment || [])].reduce((sum, eq) => sum + (eq.attitudeThrusters || 0), 0);
    const dcp = 5 + Math.floor((moveTotal + attitudeTotal) / 5);

    const handleCopy = () => {
        if (!copySource) return;
        const sourcePart = allParts[copySource];
        if (sourcePart && window.confirm(`「${copySource}」の装備を「${partName}」に上書きコピーします。よろしいですか？`)) {
            const internalCopy = JSON.parse(JSON.stringify(sourcePart.internalEquipment || []));
            const externalCopy = JSON.parse(JSON.stringify(sourcePart.externalEquipment || []));
            onDataChange(`parts.${partName}.internalEquipment`, internalCopy);
            onDataChange(`parts.${partName}.externalEquipment`, externalCopy);
        }
    };

    return (
        <div className="bg-gray-800 p-4 rounded-lg space-y-4">
            <div className="flex justify-between items-center">
                <h4 className={`text-lg font-bold ${isLargeArmament ? 'text-yellow-300' : 'text-cyan-300'}`}>{partName}</h4>
                <div className="flex items-center gap-2">
                    <Select value={copySource} onChange={e => setCopySource(e.target.value)}>
                        <option value="">-- コピー元 --</option>
                        {Object.keys(allParts).filter(pName => pName !== partName).map(pName => <option key={pName} value={pName}>{pName}</option>)}
                    </Select>
                    {/* *** MODIFICATION: Added whitespace-nowrap and increased padding *** */}
                    <button onClick={handleCopy} className="text-sm bg-cyan-600 hover:bg-cyan-500 py-1 px-4 rounded whitespace-nowrap">コピー</button>
                </div>
            </div>
            <div>
                <h5 className="font-semibold text-gray-400 mb-1 text-sm">部位本体</h5>
                <div className="grid grid-cols-5 gap-2 text-center bg-gray-900/70 p-2 rounded">
                    <div><span className="text-xs text-gray-500">AP</span><p className="font-bold">{finalAP}</p></div>
                    <div><span className="text-xs text-gray-500">HP</span><p className="font-bold">{finalHP}</p></div>
                    <div><span className="text-xs text-gray-500">DCP</span><p className="font-bold">{dcp}</p></div>
                    <div><span className="text-xs text-gray-500">移(合計)</span><p className="font-bold">{moveTotal}</p></div>
                    <div><span className="text-xs text-gray-500">姿(合計)</span><p className="font-bold">{attitudeTotal}</p></div>
                </div>
            </div>
            <EquipmentGrid title="内蔵装備" equipmentData={partData.internalEquipment} path={`parts.${partName}.internalEquipment`} onDataChange={onDataChange} />
            <EquipmentGrid title="外付装備" equipmentData={partData.externalEquipment} path={`parts.${partName}.externalEquipment`} onDataChange={onDataChange} />
        </div>
    );
};

// Main Component for Step 2
function WizardStep2({ unitData, handleUnitDataChange }) {
    const mainBodyParts = (unitData.hitLocationTable || []).filter(h => !h.isLargeArmament);
    const largeArmaments = (unitData.hitLocationTable || []).filter(h => h.isLargeArmament);

    return (
        <div className="bg-gray-900 p-4 rounded-lg space-y-6">
            <h3 className="font-bold text-lg mb-3 text-cyan-400">ステップ2: 装備スロット設定</h3>
            <p className="text-sm text-gray-400 -mt-4">各部位のAP/HPはサイズから自動計算されます。ここでは各部位の装備を設定します。</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {mainBodyParts.map((hitLocation) => (
                    <PartEditor
                        key={hitLocation.part}
                        partName={hitLocation.part}
                        partData={{ ...(unitData.parts?.[hitLocation.part] || {}), hitLocation: hitLocation }}
                        allParts={unitData.parts}
                        size={unitData.types.size}
                        unitType={unitData.types.unitType}
                        onDataChange={handleUnitDataChange}
                    />
                ))}
            </div>

            {largeArmaments.length > 0 && (
                <div className="mt-8">
                     <h3 className="font-bold text-lg mb-3 text-yellow-300">大型武装</h3>
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {largeArmaments.map((hitLocation) => (
                            <PartEditor
                                key={hitLocation.part}
                                partName={hitLocation.part}
                                partData={{ ...(unitData.parts?.[hitLocation.part] || {}), hitLocation: hitLocation }}
                                allParts={unitData.parts}
                                size={hitLocation.size || unitData.types.size}
                                unitType={unitData.types.unitType}
                                onDataChange={handleUnitDataChange}
                                isLargeArmament={true}
                            />
                        ))}
                     </div>
                </div>
            )}
        </div>
    );
}

export default WizardStep2;