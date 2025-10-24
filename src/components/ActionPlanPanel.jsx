import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase/firebase.js';
import { doc, updateDoc } from 'firebase/firestore';
import { GAME_MASTER_DATA } from '../data/gameData.js';
import { calculateSrCostFromData } from '../utils/common.js';

function ActionPlanPanel({ unit, gameId }) {
    const [plan, setPlan] = useState(unit.actionPlan || {});

    // ユニットデータが外部から更新された場合（例：リセット後）にローカルステートを同期する
    useEffect(() => {
        setPlan(unit.actionPlan || {});
    }, [unit.actionPlan]);

    const handlePlanChange = useCallback((sr, field, value) => {
        setPlan(prevPlan => {
            const newPlan = JSON.parse(JSON.stringify(prevPlan));
            if (!newPlan[sr]) {
                newPlan[sr] = { action: '---' };
            }
            newPlan[sr][field] = value;
            if (field === 'action') {
                delete newPlan[sr].weaponIndex;
                delete newPlan[sr].multiWeaponIndices;
                delete newPlan[sr].weaponIndices; // ファンネル展開用もリセット
            }
            return newPlan;
        });
    }, []);

    const handleSave = async () => {
        try {
            const unitRef = doc(db, 'plamo-slg', gameId, 'units', unit.id);
            await updateDoc(unitRef, { actionPlan: plan });
            alert("行動計画を保存しました。");
        } catch (error) {
            console.error("アクションプランの保存に失敗しました:", error);
            alert("アクションプランの保存に失敗しました。");
        }
    };

    const handleReset = async () => {
        if (window.confirm('行動計画をすべてリセットしますか？')) {
            try {
                const unitRef = doc(db, 'plamo-slg', gameId, 'units', unit.id);
                const emptyPlan = {};
                for (let i = 1; i <= 10; i++) {
                    emptyPlan[i] = { action: '---' };
                }
                
                const weaponsToUpdate = unit.weapons ? JSON.parse(JSON.stringify(unit.weapons)) : [];
                let hasChanges = false;
                for (let i = 1; i <= 10; i++) {
                    const actionData = plan[i];
                    if (actionData?.action === 'ファンネル展開' && actionData.weaponIndices) {
                        actionData.weaponIndices.forEach(idx => {
                            if (weaponsToUpdate[idx] && weaponsToUpdate[idx].isDeployed) {
                                weaponsToUpdate[idx].isDeployed = false;
                                hasChanges = true;
                            }
                        });
                    }
                }
                
                const updateData = { actionPlan: emptyPlan };
                if (hasChanges) {
                    updateData.weapons = weaponsToUpdate;
                }

                await updateDoc(unitRef, updateData);
                setPlan(emptyPlan); // ローカルステートを即時更新
                alert("行動計画をリセットしました。");
            } catch (error) {
                console.error("アクションプランのリセットに失敗しました:", error);
                alert("アクションプランのリセットに失敗しました。");
            }
        }
    };

    const srStates = {};
    for (let i = 1; i <= 10; i++) {
        if (srStates[i] === undefined) {
            const actionData = plan[i];
            if (actionData && actionData.action && actionData.action !== '---') {
                const cost = calculateSrCostFromData(unit, actionData);
                srStates[i] = { cost: cost, startSr: i };
                for (let j = 1; j < cost; j++) {
                    if (i + j <= 10) srStates[i + j] = { cost: 0, startSr: i };
                }
            } else {
                srStates[i] = { cost: 1, startSr: i };
            }
        }
    }

    return (
        <div className="bg-gray-800 p-3 sm:p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold mb-4 text-yellow-400">アクションプラン</h3>
            <table className="w-full text-sm table-fixed">
                <thead>
                    <tr className="bg-gray-900/50">
                        <th className="border border-gray-700 px-2 py-2 w-16">SR</th>
                        <th className="border border-gray-700 px-2 py-2">本体行動</th>
                        <th className="border border-gray-700 px-2 py-2">対象武装/形態/部位</th>
                        <th className="border border-gray-700 px-2 py-2 w-48">消費SR/詳細</th>
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map(sr => {
                        const state = srStates[sr];
                        if (state && state.cost > 0) { // Render the main row for an action
                            return (
                                <ActionRow
                                    key={sr} sr={sr} unit={unit}
                                    actionData={plan[sr] || { action: '---' }}
                                    srCost={state.cost}
                                    onPlanChange={handlePlanChange}
                                />
                            );
                        } else if (state && state.cost === 0) { // Render a placeholder for correct table rendering, but it will be hidden by rowspan
                             return <tr key={sr} className="hidden"></tr>; // This is the key change for rowspan to work correctly
                        }
                        return null;
                    })}
                    {/* Render occupied rows separately to not interfere with main loop */}
                    {Object.entries(srStates).map(([sr, state]) => {
                        if (state.cost === 0) {
                            return <OccupiedRow key={sr} sr={parseInt(sr)} startSr={state.startSr} />
                        }
                        return null;
                    })}
                </tbody>
            </table>
            <div className="mt-4 grid grid-cols-2 gap-4">
                <button onClick={handleReset} className="bg-yellow-600 hover:bg-yellow-700 text-gray-900 font-bold py-3 px-4 rounded">計画をリセット</button>
                <button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded">計画を保存</button>
            </div>
        </div>
    );
}

