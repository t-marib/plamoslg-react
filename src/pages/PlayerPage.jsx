import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db, auth } from '../firebase/firebase.js';
import { collection, query, where, onSnapshot, doc, updateDoc, orderBy } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { calculateAllFinalStats } from '../utils/common.js';
import { GAME_MASTER_DATA } from '../data/gameData.js';
import ActionPlanPanel from '../components/ActionPlanPanel.jsx';
import UnitCustomizationModal from '../components/UnitCustomizationModal.jsx';

const AccordionItem = ({ title, titleChildren, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="bg-gray-900 rounded-lg">
            <button className="w-full flex justify-between items-center text-left p-3 hover:bg-gray-800 rounded-lg transition" onClick={() => setIsOpen(!isOpen)}>
                {title}
                <div className="flex items-center">
                    {titleChildren}
                    <svg className={`w-6 h-6 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
            </button>
            {isOpen && <div className="p-3 border-t border-gray-700">{children}</div>}
        </div>
    );
};

const EquipmentTable = ({ equipmentList = [] }) => {
    if (!equipmentList || equipmentList.filter(e => e.name).length === 0) return <span className="text-xs text-gray-500">なし</span>;
    return (
        <table className="w-full text-xs border-collapse border border-gray-700 mt-1">
            <thead className="bg-gray-900">
                <tr>
                    <th className="border-b border-r border-gray-700 px-1 w-4">#</th>
                    <th className="border-b border-r border-gray-700 px-1">名前</th>
                    <th className="border-b border-r border-gray-700 px-1 w-8">AP</th>
                    <th className="border-b border-r border-gray-700 px-1 w-8">HP</th>
                    <th className="border-b border-r border-gray-700 px-1 w-8">DCP</th>
                </tr>
            </thead>
            <tbody>
                {equipmentList.map((eq, index) => (
                    eq && eq.name ? (
                        <tr key={index} className={`border-t border-gray-700 ${eq.status === 'destroyed' ? 'text-gray-500 line-through bg-red-900/30' : ''}`}>
                            <td className="border-r border-gray-700 px-1 py-0.5 text-center">{index + 1}</td>
                            <td className="border-r border-gray-700 px-1 py-0.5">{eq.name}</td>
                            <td className="border-r border-gray-700 px-1 py-0.5 text-center">{eq.ap || 0}</td>
                            <td className="border-r border-gray-700 px-1 py-0.5 text-center">{eq.hp || 0}</td>
                            <td className="px-1 py-0.5 text-center">{eq.dcp || 0}</td>
                        </tr>
                    ) : null
                ))}
            </tbody>
        </table>
    );
};

const StatusPanel = ({ unit }) => {
    const { finalStats, baseValues, parts, weapons, types, hitLocationTable, forms } = unit;
    const movePerSr = Math.ceil((finalStats.move || 0) / 10);

    const activeFormIndex = unit.activeFormIndex || 0;
    const activeForm = (forms && forms[activeFormIndex]) ? forms[activeFormIndex] : { name: '通常形態', moveType: '全方向' };
    let displayImageFileName = (unit.forms && unit.forms[0]) ? unit.forms[0].imageFileName : unit.imageFileName;
    if (activeForm && activeForm.imageFileName && activeForm.imageFileName.trim() !== '') {
        displayImageFileName = activeForm.imageFileName;
    }
    const imageSrc = displayImageFileName ? `/images/${displayImageFileName}` : 'https://placehold.co/320x240/4B5563/9CA3AF?text=No+Image';

    const sortedHitLocationTable = [...(hitLocationTable || GAME_MASTER_DATA.defaultHitLocationTable)].filter(h => !h.isLargeArmament).sort((a, b) => b.range[0] - a.range[0]);
    const largeArmamentParts = (hitLocationTable || []).filter(h => h.isLargeArmament);


    const PartAccordionItem = ({ partName, partData, hitLocation, isLargeArmament = false }) => {
        if (!partData) return null;
        const isDestroyed = partData.hp <= 0;
        const hpPercentage = (partData.maxHp > 0) ? (partData.hp / partData.maxHp) * 100 : 0;
        let hpColorClass = 'text-green-400';
        if (isDestroyed) hpColorClass = 'text-red-600 line-through';
        else if (hpPercentage <= 25) hpColorClass = 'text-red-500';
        else if (hpPercentage <= 50) hpColorClass = 'text-yellow-400';

        const d20Roll = hitLocation && !isLargeArmament ? (hitLocation.range[0] === hitLocation.range[1] ? hitLocation.range[0] : `${hitLocation.range[1]}-${hitLocation.range[0]}`) : null;

        return (
            <AccordionItem
                title={<h4 className={`text-lg font-bold ${isLargeArmament ? 'text-yellow-300' : 'text-cyan-300'}`}>{partName} {isDestroyed && <span className="text-red-500 font-bold">[破壊]</span>}</h4>}
                titleChildren={d20Roll && <span className="text-sm font-mono bg-gray-700 px-2 py-1 rounded mr-2">{d20Roll}</span>}
            >
                <div className="grid grid-cols-4 gap-2 text-center text-sm border-b border-gray-700 pb-2 mb-2">
                    <div><span className="text-xs text-gray-500">機体P</span><p>{partData.unitPoints || 0}</p></div>
                    <div><span className="text-xs text-gray-500">AP</span><p>{partData.ap}</p></div>
                    <div><span className="text-xs text-gray-500">HP</span><p className={hpColorClass}>{partData.hp} / {partData.maxHp}</p></div>
                    <div><span className="text-xs text-gray-500">DCP</span><p>{partData.dcp}</p></div>
                </div>
                <div className="mt-2"><h5 className="text-sm font-semibold text-gray-400">外付装備</h5><EquipmentTable equipmentList={partData.externalEquipment} /></div>
                <div className="mt-2"><h5 className="text-sm font-semibold text-gray-400">内蔵装備</h5><EquipmentTable equipmentList={partData.internalEquipment} /></div>
            </AccordionItem>
        );
    };

    const WeaponAccordionItem = ({ weapon, finalStats }) => {
        const base = GAME_MASTER_DATA.weaponMasterList.find(b => b.id === weapon.baseWeaponId);
        if (!base) return null;

        const isDestroyed = weapon.status === 'destroyed';
        const srBonusText = weapon.hasSrBonus ? <span className="font-bold text-yellow-400">{weapon.finalSr}</span> : weapon.finalSr;
        const hitChance = (rangeBonus) => {
            if (rangeBonus === -999) return '-';
            const baseHit = base.category === '射撃' ? finalStats.baseShootingHit : finalStats.baseMeleeHit;
            return `${baseHit + (weapon.finalHit || 0) + rangeBonus}%`;
        };
        
        let consumptionHtml = '';
        if (base.attribute === 'ビーム') {
            const capacityText = weapon.finalEnOrAmmo > 0 ? `EN容量: ${weapon.currentAmmo} / ${weapon.finalEnOrAmmo}` : '供給: 本体';
            consumptionHtml = `消費EN: ${weapon.finalEnCost} | ${capacityText}`;
        } else if (base.attribute === '実体' && base.category === '射撃') {
            consumptionHtml = `消費弾数: ${base.enCost} | 装弾数: ${weapon.currentAmmo} / ${weapon.finalEnOrAmmo}`;
        }

        return (
            <AccordionItem
                title={<h4 className={`text-lg font-bold ${isDestroyed ? 'text-gray-500 line-through' : 'text-cyan-300'}`}>{weapon.customName} {isDestroyed && <span className="font-bold text-red-500">[破壊]</span>}</h4>}
            >
                 <div className="grid grid-cols-4 gap-x-4 gap-y-2 text-sm">
                    <div><span className="text-xs text-gray-500">ダメージ</span><p>{weapon.finalDamage}</p></div>
                    <div><span className="text-xs text-gray-500">SR</span><p>{srBonusText}</p></div>
                    <div><span className="text-xs text-gray-500">同時回数</span><p>{weapon.simultaneousAttacks || 1}</p></div>
                    <div><span className="text-xs text-gray-500">攻撃回数</span><p>{(typeof base.attacks === 'number' && base.attacks > 0) ? base.attacks : '特殊'}</p></div>
                    <div className="col-span-4"><span className="text-xs text-gray-500">消費/容量</span><p>{consumptionHtml || '-'}</p></div>
                    <div className="col-span-4"><span className="text-xs text-gray-500">命中(近/中/遠/超遠)</span><p>{hitChance(base.range.near)} / {hitChance(base.range.mid)} / {hitChance(base.range.far)} / {hitChance(base.range.vfar)}</p></div>
                    <div className="col-span-4"><span className="text-xs text-gray-500">特殊効果</span><p>{base.specialEffect || 'なし'}</p></div>
                </div>
            </AccordionItem>
        );
    };
    
    return (
        <div id="unit-dashboard" className="bg-gray-800 p-3 sm:p-6 rounded-lg shadow-lg">
            <header className="text-center mb-4">
                <div className="mb-4"><img src={imageSrc} alt={unit.name} className="max-w-xs mx-auto rounded-lg shadow-lg" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/320x240/4B5563/9CA3AF?text=N/A'; }} /></div>
                <h1 className="text-3xl font-bold text-cyan-400">{unit.name}</h1>
                <p className="text-md text-gray-400">ビルダー: {unit.builder} | プレイヤー: {unit.player || 'N/A'}</p>
            </header>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center mb-4">
                <div className="bg-gray-900 p-2 rounded"><strong>機体タイプ:</strong> {types.unitType}</div>
                <div className="bg-gray-900 p-2 rounded"><strong>戦闘タイプ:</strong> {types.combatType}</div>
                <div className="bg-gray-900 p-2 rounded"><strong>武装タイプ:</strong> {types.armamentType}</div>
                <div className="bg-gray-900 p-2 rounded"><strong>現在形態:</strong> {finalStats.activeFormName || '通常'}</div>
            </div>
            <div className="bg-gray-700 p-3 rounded-lg">
                <h2 className="text-xl font-bold border-b-2 border-gray-600 pb-1 mb-2">基本性能</h2>
                <div className="space-y-2 text-sm">
                    <div className="p-1 rounded bg-gray-900">
                        <div className="flex justify-between items-center"><span className="text-gray-400">EN</span><span className={`font-bold text-lg ${finalStats.currentEN / finalStats.maxEN <= 0.1 ? 'text-red-500 animate-pulse' : finalStats.currentEN / finalStats.maxEN <= 0.3 ? 'text-yellow-400' : 'text-cyan-400'}`}>{finalStats.currentEN} / {finalStats.maxEN}</span></div>
                    </div>
                    <div className="p-1 rounded hover:bg-gray-600"><div className="flex justify-between items-center"><span className="text-gray-400">移動力 (1ターン)</span><span className="font-bold text-lg">{finalStats.move}</span></div></div>
                    <div className="p-1 rounded hover:bg-gray-600"><div className="flex justify-between items-center"><span className="text-gray-400">移動力 (1SR)</span><span className="font-bold text-lg">{movePerSr}</span></div></div>
                    <div className="p-1 rounded hover:bg-gray-600"><div className="flex justify-between items-center"><span className="text-gray-400">回避</span><span className="font-bold text-lg">{finalStats.evade}%</span></div></div>
                    <div className="p-1 rounded hover:bg-gray-600"><div className="flex justify-between items-center"><span className="text-gray-400">受け</span><span className="font-bold text-lg">{finalStats.parry}%</span></div></div>
                    <div className="p-1 rounded hover:bg-gray-600"><div className="flex justify-between items-center"><span className="text-gray-400">射撃命中(基本)</span><span className="font-bold text-lg">{finalStats.baseShootingHit}%</span></div></div>
                    <div className="p-1 rounded hover:bg-gray-600"><div className="flex justify-between items-center"><span className="text-gray-400">格闘命中(基本)</span><span className="font-bold text-lg">{finalStats.baseMeleeHit}%</span></div></div>
                </div>
            </div>
            <div className="mt-4">
                <h2 className="text-xl font-bold p-3">部位ステータス & 命中判定</h2>
                <div className="space-y-2">
                    {sortedHitLocationTable.map(hitLocation => <PartAccordionItem key={hitLocation.part} partName={hitLocation.part} partData={parts[hitLocation.part]} hitLocation={hitLocation} />)}
                </div>
            </div>
            {largeArmamentParts.length > 0 && (
                <div className="mt-4"><h2 className="text-xl font-bold p-3 text-yellow-300">大型武装</h2><div className="space-y-2">{largeArmamentParts.map((hitLocation) => <PartAccordionItem key={hitLocation.part} partName={hitLocation.part} partData={parts[hitLocation.part]} isLargeArmament={true} />)}</div></div>
            )}
            <div className="mt-4">
                <h2 className="text-xl font-bold p-3">武装リスト</h2>
                <div className="space-y-2">
                    {weapons && weapons.filter(w => w.mountType !== 'unequipped').map((weapon, index) => <WeaponAccordionItem key={index} weapon={weapon} finalStats={finalStats} />)}
                </div>
            </div>
        </div>
    );
};

const CombatLogPanel = ({ gameId }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const logsRef = collection(db, 'plamo-slg', gameId, 'logs');
        const q = query(logsRef, orderBy('timestamp', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsubscribe();
    }, [gameId]);

    if (loading) return <p>戦闘ログを読み込み中...</p>;

    return (
        <div className="bg-gray-800 p-3 sm:p-6 rounded-lg shadow-lg h-[80vh] overflow-y-auto space-y-3">
            {logs.length > 0 ? logs.map(log => (
                <div key={log.id} className="border-b border-gray-700 pb-2 mb-2">
                    <div className="text-xs text-gray-500 mb-1">Turn {log.turn || '?'} / SR {log.sr || '?'} | {log.timestamp?.toDate().toLocaleString('ja-JP')}</div>
                    <div className="text-gray-300" dangerouslySetInnerHTML={{ __html: log.htmlMessage }}></div>
                </div>
            )) : <p className="text-gray-500">まだ戦闘ログはありません。</p>}
        </div>
    );
};

const PlayerDashboard = ({ unit, gameId, onLeave }) => {
    const [activeTab, setActiveTab] = useState('status');
    const tabs = [{ id: 'status', label: '機体ステータス' }, { id: 'action', label: 'アクションプラン' }, { id: 'log', label: '戦闘ログ' }];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'status': return <StatusPanel unit={unit} />;
            case 'action': return <ActionPlanPanel unit={unit} gameId={gameId} />;
            case 'log': return <CombatLogPanel gameId={gameId} />;
            default: return null;
        }
    };
    return (
        <div>
            <div className="mb-4"><button onClick={onLeave} className="text-sm text-cyan-400 hover:text-cyan-200">&larr; 機体選択に戻る</button></div>
            <div className="mb-4 border-b border-gray-700"><nav className="-mb-px flex space-x-4" aria-label="Tabs">{tabs.map(tab => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`whitespace-nowrap py-3 px-2 border-b-2 font-medium text-sm ${activeTab === tab.id ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}>{tab.label}</button>))}</nav></div>
            <div>{renderTabContent()}</div>
        </div>
    );
};

