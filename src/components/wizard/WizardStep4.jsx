import { GAME_MASTER_DATA } from '../../data/gameData';

const Select = ({ label, children, ...props }) => ( <label className="block text-sm"><span className="text-gray-400">{label}</span><select className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm p-2" {...props}>{children}</select></label> );
const Checkbox = ({ label, ...props }) => ( <label className="flex items-center text-sm"><input type="checkbox" className="rounded bg-gray-700 border-gray-600 text-cyan-600 shadow-sm focus:ring-cyan-500" {...props} /><span className="ml-2 text-gray-300">{label}</span></label> );

// Component to display modifiers for a selected type
const ModifierDisplay = ({ selectedType, modifierData, labels, colorClass }) => {
    const mods = modifierData[selectedType];
    if (!mods) return null;

    const modStrings = Object.entries(mods)
        .map(([key, value]) => {
            if (value === 0) return null;
            const label = labels[key] || key;
            const sign = value > 0 ? '+' : '';
            const suffix = (key.includes('Hit') || key.includes('parry') || key.includes('evade')) ? '%' : '';
            if (key === 'srReduce') return `${label}: -${value}`;
            return `${label}: ${sign}${value}${suffix}`;
        })
        .filter(Boolean); // remove nulls

    if (modStrings.length === 0) {
        return <div className="text-sm text-gray-500 p-2 mt-2 bg-gray-900/50 rounded min-h-[8rem] flex items-center justify-center">補正なし</div>;
    }

    return (
        <div className={`text-sm ${colorClass} p-2 mt-2 bg-gray-900/50 rounded min-h-[8rem]`}>
            {modStrings.map((str, i) => <div key={i}>{str}</div>)}
        </div>
    );
};


function WizardStep4({ unitData, handleUnitDataChange }) {
    const combatType = unitData.types?.combatType || '汎用型';
    const showSrReduction = combatType === '格闘型' || combatType === '射撃型';

    const handleSrReductionChange = (weaponIndex, isChecked) => {
        const currentIndices = unitData.types?.srReducedWeaponIndices || [];
        let newIndices;
        if (isChecked) {
            newIndices = [...currentIndices, weaponIndex];
        } else {
            newIndices = currentIndices.filter(i => i !== weaponIndex);
        }
        handleUnitDataChange('types.srReducedWeaponIndices', newIndices);
    };

    const unitTypeLabels = { ap: 'AP', hp: 'HP', moveEn: '移動EN', evade: '回避', move: '移動力' };
    const combatTypeLabels = { meleeMove: '格闘移動', meleeDmg: '格闘ダメ', srReduce: 'SR減少', shootHit: '射撃命中', meleeHit: '格闘命中', parry: '受け', '射撃ダメ': '射撃ダメ' };
    const armamentTypeLabels = { beamDmg: 'ビームダメ', solidDmg: '実体ダメ' };


    return (
        <div className="bg-gray-900 p-4 rounded-lg space-y-6">
            <h3 className="font-bold text-lg mb-3 text-cyan-400">ステップ4: タイプ設定</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <Select label="機体タイプ" value={unitData.types?.unitType} onChange={e => handleUnitDataChange('types.unitType', e.target.value)}>
                        {Object.keys(GAME_MASTER_DATA.unitTypeModifiers).map(t => <option key={t} value={t}>{t}</option>)}
                    </Select>
                    <ModifierDisplay selectedType={unitData.types?.unitType} modifierData={GAME_MASTER_DATA.unitTypeModifiers} labels={unitTypeLabels} colorClass="text-cyan-300" />
                </div>
                <div>
                    <Select label="戦闘タイプ" value={unitData.types?.combatType} onChange={e => handleUnitDataChange('types.combatType', e.target.value)}>
                        {Object.keys(GAME_MASTER_DATA.combatTypeModifiers).map(t => <option key={t} value={t}>{t}</option>)}
                    </Select>
                    <ModifierDisplay selectedType={unitData.types?.combatType} modifierData={GAME_MASTER_DATA.combatTypeModifiers} labels={combatTypeLabels} colorClass="text-green-300" />
                </div>
                <div>
                    <Select label="武装タイプ" value={unitData.types?.armamentType} onChange={e => handleUnitDataChange('types.armamentType', e.target.value)}>
                         {Object.keys(GAME_MASTER_DATA.armamentTypeModifiers).map(t => <option key={t} value={t}>{t}</option>)}
                    </Select>
                    <ModifierDisplay selectedType={unitData.types?.armamentType} modifierData={GAME_MASTER_DATA.armamentTypeModifiers} labels={armamentTypeLabels} colorClass="text-yellow-300" />
                </div>
            </div>

            {showSrReduction && (
                <div className="mt-4">
                    <h4 className="font-bold text-md mb-2 text-yellow-400">SR-1 ボーナス武装選択</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 bg-gray-800 rounded">
                        {(unitData.weapons || []).map((weapon, index) => {
                            if (!weapon.customName) return null;
                            const baseWeapon = GAME_MASTER_DATA.weaponMasterList.find(w => w.id === weapon.baseWeaponId);
                            if(!baseWeapon || isNaN(parseInt(baseWeapon.sr, 10))) return null;

                            return (
                                <Checkbox 
                                    key={index}
                                    label={weapon.customName}
                                    checked={(unitData.types?.srReducedWeaponIndices || []).includes(index)}
                                    onChange={e => handleSrReductionChange(index, e.target.checked)}
                                />
                            );
                        })}
                        {(unitData.weapons || []).filter(w => w.customName).length === 0 && <p className="text-gray-500 col-span-full">武装をステップ3で追加してください。</p>}
                    </div>
                </div>
            )}
        </div>
    );
}

export default WizardStep4;