const OccupiedRow = ({ sr, startSr }) => {
    // This component now only renders visible content if it's NOT hidden by a rowspan.
    // The logic to hide is handled by the parent component's rendering loop.
    return (
        <tr className="bg-gray-800/20">
            {/* The actual content is now merged by the rowSpan of the ActionRow */}
        </tr>
    );
};

const ActionRow = ({ sr, unit, actionData, srCost, onPlanChange }) => {
    const actionInfo = GAME_MASTER_DATA.ACTION_LIST.find(a => a.name === actionData.action) || {};

    const Details = () => {
        const { finalStats } = unit;
        let detailsHtml = null;
        if (!finalStats) return null;

        if (actionInfo.name === '回避') detailsHtml = `回避率: <span class="font-bold text-green-400">${finalStats.evade || 0}%</span>`;
        else if (actionInfo.name === '受け') detailsHtml = `受け率: <span class="font-bold text-yellow-400">${finalStats.parry || 0}%</span>`;
        else if (actionInfo.needsWeapon && !actionInfo.name.includes("同時") && !actionInfo.name.includes("一斉") && actionInfo.name !== "ファンネル展開") {
            const weapon = unit.weapons[actionData.weaponIndex];
            const baseWeapon = weapon ? GAME_MASTER_DATA.weaponMasterList.find(b => b.id === weapon.baseWeaponId) : null;
            if (weapon && baseWeapon) {
                const baseHit = baseWeapon.category === '射撃' ? finalStats.baseShootingHit : finalStats.baseMeleeHit;
                const formatHit = (rb) => (rb === -999) ? 'ー' : `${(baseHit||0) + (weapon.finalHit||0) + (rb||0)}%`;
                detailsHtml = `DMG: <span class="font-bold text-red-400">${weapon.finalDamage}</span><br>命中(近/中/遠/超): ${formatHit(baseWeapon.range.near)}/${formatHit(baseWeapon.range.mid)}/${formatHit(baseWeapon.range.far)}/${formatHit(baseWeapon.range.vfar)}`;
            }
        }
        
        return (
            <div>
                <div>消費SR: <span className="font-bold text-yellow-400">{srCost}</span></div>
                {detailsHtml && <div className="mt-1" dangerouslySetInnerHTML={{ __html: detailsHtml }} />}
            </div>
        );
    };

    const renderTargetSelection = () => {
        if (!actionInfo.needsWeapon) {
            return <span className="text-gray-500 text-center block">-</span>;
        }

        if (actionInfo.name === "ファンネル展開") {
            const funnels = (unit.weapons || [])
                .map((w, index) => ({ ...w, index }))
                .filter(w => {
                    const base = GAME_MASTER_DATA.weaponMasterList.find(b => b.id === w.baseWeaponId);
                    return base && base.type === 'funnel';
                });

            return (
                <div className="space-y-1">
                    <p className="text-xs text-gray-400">展開するファンネルを選択 (最大6機)</p>
                    {funnels.map(funnel => {
                        const isChecked = (actionData.weaponIndices || []).includes(funnel.index);
                        const isDisabled = funnel.isDeployed || funnel.status === 'destroyed';
                        return (
                            <label key={funnel.index} className={`flex items-center text-sm p-1 rounded ${isDisabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-600'}`}>
                                <input type="checkbox" checked={isChecked} disabled={isDisabled} onChange={() => {
                                    const current = actionData.weaponIndices || [];
                                    const newSelection = isChecked ? current.filter(i => i !== funnel.index) : [...current, funnel.index];
                                    if (!isChecked && newSelection.length > 6) {
                                        alert('一度に展開できるファンネルは6機までです。');
                                        return;
                                    }
                                    onPlanChange(sr, 'weaponIndices', newSelection);
                                }} className="form-checkbox h-4 w-4 rounded bg-gray-600 border-gray-500 text-cyan-500 focus:ring-cyan-600"/>
                                <span className={`ml-2 truncate ${isDisabled ? 'line-through' : ''}`}>{funnel.customName} {funnel.isDeployed && '(展開中)'}</span>
                            </label>
                        );
                    })}
                </div>
            );
        }
        
        if (actionInfo.name === "同時攻撃" || actionInfo.name === "一斉射撃") {
            return (
                <div className="space-y-1">
                    {(unit.weapons || []).map((w, index) => {
                         if (w.mountType === 'unequipped' || w.status === 'destroyed') return null;
                         const isChecked = (actionData.multiWeaponIndices || []).includes(index);
                         return (
                            <label key={index} className="flex items-center text-sm p-1 rounded hover:bg-gray-600">
                                <input type="checkbox" checked={isChecked} onChange={() => {
                                    const current = actionData.multiWeaponIndices || [];
                                    const newSelection = isChecked ? current.filter(i => i !== index) : [...current, index];
                                    onPlanChange(sr, 'multiWeaponIndices', newSelection);
                                }} className="form-checkbox h-4 w-4 rounded bg-gray-600 border-gray-500 text-cyan-500 focus:ring-cyan-600"/>
                                <span className="ml-2 truncate">{w.customName}</span>
                            </label>
                         );
                    })}
                </div>
            );
        }

        if (actionInfo.needsWeapon) {
             return (
                 <select value={actionData.weaponIndex ?? ''} onChange={e => onPlanChange(sr, 'weaponIndex', e.target.value !== '' ? parseInt(e.target.value) : undefined)} className="w-full bg-gray-700 p-2 rounded">
                    <option value="">-- 選択 --</option>
                    {(unit.weapons || []).map((w, index) => w.mountType !== 'unequipped' && w.status !== 'destroyed' && <option key={index} value={index}>{w.customName}</option>)}
                </select>
            );
        }

        return <span className="text-gray-500 text-center block">-</span>;
    };

    return (
        <tr className="bg-gray-800/50 hover:bg-gray-700/50 align-top">
            <td className="border border-gray-700 px-2 py-2 text-center font-bold" rowSpan={srCost}>{sr}</td>
            <td className="border border-gray-700 p-2" rowSpan={srCost}>
                <select value={actionData.action} onChange={e => onPlanChange(sr, 'action', e.target.value)} className="w-full bg-gray-700 p-2 rounded">
                    {GAME_MASTER_DATA.ACTION_LIST.map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
                </select>
            </td>
            <td className="border border-gray-700 p-2" rowSpan={srCost}>
                {renderTargetSelection()}
            </td>
            <td className="border border-gray-700 p-2 text-xs" rowSpan={srCost}>
                <Details />
            </td>
        </tr>
    );
};

export default ActionPlanPanel;