const UnitSelection = ({ gameId, user, onUnitSelect }) => {
    const [teams, setTeams] = useState([]);
    const [units, setUnits] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [customizingUnit, setCustomizingUnit] = useState(null);

    useEffect(() => {
        const teamsRef = collection(db, 'plamo-slg', gameId, 'teams');
        const unsubscribe = onSnapshot(teamsRef, (snapshot) => { setTeams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); setLoading(false); });
        return () => unsubscribe();
    }, [gameId]);

    useEffect(() => {
        if (!selectedTeam) { setUnits([]); return; };
        const unitsRef = collection(db, 'plamo-slg', gameId, 'units');
        const q = query(unitsRef, where('teamId', '==', selectedTeam.id));
        const unsubscribe = onSnapshot(q, (snapshot) => { setUnits(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(u => !u.playerId || u.playerId === '')); });
        return () => unsubscribe();
    }, [selectedTeam, gameId]);
      
    const handleUnitClick = (unit) => {
        setCustomizingUnit(unit);
    };

    if (loading) return <p>チームを読み込み中...</p>;

    return (
        <>
            {selectedTeam ? (
                <div className="max-w-lg mx-auto w-full">
                    <h2 className="text-2xl font-bold mb-4 text-blue-400">{selectedTeam.name}の機体を選択</h2>
                    <div className="mb-4"><button onClick={() => setSelectedTeam(null)} className="text-sm text-cyan-400 hover:text-cyan-200">&larr; チーム選択に戻る</button></div>
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg space-y-3">
                        {units.length > 0 ? units.map(unit => {
                            let imageSrc = 'https://placehold.co/80x80/4B5563/9CA3AF?text=N/A';
                            const formImage = unit.forms?.[0]?.imageFileName;
                            if(formImage) {
                                imageSrc = `/images/${formImage}`;
                            } else if (unit.imageFileName) {
                                imageSrc = `/images/${unit.imageFileName}`;
                            }
                            return (<button key={unit.id} onClick={() => handleUnitClick(unit)} className="w-full bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-md transition duration-300 flex items-center text-left"><img src={imageSrc} alt={unit.name} className="w-20 h-20 object-cover rounded-md mr-4" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/80x80/4B5563/9CA3AF?text=N/A'; }}/><div className="flex-grow"><div className="font-bold text-lg">{unit.name}</div><div className="text-xs text-gray-400">ビルダー: {unit.builder || 'N/A'}</div></div></button>)
                        }) : <p className="text-gray-400">現在選択可能な機体はありません。</p>}
                    </div>
                </div>
            ) : (
                <div className="max-w-md mx-auto w-full">
                    <h2 className="text-2xl font-bold mb-4 text-indigo-400">参加するチームを選択</h2>
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg space-y-3">
                        {teams.length > 0 ? teams.map(team => (<button key={team.id} onClick={() => setSelectedTeam(team)} className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-4 rounded-md transition duration-300">{team.name}</button>)) : <p className="text-gray-400">現在参加可能なチームはありません。</p>}
                    </div>
                </div>
            )}
            
            {customizingUnit && <UnitCustomizationModal 
                isOpen={!!customizingUnit}
                onClose={() => setCustomizingUnit(null)}
                unit={customizingUnit}
                gameId={gameId}
                user={user}
                onJoin={onUnitSelect}
            />}
        </>
    );
};

function PlayerPage() {
    const { gameId } = useParams();
    const [user, setUser] = useState(null);
    const [selectedUnitId, setSelectedUnitId] = useState(null);
    const [unitData, setUnitData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) setUser(currentUser);
            else signInAnonymously(auth).catch(err => setError("認証に失敗しました。"));
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!user || !gameId) return;
        setLoading(true);
        const unitsRef = collection(db, 'plamo-slg', gameId, 'units');
        const q = query(unitsRef, where('playerId', '==', user.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                setSelectedUnitId(snapshot.docs[0].id);
            } else {
                setSelectedUnitId(null);
            }
            setLoading(false);
        }, () => { setError("機体情報の確認に失敗しました。"); setLoading(false); });
        return () => unsubscribe();
    }, [user, gameId]);

    useEffect(() => {
        if (!selectedUnitId || !gameId) { setUnitData(null); return; };
        const unitRef = doc(db, 'plamo-slg', gameId, 'units', selectedUnitId);
        const unsubscribe = onSnapshot(unitRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                if (!data.actionPlan) {
                    data.actionPlan = {};
                    for(let i = 1; i <= 10; i++) { data.actionPlan[i] = { action: '---', funnelActions: {} }; }
                }
                setUnitData(calculateAllFinalStats({ id: doc.id, ...data }));
            }
            else { setSelectedUnitId(null); }
        });
        return () => unsubscribe();
    }, [selectedUnitId, gameId]);
      
    const handleUnitSelect = (unitId) => setSelectedUnitId(unitId);

    const handleLeave = async () => {
        if (!selectedUnitId) return;
        if (confirm('現在の機体の選択を解除して、機体選択画面に戻りますか？')) {
            try {
                const unitRef = doc(db, 'plamo-slg', gameId, 'units', selectedUnitId);
                await updateDoc(unitRef, { playerId: '', player: '' });
            } catch (err) { alert("機体選択画面への復帰に失敗しました。"); }
        }
    };

    if (loading || !user) return <p className="text-center">読み込み中...</p>;
    if (error) return <p className="text-red-500 text-center">{error}</p>;

    if (unitData) {
        return <PlayerDashboard unit={unitData} gameId={gameId} onLeave={handleLeave} />;
    } else {
        return <UnitSelection gameId={gameId} user={user} onUnitSelect={handleUnitSelect} />;
    }
}

export default PlayerPage;