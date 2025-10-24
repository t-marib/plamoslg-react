import { useState, useEffect } from 'react';
import { GAME_MASTER_DATA } from '../data/gameData';
import { calculateAllFinalStats } from '../utils/common';
import { db } from '../firebase/firebase';
import { doc, updateDoc } from 'firebase/firestore';

const Select = ({ label, children, ...props }) => ( <label className="block text-sm"><span className="text-gray-400">{label}</span><select className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm p-2" {...props}>{children}</select></label> );
const Checkbox = ({ label, ...props }) => ( <label className="flex items-center text-sm p-1 rounded hover:bg-gray-800 cursor-pointer"><input type="checkbox" className="h-5 w-5 bg-gray-600 border-gray-500 text-green-500 rounded focus:ring-green-500" {...props} /><span className="ml-2 text-gray-300">{label}</span></label> );

function UnitCustomizationModal({ isOpen, onClose, unit: originalUnit, gameId, user, onJoin }) {
    const [playerName, setPlayerName] = useState('');
    const [customizedUnit, setCustomizedUnit] = useState(originalUnit);
    
    // Recalculate stats when customization changes
    const originalStats = calculateAllFinalStats(originalUnit).finalStats;
    const newStats = calculateAllFinalStats(customizedUnit).finalStats;

    useEffect(() => {
        setCustomizedUnit(originalUnit); // Reset customization when a new unit is selected
    }, [originalUnit]);

    if (!isOpen) return null;

    const handleTypeChange = (type, value) => {
        setCustomizedUnit(prev => ({ ...prev, types: { ...prev.types, [type]: value } }));
    };

    const handleWeaponToggle = (index, isEquipped) => {
        const newWeapons = [...customizedUnit.weapons];
        if (isEquipped) {
            newWeapons[index].mountType = newWeapons[index].originalMountType || 'handheld';
        } else {
            newWeapons[index].originalMountType = newWeapons[index].mountType;
            newWeapons[index].mountType = 'unequipped';
        }
        setCustomizedUnit(prev => ({ ...prev, weapons: newWeapons }));
    };
    
    const handleJoinGame = async () => {
        if (!playerName.trim()) {
            alert('プレイヤー名を入力してください。');
            return;
        }
        try {
            const unitRef = doc(db, 'plamo-slg', gameId, 'units', originalUnit.id);
            await updateDoc(unitRef, {
                playerId: user.uid,
                player: playerName,
                types: customizedUnit.types,
                weapons: customizedUnit.weapons,
                tanks: customizedUnit.tanks, // Assuming tanks might be customizable too
            });
            onJoin(originalUnit.id);
        } catch (error) {
            console.error("ゲームへの参加に失敗しました:", error);
            alert("ゲームへの参加に失敗しました。");
        }
    };

    const formatChange = (original, current) => {
        const diff = current - original;
        if (diff === 0) return <span className="text-gray-400">(±0)</span>;
        if (diff > 0) return <span className="text-green-400">(+{diff})</span>;
        return <span className="text-red-400">({diff})</span>;
    };

    const StatLine = ({ label, original, current, suffix = '' }) => (
        <div className="flex justify-between">
            <div className="text-gray-400">{label}</div>
            <div className="font-mono">{original}{suffix} → {current}{suffix} {formatChange(original, current)}</div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 p-6 rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <h3 className="text-xl font-bold mb-4 text-green-400">機体カスタマイズ & 参加</h3>
                <div className="bg-gray-800 p-3 rounded mb-4">
                    <p className="font-bold text-lg text-white">{originalUnit.name}</p>
                    <p className="text-sm text-gray-400">ビルダー: {originalUnit.builder || 'N/A'}</p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300">プレイヤー名</label>
                        <input type="text" value={playerName} onChange={e => setPlayerName(e.target.value)} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm p-2" />
                    </div>

                    <div className="p-3 bg-gray-800 rounded">
                        <h4 className="font-semibold mb-2">性能プレビュー</h4>
                        <div className="text-sm space-y-1">
                            <StatLine label="回避" original={originalStats.evade} current={newStats.evade} suffix="%" />
                            <StatLine label="受け" original={originalStats.parry} current={newStats.parry} suffix="%" />
                            <StatLine label="移動力" original={originalStats.move} current={newStats.move} />
                            <StatLine label="射撃命中" original={originalStats.baseShootingHit} current={newStats.baseShootingHit} suffix="%" />
                            <StatLine label="格闘命中" original={originalStats.baseMeleeHit} current={newStats.baseMeleeHit} suffix="%" />
                        </div>
                    </div>

                    <Select label="機体タイプ" value={customizedUnit.types.unitType} onChange={e => handleTypeChange('unitType', e.target.value)}>
                        {Object.keys(GAME_MASTER_DATA.unitTypeModifiers).map(t => <option key={t} value={t}>{t}</option>)}
                    </Select>
                    <Select label="戦闘タイプ" value={customizedUnit.types.combatType} onChange={e => handleTypeChange('combatType', e.target.value)}>
                        {Object.keys(GAME_MASTER_DATA.combatTypeModifiers).map(t => <option key={t} value={t}>{t}</option>)}
                    </Select>
                    <Select label="武装タイプ" value={customizedUnit.types.armamentType} onChange={e => handleTypeChange('armamentType', e.target.value)}>
                        {Object.keys(GAME_MASTER_DATA.armamentTypeModifiers).map(t => <option key={t} value={t}>{t}</option>)}
                    </Select>

                    <div>
                        <h4 className="font-semibold mb-2 text-gray-400">武装選択</h4>
                        <div className="bg-gray-800 p-2 rounded space-y-1 max-h-40 overflow-y-auto">
                           {(customizedUnit.weapons || []).map((w, index) => (
                               <Checkbox key={index} label={w.customName} checked={w.mountType !== 'unequipped'} onChange={e => handleWeaponToggle(index, e.target.checked)} />
                           ))}
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-4">
                    <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 font-bold py-2 px-4 rounded">キャンセル</button>
                    <button onClick={handleJoinGame} className="bg-green-600 hover:bg-green-500 font-bold py-2 px-4 rounded">この設定で参加</button>
                </div>
            </div>
        </div>
    );
}

export default UnitCustomizationModal;