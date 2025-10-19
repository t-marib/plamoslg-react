import { useState, useEffect } from 'react';
import { db } from '../firebase/firebase';
import { collection, doc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { GAME_MASTER_DATA } from '../data/gameData';

// Reusable UI Components
const Input = ({ label, ...props }) => (
    <label className="block text-sm"><span className="text-gray-400">{label}</span><input className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm p-2" {...props} /></label>
);
const Select = ({ label, children, ...props }) => (
    <label className="block text-sm"><span className="text-gray-400">{label}</span><select className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm p-2" {...props}>{children}</select></label>
);

function GmWizard({ initialUnitData, unitId, onSave, onClose, user }) {
    const [currentStep, setCurrentStep] = useState(1);
    const [unitData, setUnitData] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const defaultForms = [{ name: '通常形態', moveType: '全方向', imageFileName: '' }];
        const defaultTypes = { size: 'M', unitType: '汎用型', combatType: '汎用型', armamentType: '汎用型', srReducedWeaponIndices: [] };
        
        if (initialUnitData) {
            setUnitData({
                ...initialUnitData,
                forms: initialUnitData.forms?.length ? initialUnitData.forms : defaultForms,
                types: { ...defaultTypes, ...initialUnitData.types },
                hitLocationTable: initialUnitData.hitLocationTable || [...GAME_MASTER_DATA.defaultHitLocationTable],
            });
        } else {
            const defaultParts = {};
            GAME_MASTER_DATA.defaultHitLocationTable.forEach(p => {
                defaultParts[p.part] = { unitPoints: 0, internalEquipment: [], externalEquipment: [] };
            });
            setUnitData({
                name: '', builder: '', imageFileName: '',
                forms: defaultForms,
                types: defaultTypes,
                parts: defaultParts,
                weapons: [], tanks: [], largeArmaments: [],
                hitLocationTable: [...GAME_MASTER_DATA.defaultHitLocationTable],
            });
        }
        setIsLoading(false);
    }, [initialUnitData]);

    const handleUnitDataChange = (path, value) => {
        setUnitData(prev => {
            const keys = path.split('.');
            const newState = JSON.parse(JSON.stringify(prev));
            let current = newState;
            for (let i = 0; i < keys.length - 1; i++) {
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
            return newState;
        });
    };
    
    const handleSave = async () => {
        if (!unitData.name || !unitData.builder) {
            return alert("機体名とビルダー名は必須です。");
        }
        try {
            if (unitId) {
                await updateDoc(doc(db, 'plamo-slg-hangar', unitId), { ...unitData, updatedAt: serverTimestamp() });
            } else {
                await addDoc(collection(db, 'plamo-slg-hangar'), { ...unitData, creatorId: user.uid, createdAt: serverTimestamp() });
            }
            onSave();
        } catch (error) {
            console.error("Error saving unit data:", error);
            alert("データの保存に失敗しました。");
        }
    };
    
    const stepMapping = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 }; // Corrected step mapping

    const renderStep = () => {
        if (isLoading) return <p>Loading wizard...</p>;
        
        switch(stepMapping[currentStep]) {
            case 1: // Basic Info & Forms
                return (
                    <div className="bg-gray-900 p-4 rounded-lg space-y-6">
                        <div>
                            <h3 className="font-bold text-lg mb-3 text-cyan-400">基本情報</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Input label="機体名" value={unitData.name || ''} onChange={e => handleUnitDataChange('name', e.target.value)} />
                                <Input label="ビルダー名" value={unitData.builder || ''} onChange={e => handleUnitDataChange('builder', e.target.value)} />
                                <Input label="画像ファイル名 (通常形態)" value={unitData.forms?.[0]?.imageFileName || ''} onChange={(e) => handleUnitDataChange('forms.0.imageFileName', e.target.value)} />
                            </div>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg mb-3 text-cyan-400">機体サイズ</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <Select label="基本サイズ" value={unitData.types?.size} onChange={(e) => handleUnitDataChange('types.size', e.target.value)}>
                                    {GAME_MASTER_DATA.sizeChart.map(s => <option key={s.sizeName} value={s.sizeName}>{s.sizeName}</option>)}
                                </Select>
                                <Select label="見かけ上のサイズ (任意)" value={unitData.types?.overrideApparentSize} onChange={(e) => handleUnitDataChange('types.overrideApparentSize', e.target.value)}>
                                    <option value="">基本サイズと同じ</option>
                                    {GAME_MASTER_DATA.sizeChart.map(s => <option key={s.sizeName} value={s.sizeName}>{s.sizeName}</option>)}
                                </Select>
                            </div>
                        </div>
                    </div>
                );
            case 2: // Parts HP/AP & Equipment
                 return <div className="bg-gray-900 p-4 rounded-lg"><h3 className="font-bold text-lg text-gray-500">ステップ2 実装中</h3></div>;
            case 3: // Weapons & Tanks
                 return <div className="bg-gray-900 p-4 rounded-lg"><h3 className="font-bold text-lg text-gray-500">ステップ3 実装中</h3></div>;
            case 4: // Types
                 return <div className="bg-gray-900 p-4 rounded-lg"><h3 className="font-bold text-lg text-gray-500">ステップ4 実装中</h3></div>;
            case 5: // Review & Save
                 return <div className="bg-gray-900 p-4 rounded-lg"><h3 className="font-bold text-lg text-gray-500">ステップ5 実装中</h3></div>;
            default:
                 return <div className="bg-gray-900 p-4 rounded-lg"><h3 className="font-bold text-lg text-gray-500">不明なステップ</h3></div>;
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-screen-xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-4">
                     <h2 className="text-2xl font-bold text-yellow-400">{unitId ? '機体データ編集ウィザード' : '機体データ作成ウィザード'}</h2>
                     <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl">&times;</button>
                </div>
                <div className="flex-grow overflow-y-auto pr-4 space-y-6">
                    {renderStep()}
                </div>
                <div className="mt-6 flex justify-between items-center pt-4 border-t border-gray-700">
                    <p className="text-sm text-gray-400">ステップ {currentStep} / 5</p>
                    <div className="flex gap-4">
                        <button onClick={() => setCurrentStep(p => Math.max(1, p - 1))} disabled={currentStep === 1} className="bg-gray-600 hover:bg-gray-500 font-bold py-2 px-4 rounded disabled:opacity-50">戻る</button>
                        {currentStep < 5 ? (
                            <button onClick={() => setCurrentStep(p => Math.min(5, p + 1))} className="bg-cyan-600 hover:bg-cyan-500 font-bold py-2 px-4 rounded">次へ</button>
                        ) : (
                            <button onClick={handleSave} className="bg-green-600 hover:bg-green-500 font-bold py-2 px-4 rounded">保存</button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default GmWizard;

