import { GAME_MASTER_DATA } from '../../data/gameData.js';
import { calculateAllFinalStats } from '../../utils/common.js';

function WizardStep5({ unitData }) {
    const finalUnitData = calculateAllFinalStats(unitData);
    const { finalStats, baseValues, parts, weapons, types } = finalUnitData;

    const formatMod = (num) => (num >= 0 ? `+${num}` : num);
    const movePerSr = Math.ceil(finalStats.move / 10);

    const hitLocationTableForPoints = finalUnitData.hitLocationTable ? [...finalUnitData.hitLocationTable] : [...GAME_MASTER_DATA.defaultHitLocationTable];
    hitLocationTableForPoints.sort((a, b) => b.range[0] - a.range[0]);
    
    const pointBreakdownParts = [];
    hitLocationTableForPoints.forEach(hitLocation => {
        const partData = parts[hitLocation.part];
        if (partData && (partData.hp > 0 || partData.maxHp > 0) && partData.unitPoints > 0) {
            pointBreakdownParts.push(`${hitLocation.part}: ${partData.unitPoints}`);
        }
    });
    const pointBreakdown = pointBreakdownParts.length > 0 ? pointBreakdownParts.join(' + ') : '有効な部位ポイントなし';
    
    return (
        <div className="bg-gray-900 p-4 rounded-lg text-gray-800">
            <h3 className="font-bold text-lg mb-3 text-cyan-400">ステップ5: 確認 & 保存</h3>
            <div className="bg-white p-4 rounded-lg shadow-lg max-h-[60vh] overflow-y-auto">
                <header className="text-center mb-4">
                    <h1 className="text-3xl font-bold">{finalUnitData.name}</h1>
                    <p className="text-md text-gray-600">ビルダー: {finalUnitData.builder}</p>
                </header>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center mb-4 text-sm">
                    <div className="bg-gray-100 p-2 rounded"><strong>機体タイプ:</strong> {types.unitType}</div>
                    <div className="bg-gray-100 p-2 rounded"><strong>機体サイズ:</strong> {types.size}</div>
                    <div className="bg-gray-100 p-2 rounded"><strong>戦闘タイプ:</strong> {types.combatType}</div>
                    <div className="bg-gray-100 p-2 rounded"><strong>武装タイプ:</strong> {types.armamentType}</div>
                    <div className="bg-gray-100 p-2 rounded"><strong>移動タイプ:</strong> {finalStats.activeMoveType}</div>
                </div>

                <h2 className="text-xl font-bold border-b-2 border-gray-300 pb-1 mb-2">基本性能 ({finalStats.activeFormName})</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div className="bg-gray-100 p-2 rounded"><div className="flex justify-between items-baseline"><p>機体ポイント</p><p className="text-xl font-bold">{baseValues.unitPointsTotal}</p></div><p className="text-xs text-gray-600 text-right">({pointBreakdown})</p></div>
                    <div className="bg-gray-100 p-2 rounded"><div className="flex justify-between items-baseline"><p>EN</p><p className="text-xl font-bold">{finalStats.currentEN} / {finalStats.maxEN}</p></div><p className="text-xs text-gray-600 text-right">(基本EN {baseValues.baseEN ?? 0} {formatMod(baseValues.energyBonus ?? 0)}[タンク])</p></div>
                    <div className="bg-gray-100 p-2 rounded"><div className="flex justify-between items-baseline"><p>移動力 (1ターン)</p><p className="text-xl font-bold">{finalStats.move}</p></div><p className="text-xs text-gray-600 text-right">(基本 {baseValues.baseMove ?? 0} {formatMod(baseValues.weightMods?.moveMod ?? 0)}[スライド] {formatMod(baseValues.unitTypeMod?.move ?? 0)}[機体] {formatMod(baseValues.movePowerBonus ?? 0)}[スラスター])</p></div>
                    <div className="bg-gray-100 p-2 rounded"><div className="flex justify-between items-baseline"><p>移動力 (1SR)</p><p className="text-xl font-bold">{movePerSr}</p></div></div>
                    <div className="bg-gray-100 p-2 rounded"><div className="flex justify-between items-baseline"><p>回避</p><p className="text-xl font-bold">{finalStats.evade}%</p></div><p className="text-xs text-gray-600 text-right">(機体P {baseValues.unitPointsTotal ?? 0} - 総重量 {baseValues.totalWeight ?? 0} {formatMod(baseValues.weightMods?.evadeMod ?? 0)}[スライド] {formatMod(baseValues.attitudeThrustersTotal ?? 0)}[姿勢S] {formatMod(baseValues.unitTypeMod?.evade ?? 0)}[機体])</p></div>
                    <div className="bg-gray-100 p-2 rounded"><div className="flex justify-between items-baseline"><p>受け</p><p className="text-xl font-bold">{finalStats.parry}%</p></div><p className="text-xs text-gray-600 text-right">(機体P {baseValues.unitPointsTotal ?? 0} - 総重量 {baseValues.totalWeight ?? 0} {formatMod(baseValues.combatTypeMod?.parry ?? 0)}[戦闘])</p></div>
                    <div className="bg-gray-100 p-2 rounded"><div className="flex justify-between items-baseline"><p>射撃命中(基本)</p><p className="text-xl font-bold">{finalStats.baseShootingHit}%</p></div><p className="text-xs text-gray-600 text-right">(機体P {baseValues.unitPointsTotal ?? 0} - 総重量 {baseValues.totalWeight ?? 0} {formatMod(baseValues.combatTypeMod?.shootHit ?? 0)}[戦闘])</p></div>
                    <div className="bg-gray-100 p-2 rounded"><div className="flex justify-between items-baseline"><p>格闘命中(基本)</p><p className="text-xl font-bold">{finalStats.baseMeleeHit}%</p></div><p className="text-xs text-gray-600 text-right">(機体P {baseValues.unitPointsTotal ?? 0} - 総重量 {baseValues.totalWeight ?? 0} {formatMod(baseValues.combatTypeMod?.meleeHit ?? 0)}[戦闘])</p></div>
                </div>

                <h2 className="text-xl font-bold border-b-2 border-gray-300 pb-1 mb-2 mt-4">武装リスト</h2>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-200"><th className="border px-2 py-1" rowSpan="2">カスタム名</th><th className="border px-2 py-1" rowSpan="2">ダメージ</th><th className="border px-2 py-1" rowSpan="2">SR</th><th className="border px-2 py-1" rowSpan="2">消費/容量</th><th className="border px-2 py-1" colSpan="4">命中率</th><th className="border px-2 py-1" rowSpan="2">特殊効果</th></tr>
                        <tr className="bg-gray-100"><th className="border px-2 py-1 text-xs">近</th><th className="border px-2 py-1 text-xs">中</th><th className="border px-2 py-1 text-xs">遠</th><th className="border px-2 py-1 text-xs">超遠</th></tr>
                    </thead>
                    <tbody>
                        {(weapons || []).map((w, i) => {
                            const base = GAME_MASTER_DATA.weaponMasterList.find(b => b.id === w.baseWeaponId);
                            if (!base) return <tr key={i}><td colSpan="10" className="text-red-500">武装データエラー</td></tr>;
                            const hitChance = (rangeBonus) => {
                                if (rangeBonus === -999) return '-';
                                const baseHit = base.category === '射撃' ? finalStats.baseShootingHit : finalStats.baseMeleeHit;
                                return `${baseHit + w.finalHit + rangeBonus}%`;
                            };
                             let consumptionHtml = <div className="text-center text-gray-400">-</div>;
                            if (base.attribute === 'ビーム') {
                                const capacityText = w.finalEnOrAmmo > 0 ? `EN容量: ${w.currentAmmo}/${w.finalEnOrAmmo}` : '供給: 本体';
                                consumptionHtml = <><div className="text-xs text-left">消費EN: {w.finalEnCost}</div><div className="text-xs text-left">{capacityText}</div></>;
                            } else if (base.attribute === '実体' && base.category === '射撃') {
                                consumptionHtml = <><div className="text-xs text-left">消費弾数: {base.enCost}</div><div className="text-xs text-left">装弾数: {w.currentAmmo}/{w.finalEnOrAmmo}</div></>;
                            }
                            return (
                                <tr key={i}>
                                    <td className="border px-2 py-1 font-semibold">{w.customName}</td><td className="border px-2 py-1 text-center">{w.finalDamage}</td><td className="border px-2 py-1 text-center">{w.finalSr}</td><td className="border px-2 py-1">{consumptionHtml}</td>
                                    <td className="border px-2 py-1 text-center">{hitChance(base.range.near)}</td><td className="border px-2 py-1 text-center">{hitChance(base.range.mid)}</td><td className="border px-2 py-1 text-center">{hitChance(base.range.far)}</td><td className="border px-2 py-1 text-center">{hitChance(base.range.vfar)}</td>
                                    <td className="border px-2 py-1 text-xs">{base.specialEffect || 'なし'}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <p className="text-sm text-yellow-400 mt-4">上記の内容で保存します。よろしいですか？</p>
        </div>
    );
}

export default WizardStep5;