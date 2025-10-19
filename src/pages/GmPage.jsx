import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db, auth } from '../firebase/firebase.js';
import { collection, doc, onSnapshot, addDoc, deleteDoc, writeBatch, getDocs, updateDoc, increment, serverTimestamp, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { calculateSrCostFromData } from '../utils/common.js';
import GmWizard from '../components/GmWizard.jsx';

// GameProgressionPanel: ゲーム進行タブのUIとロジック
const GameProgressionPanel = ({ gameId, gameState, gameUnits, onNextSr, onPrevSr, onEndTurn, onResetGame }) => {
    
    const currentSr = gameState?.currentSR || 1;
    const resolvingActions = [];
    const preparingActions = [];

    gameUnits.forEach(unit => {
        if (!unit.actionPlan) return;
        
        const srStates = {};
        let i = 1;
        while (i <= 10) {
            if (srStates[i]) { i++; continue; }
            const actionData = unit.actionPlan[i];
            
            if (actionData && actionData.action && actionData.action !== '---') {
                const srCost = calculateSrCostFromData(unit, actionData) || 1;
                const finalSr = i + srCost - 1;

                if (currentSr === finalSr) {
                    resolvingActions.push({ unit, actionData, startSr: i });
                } else if (currentSr >= i && currentSr < finalSr) {
                    preparingActions.push({ unit, actionData, startSr: i, finalSr });
                }

                for (let j = 0; j < srCost; j++) {
                    if (i + j <= 10) srStates[i + j] = true;
                }
                i += srCost;
            } else {
                i++;
            }
        }
    });

    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 bg-gray-800 p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-bold mb-4 text-purple-400">SR進行 & 行動解決</h3>
                <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
                    <span className="text-2xl font-bold px-4 py-2 bg-gray-900 rounded-md">Turn {gameState?.currentTurn || 1}</span>
                    <div className="flex items-center">
                        <button onClick={onPrevSr} disabled={currentSr <= 1} className="bg-gray-700 hover:bg-gray-600 font-bold p-3 rounded-l-md disabled:opacity-50">&lt;</button>
                        <div className="bg-gray-900 text-center text-2xl font-bold px-8 py-2">SR {currentSr}</div>
                        <button onClick={onNextSr} disabled={currentSr >= 10} className="bg-gray-700 hover:bg-gray-600 font-bold p-3 rounded-r-md disabled:opacity-50">&gt;</button>
                    </div>
                    <button onClick={onEndTurn} disabled={currentSr < 10} className="bg-red-800 hover:bg-red-700 text-white font-bold p-3 rounded-md disabled:opacity-50">ターン終了</button>
                    <button onClick={onResetGame} className="bg-orange-700 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-md">ゲームリセット</button>
                </div>
                <div className="space-y-3 h-96 overflow-y-auto pr-2 bg-gray-900/50 p-3 rounded-md">
                    {resolvingActions.length > 0 && <h4 className="text-lg font-bold text-red-400 mb-2">解決待機中の行動</h4>}
                    {resolvingActions.map(({ unit, actionData, startSr }) => (
                        <div key={unit.id + startSr} className="bg-gray-700 p-3 rounded-md">
                             <div className="flex items-center gap-4">
                                <p className="font-bold">{unit.name}</p>
                                <p className="text-cyan-300">{actionData.action}</p>
                                <button className="ml-auto bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">解決</button>
                            </div>
                        </div>
                    ))}
                    {preparingActions.length > 0 && <h4 className="text-lg font-bold text-yellow-400 mt-4 mb-2">準備中の行動</h4>}
                    {preparingActions.map(({ unit, actionData, finalSr }) => (
                         <div key={unit.id + finalSr} className="bg-gray-800 p-3 rounded-md opacity-70">
                            <p className="font-bold">{unit.name} - {actionData.action} (SR {finalSr}で解決)</p>
                        </div>
                    ))}
                    {resolvingActions.length === 0 && preparingActions.length === 0 && <p className="text-gray-500">現在のSRの行動はありません。</p>}
                </div>
            </div>
            <div className="lg:col-span-2">
                <h2 className="text-xl font-bold text-gray-400 mb-4">戦闘ログ</h2>
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg h-[28rem] overflow-y-auto space-y-3">
                    {/* Combat Log will be implemented here */}
                </div>
            </div>
        </div>
    );
};

