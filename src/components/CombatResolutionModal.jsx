import { useState, useEffect } from 'react';
import { GAME_MASTER_DATA } from '../data/gameData';
// combat-resolver.js の関数をインポート（utilsなどに配置することを推奨）
// import { getSuccessLevel, getSuccessLevelRanges } from '../utils/combat-resolver';

function CombatResolutionModal({ isOpen, onClose, gameId, combatData }) {
    if (!isOpen || !combatData) {
        return null;
    }

    const { attacker, weapon, baseWeapon, sr, actionData } = combatData;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-6xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-red-400">戦闘解決</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl">&times;</button>
                </div>

                <div className="flex-grow overflow-y-auto pr-4 grid grid-cols-12 gap-6">
                    {/* Left Column: Summary */}
                    <div className="col-span-4 bg-gray-900/50 p-4 rounded-lg flex flex-col">
                        <h3 className="font-bold text-lg mb-2 text-gray-400 border-b border-gray-700 pb-2">戦闘サマリー</h3>
                        <div className="space-y-2">
                             <div className="bg-gray-800 p-2 rounded">
                                <p className="font-bold">{attacker?.name} <span className="text-xs text-gray-400">(攻撃側)</span></p>
                                <p className="text-sm text-cyan-400">{actionData?.action}: {weapon?.customName}</p>
                            </div>
                            <div className="text-center text-gray-500 my-1">VS</div>
                             <div className="bg-gray-800 p-2 rounded">
                                <p className="font-bold">防御側 (未選択)</p>
                            </div>
                        </div>
                        <div id="combat-summary-log" className="mt-3 pt-3 border-t border-gray-700 space-y-2 text-sm flex-grow">
                            <p className="text-gray-500">入力待機中...</p>
                        </div>
                    </div>

                    {/* Right Column: Controls */}
                    <div className="col-span-8 space-y-4">
                        <p className="text-gray-500">（ここにステップ1〜5の操作パネルが実装されます）</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CombatResolutionModal;