// DataRegistrationPanel: データ登録タブのUIとロジック
const DataRegistrationPanel = ({ gameId, user, onOpenWizard }) => {
    const [teams, setTeams] = useState([]);
    const [gameUnits, setGameUnits] = useState([]);
    const [hangarUnits, setHangarUnits] = useState([]);
    const [newTeamName, setNewTeamName] = useState('');
    const [showTeamSelectModal, setShowTeamSelectModal] = useState(false);
    const [selectedUnitForGame, setSelectedUnitForGame] = useState(null);

    useEffect(() => {
        const teamsRef = collection(db, 'plamo-slg', gameId, 'teams');
        const teamsUnsubscribe = onSnapshot(teamsRef, snapshot => setTeams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
        const unitsRef = collection(db, 'plamo-slg', gameId, 'units');
        const unitsUnsubscribe = onSnapshot(unitsRef, snapshot => setGameUnits(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
        return () => { teamsUnsubscribe(); unitsUnsubscribe(); };
    }, [gameId]);

    useEffect(() => {
        const hangarRef = collection(db, 'plamo-slg-hangar');
        const unsubscribe = onSnapshot(hangarRef, snapshot => setHangarUnits(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
        return unsubscribe;
    }, []);

    const handleAddTeam = async () => {
        if (!newTeamName.trim()) return;
        await addDoc(collection(db, 'plamo-slg', gameId, 'teams'), { name: newTeamName });
        setNewTeamName('');
    };

    const handleDeleteTeam = async (teamId) => {
        if (gameUnits.some(u => u.teamId === teamId)) return alert('チームに機体が所属しているため、削除できません。');
        if (confirm('本当にこのチームを削除しますか？')) await deleteDoc(doc(db, 'plamo-slg', gameId, 'teams', teamId));
    };
    
    const handleAddUnitToGame = (unit) => {
        setSelectedUnitForGame(unit);
        setShowTeamSelectModal(true);
    };

    const handleConfirmAddToGame = async (teamId) => {
        if (!selectedUnitForGame) return;
        const { id, ...dataToCopy } = selectedUnitForGame;
        await addDoc(collection(db, 'plamo-slg', gameId, 'units'), { ...dataToCopy, playerId: '', player: '', teamId: teamId || '' });
        setShowTeamSelectModal(false);
        setSelectedUnitForGame(null);
    };

    const handleRemoveUnitFromGame = async (unitId) => {
        if (confirm('この機体をゲームから除外しますか？')) await deleteDoc(doc(db, 'plamo-slg', gameId, 'units', unitId));
    };
    
    const handleDeleteUnitFromHangar = async (unitId) => {
        if (confirm('本当にこの機体を格納庫から完全に削除しますか？')) await deleteDoc(doc(db, 'plamo-slg-hangar', unitId));
    };

    const combinedTeams = [...teams, { id: 'unassigned', name: '未所属の機体' }];
    const unitsByTeam = combinedTeams.map(team => ({...team, units: gameUnits.filter(u => u.teamId === team.id || (!u.teamId && team.id === 'unassigned')) }));

    return (
        <div className="flex flex-col gap-6">
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-indigo-400">チーム管理</h2>
                    <div className="flex gap-2"><input type="text" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} placeholder="新しいチーム名" className="bg-gray-700 p-2 rounded-md border border-gray-600"/><button onClick={handleAddTeam} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-3 rounded-md">チーム作成</button></div>
                </div>
                <div className="space-y-4">
                    {unitsByTeam.map(team => (
                        <div key={team.id} className="bg-gray-700 p-4 rounded-lg">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className={`text-xl font-bold ${team.id === 'unassigned' ? 'text-gray-400' : 'text-indigo-300'}`}>{team.name}</h3>
                                {team.id !== 'unassigned' && <button onClick={() => handleDeleteTeam(team.id)} className="text-xs bg-red-800 hover:bg-red-700 text-white py-1 px-2 rounded-md">チーム削除</button>}
                            </div>
                            <div className="space-y-3">
                                {team.units.length > 0 ? team.units.map(unit => (
                                    <div key={unit.id} className="bg-gray-800 p-3 rounded-md flex justify-between items-center">
                                        <div className="flex items-center">
                                            {unit.imageFileName ? <img src={`/images/${unit.imageFileName}`} alt={unit.name} className="w-12 h-12 object-cover rounded-md mr-3 bg-gray-700" /> : <div className="w-12 h-12 rounded-md mr-3 bg-gray-700 flex items-center justify-center text-xs text-gray-400">画像なし</div>}
                                            <div>
                                                <p className="font-semibold">{unit.name}</p>
                                                <p className="text-xs text-gray-400">{unit.player ? `${unit.player} / ${unit.builder}` : `(未割当) / ${unit.builder}`}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleRemoveUnitFromGame(unit.id)} className="text-xs bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 rounded">除外</button>
                                    </div>
                                )) : <p className="text-sm text-gray-500 p-2">このチームに機体はありません。</p>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-400">機体格納庫 (全機体)</h2>
                    <button onClick={() => onOpenWizard(null, null)} className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-md">新規機体を作成</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {hangarUnits.map(unit => (
                        <div key={unit.id} className="bg-gray-800 p-2 rounded-lg flex flex-col">
                            {unit.imageFileName ? <img src={`/images/${unit.imageFileName}`} alt={unit.name} className="w-full h-28 object-cover rounded-md mb-2 bg-gray-700" /> : <div className="w-full h-28 rounded-md mb-2 bg-gray-700 flex items-center justify-center text-xs text-gray-400">画像なし</div>}
                            <div className="flex-grow">
                                <h4 className="font-bold text-base">{unit.name}</h4>
                                <p className="text-xs text-gray-400">ビルダー: {unit.builder || 'N/A'}</p>
                            </div>
                            <div className="mt-2 flex flex-col gap-1">
                                <button onClick={() => handleAddUnitToGame(unit)} className="w-full bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1 px-2 rounded">ゲームに追加</button>
                                <div className="flex gap-1 mt-1">
                                    <button onClick={() => onOpenWizard(unit.id, unit)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1 px-2 rounded">編集</button>
                                    <button onClick={() => handleDeleteUnitFromHangar(unit.id)} className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-2 rounded">削除</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {showTeamSelectModal && ( <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"> <div className="bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md flex flex-col"> <h2 className="text-2xl font-bold text-green-400 mb-4">チームを選択</h2> <div className="space-y-2 mb-6 max-h-64 overflow-y-auto"> <label className="flex items-center p-2 rounded hover:bg-gray-700 cursor-pointer"> <input type="radio" name="team-selection" value="" defaultChecked className="form-radio h-4 w-4" /> <span className="ml-3">未所属にする</span> </label> {teams.map(team => ( <label key={team.id} className="flex items-center p-2 rounded hover:bg-gray-700 cursor-pointer"> <input type="radio" name="team-selection" value={team.id} className="form-radio h-4 w-4" /> <span className="ml-3">{team.name}</span> </label> ))} </div><div className="flex justify-end gap-4"> <button onClick={() => setShowTeamSelectModal(false)} className="bg-gray-600 hover:bg-gray-700 font-bold py-2 px-4 rounded">キャンセル</button> <button onClick={() => handleConfirmAddToGame(document.querySelector('input[name="team-selection"]:checked').value)} className="bg-green-600 hover:bg-green-700 font-bold py-2 px-4 rounded">決定</button> </div></div></div> )}
        </div>
    );
};

function GmPage() {
    const { gameId } = useParams();
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('progression');
    const [gameState, setGameState] = useState(null);
    const [gameUnits, setGameUnits] = useState([]);
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
        return unsubscribe;
    }, []);

    useEffect(() => {
        const gameDocRef = doc(db, 'plamo-slg', gameId);
        const unsubscribe = onSnapshot(gameDocRef, (doc) => { if (doc.exists()) setGameState(doc.data()); });
        return unsubscribe;
    }, [gameId]);

    useEffect(() => {
        const unitsRef = collection(db, 'plamo-slg', gameId, 'units');
        const unsubscribe = onSnapshot(unitsRef, snapshot => setGameUnits(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
        return unsubscribe;
    }, [gameId]);

    const handleSrChange = async (value) => {
        await updateDoc(doc(db, 'plamo-slg', gameId), { currentSR: value });
    };

    const handleEndTurn = async () => {
        if (!confirm('ターンを終了しますか？全プレイヤーのアクションプランがリセットされます。')) return;
        const gameDocRef = doc(db, 'plamo-slg', gameId);
        const unitsRef = collection(db, 'plamo-slg', gameId, 'units');
        const emptyPlan = {};
        for (let i = 1; i <= 10; i++) emptyPlan[i] = { action: '---', funnelActions: {} };
        const batch = writeBatch(db);
        batch.update(gameDocRef, { currentTurn: increment(1), currentSR: 1 });
        const unitsSnapshot = await getDocs(unitsRef);
        unitsSnapshot.forEach(unitDoc => batch.update(unitDoc.ref, { actionPlan: emptyPlan }));
        await batch.commit();
        alert('ターンを終了しました。');
    };

    const handleResetGame = async () => {
        if (!confirm('本当にゲームの全データをリセットしますか？')) return;
        const gameRef = doc(db, 'plamo-slg', gameId);
        try {
            for (const sub of ['units', 'teams', 'logs']) {
                const snapshot = await getDocs(collection(gameRef, sub));
                if (snapshot.size > 0) {
                    const batch = writeBatch(db);
                    snapshot.docs.forEach(d => batch.delete(d.ref));
                    await batch.commit();
                }
            }
            await updateDoc(gameRef, { currentTurn: 1, currentSR: 1 });
            alert('ゲームをリセットしました。');
        } catch (error) {
            alert('ゲームのリセットに失敗しました。');
        }
    };
    
    const handleOpenWizard = (unitId, unitData) => {
        setEditingUnit(unitId ? { unitId, unitData } : null);
        setIsWizardOpen(true);
    };

    return (
        <div>
            <div className="text-center p-4 bg-gray-800 rounded-lg mb-4"><p>ゲームID: {gameId} | GMとして認証完了</p></div>
            <div className="mb-4 border-b border-gray-700">
                <nav className="-mb-px flex space-x-4">
                    <button onClick={() => setActiveTab('progression')} className={`py-3 px-2 border-b-2 font-medium text-sm ${activeTab === 'progression' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-gray-400'}`}>ゲーム進行</button>
                    <button onClick={() => setActiveTab('registration')} className={`py-3 px-2 border-b-2 font-medium text-sm ${activeTab === 'registration' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-gray-400'}`}>データ登録</button>
                </nav>
            </div>
            <div>
                {activeTab === 'progression' && <GameProgressionPanel gameId={gameId} gameState={gameState} gameUnits={gameUnits} onNextSr={() => handleSrChange(increment(1))} onPrevSr={() => handleSrChange(increment(-1))} onEndTurn={handleEndTurn} onResetGame={handleResetGame} />}
                {activeTab === 'registration' && <DataRegistrationPanel gameId={gameId} user={user} onOpenWizard={handleOpenWizard} />}
            </div>
            {isWizardOpen && <GmWizard initialUnitData={editingUnit?.unitData} unitId={editingUnit?.unitId} onSave={() => setIsWizardOpen(false)} onClose={() => setIsWizardOpen(false)} user={user} />}
        </div>
    );
}

export default GmPage;

