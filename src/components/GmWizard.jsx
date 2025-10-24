import { useState, useEffect } from 'react';
import { db } from '../firebase/firebase';
import { collection, doc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { GAME_MASTER_DATA } from '../data/gameData';
import WizardStep2 from './wizard/WizardStep2';
import WizardStep3 from './wizard/WizardStep3';
import WizardStep4 from './wizard/WizardStep4';
import WizardStep5 from './wizard/WizardStep5';

const Input = ({ label, ...props }) => ( <label className="block text-sm"><span className="text-gray-400">{label}</span><input className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm p-2" {...props} /></label> );
const Select = ({ label, children, ...props }) => ( <label className="block text-sm"><span className="text-gray-400">{label}</span><select className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm p-2" {...props}>{children}</select></label> );

function GmWizard({ initialUnitData, unitId, onSave, onClose, user }) {
    const [currentStep, setCurrentStep] = useState(1);
    const [unitData, setUnitData] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const defaultForms = [{ name: '通常形態', moveType: '全方向', imageFileName: '' }];
        const defaultTypes = { size: 'M', unitType: '汎用型', combatType: '汎用型', armamentType: '汎用型', srReducedWeaponIndices: [] };
        let processedData = initialUnitData ? JSON.parse(JSON.stringify(initialUnitData)) : null;

        if (processedData && processedData.largeArmaments) {
            (processedData.largeArmaments || []).forEach(armament => {
                const existing = (processedData.hitLocationTable || []).find(h => h.part === armament.name);
                if (!existing) {
                    if (!processedData.hitLocationTable) processedData.hitLocationTable = [];
                    processedData.hitLocationTable.push({ part: armament.name, basePartForStats: '胸部', range: [0, 0], isLargeArmament: true, size: armament.size || 'M' });
                }
                if (!processedData.parts) processedData.parts = {};
                processedData.parts[armament.name] = { unitPoints: armament.unitPoints, internalEquipment: armament.internalEquipment, externalEquipment: armament.externalEquipment };
            });
            delete processedData.largeArmaments;
        }

        if (processedData) {
            setUnitData({
                ...processedData,
                forms: processedData.forms?.length ? processedData.forms : defaultForms,
                types: { ...defaultTypes, ...processedData.types },
                hitLocationTable: processedData.hitLocationTable || [...GAME_MASTER_DATA.defaultHitLocationTable],
            });
        } else {
            const defaultParts = {};
            GAME_MASTER_DATA.defaultHitLocationTable.forEach(p => { defaultParts[p.part] = { unitPoints: 0, internalEquipment: [], externalEquipment: [] }; });
            setUnitData({ name: '', builder: '', forms: defaultForms, types: defaultTypes, parts: defaultParts, weapons: [], tanks: [], hitLocationTable: [...GAME_MASTER_DATA.defaultHitLocationTable] });
        }
        setIsLoading(false);
    }, [initialUnitData]);

    const handleUnitDataChange = (path, value) => {
        setUnitData(prev => {
            const keys = path.split('.');
            const newState = JSON.parse(JSON.stringify(prev));
            let current = newState;
            for (let i = 0; i < keys.length - 1; i++) {
                if (current[keys[i]] === undefined || current[keys[i]] === null) {
                    if (!isNaN(parseInt(keys[i+1], 10))) { current[keys[i]] = []; } else { current[keys[i]] = {}; }
                }
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
            return newState;
        });
    };

    const handleHitLocationChange = (index, field, value, isRangeEnd = false) => {
        const newTable = JSON.parse(JSON.stringify(unitData.hitLocationTable));
        const oldPartName = newTable[index].part;
        if (field === 'range') {
            newTable[index].range[isRangeEnd ? 1 : 0] = value;
        } else {
            newTable[index][field] = value;
        }
        const newPartName = newTable[index].part;
        setUnitData(prev => {
            const newParts = { ...prev.parts };
            if (field === 'part' && oldPartName !== newPartName) {
                newParts[newPartName] = prev.parts[oldPartName] || { unitPoints: 0 };
                delete newParts[oldPartName];
            }
            return { ...prev, hitLocationTable: newTable, parts: newParts };
        });
    };
    
    const addHitLocation = (isLargeArmament = false) => {
        const partName = isLargeArmament ? `新規大型武装${(unitData.hitLocationTable.filter(h => h.isLargeArmament).length || 0) + 1}` : `新規部位${(unitData.hitLocationTable.length || 0) + 1}`;
        const newHitLocation = { part: partName, basePartForStats: '胸部', range: [0, 0], isLargeArmament: isLargeArmament, size: 'M' };
        setUnitData(prev => ({
            ...prev,
            hitLocationTable: [...(prev.hitLocationTable || []), newHitLocation],
            parts: { ...prev.parts, [partName]: { unitPoints: 0, internalEquipment: [], externalEquipment: [] } }
        }));
    };

    const removeHitLocation = (indexToRemove) => {
        const partNameToRemove = unitData.hitLocationTable[indexToRemove].part;
        setUnitData(prev => {
            const newParts = { ...prev.parts };
            delete newParts[partNameToRemove];
            return { ...prev, hitLocationTable: prev.hitLocationTable.filter((_, i) => i !== indexToRemove), parts: newParts };
        });
    };
    
    const handleSave = async () => {
        if (!unitData.name || !unitData.builder) { return alert("機体名とビルダー名は必須です。"); }
        const finalUnitData = { ...unitData, imageFileName: unitData.forms?.[0]?.imageFileName || '' };
        try {
            if (unitId) {
                await updateDoc(doc(db, 'plamo-slg-hangar', unitId), { ...finalUnitData, updatedAt: serverTimestamp() });
            } else {
                await addDoc(collection(db, 'plamo-slg-hangar'), { ...finalUnitData, creatorId: user.uid, createdAt: serverTimestamp() });
            }
            onSave();
        } catch (error) { console.error("Error saving unit data:", error); alert("データの保存に失敗しました。"); }
    };
    
    const handleFormChange = (index, field, value) => {
        const newForms = JSON.parse(JSON.stringify(unitData.forms));
        newForms[index][field] = value;
        handleUnitDataChange('forms', newForms);
    };

    const addForm = () => {
        const newForm = { name: `新形態${(unitData.forms || []).length + 1}`, moveType: '全方向', imageFileName: '' };
        handleUnitDataChange('forms', [...(unitData.forms || []), newForm]);
    };

    const removeForm = (indexToRemove) => {
        if (unitData.forms && unitData.forms.length > 1) {
            handleUnitDataChange('forms', unitData.forms.filter((_, i) => i !== indexToRemove));
        }
    };

    const stepMapping = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 };

    const renderStep = () => {
        if (isLoading) return <p>Loading wizard...</p>;
        
        switch(stepMapping[currentStep]) {
            case 1:
                const totalUnitPoints = unitData.parts ? Object.values(unitData.parts).reduce((sum, part) => sum + (part.unitPoints || 0), 0) : 0;
                const basePartOptions = Object.keys(GAME_MASTER_DATA.sizeBasedStats['M'].parts);
                const mainBodyParts = (unitData.hitLocationTable || []).filter(h => !h.isLargeArmament);
                const largeArmaments = (unitData.hitLocationTable || []).filter(h => h.isLargeArmament);
                return (
                    <div className="bg-gray-900 p-4 rounded-lg space-y-8">
                        <div>
                            <h3 className="font-bold text-lg mb-3 text-cyan-400">ステップ1: 基本情報 & 形態</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Input label="機体名" value={unitData.name || ''} onChange={e => handleUnitDataChange('name', e.target.value)} /><Input label="ビルダー名" value={unitData.builder || ''} onChange={e => handleUnitDataChange('builder', e.target.value)} /></div>
                        </div>
                        <div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Select label="基本サイズ" value={unitData.types?.size} onChange={(e) => handleUnitDataChange('types.size', e.target.value)}>{GAME_MASTER_DATA.sizeChart.map(s => <option key={s.sizeName} value={s.sizeName}>{s.sizeName}</option>)}</Select><Select label="見かけ上のサイズ (任意)" value={unitData.types?.overrideApparentSize} onChange={(e) => handleUnitDataChange('types.overrideApparentSize', e.target.value)}><option value="">基本サイズと同じ</option>{GAME_MASTER_DATA.sizeChart.map(s => <option key={s.sizeName} value={s.sizeName}>{s.sizeName}</option>)}</Select></div>
                        </div>
                        <div>
                            <h4 className="font-bold text-lg mb-3 text-teal-400">機体形態</h4>
                            <div className="grid grid-cols-11 gap-x-4 gap-y-2 text-xs text-gray-400 mb-1 px-2 items-end"><span className="col-span-4">形態名</span><span className="col-span-4">画像ファイル名</span><span className="col-span-2">移動タイプ</span><span className="col-span-1"></span></div>
                            <div className="space-y-2">{(unitData.forms || []).map((form, index) => (<div key={index} className="grid grid-cols-11 gap-x-4 gap-y-2 items-center"><div className="col-span-4"><Input value={form.name} onChange={e => handleFormChange(index, 'name', e.target.value)} /></div><div className="col-span-4"><Input value={form.imageFileName} onChange={e => handleFormChange(index, 'imageFileName', e.target.value)} /></div><div className="col-span-2"><Select value={form.moveType} onChange={e => handleFormChange(index, 'moveType', e.target.value)}><option value="全方向">全方向</option><option value="前方のみ">前方のみ</option></Select></div><div className="col-span-1 text-center">{index > 0 && <button onClick={() => removeForm(index)} className="text-red-500 hover:text-red-400 text-2xl font-bold">×</button>}</div></div>))}</div>
                            <button onClick={addForm} className="mt-3 text-sm bg-teal-600 hover:bg-teal-500 py-1 px-3 rounded">+ 形態を追加</button>
                        </div>
                        <div>
                            <h4 className="font-bold text-lg mb-3 text-cyan-400">命中判定 部位設定</h4>
                            <div className="grid grid-cols-12 gap-x-4 gap-y-2 text-xs text-gray-400 mb-1 px-2 items-end"><span className="col-span-3">部位名</span><span className="col-span-3">基本部位</span><span className="col-span-3 text-center">命中範囲</span><span className="col-span-2">機体ポイント</span><span className="col-span-1"></span></div>
                            <div className="space-y-2">{mainBodyParts.map((hit) => {const originalIndex = (unitData.hitLocationTable || []).findIndex(h => h.part === hit.part); return (<div key={originalIndex} className="grid grid-cols-12 gap-x-4 gap-y-2 items-center"><div className="col-span-3"><Input value={hit.part} onChange={e => handleHitLocationChange(originalIndex, 'part', e.target.value)} /></div><div className="col-span-3"><Select value={hit.basePartForStats || hit.part} onChange={e => handleHitLocationChange(originalIndex, 'basePartForStats', e.target.value)}>{basePartOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}</Select></div><div className="col-span-3 flex items-center gap-2"><Input type="number" value={hit.range[1]} onChange={e => handleHitLocationChange(originalIndex, 'range', parseInt(e.target.value) || 0, true)} /><span>-</span><Input type="number" value={hit.range[0]} onChange={e => handleHitLocationChange(originalIndex, 'range', parseInt(e.target.value) || 0, false)} /></div><div className="col-span-2"><Input type="number" value={unitData.parts?.[hit.part]?.unitPoints || 0} onChange={e => handleUnitDataChange(`parts.${hit.part}.unitPoints`, parseInt(e.target.value) || 0)} /></div><div className="col-span-1 text-center"><button onClick={() => removeHitLocation(originalIndex)} className="text-red-500 hover:text-red-400 text-2xl font-bold">×</button></div></div>)})}</div>
                            <button onClick={() => addHitLocation(false)} className="mt-3 text-sm bg-gray-600 hover:bg-gray-500 py-1 px-3 rounded">+ 部位を追加</button>
                        </div>
                        <div>
                            <h4 className="font-bold text-lg mb-3 text-yellow-400">大型武装 設定</h4>
                             <div className="grid grid-cols-12 gap-x-4 gap-y-2 text-xs text-gray-400 mb-1 px-2 items-end"><span className="col-span-6">武装名</span><span className="col-span-3">サイズ</span><span className="col-span-2">機体ポイント</span><span className="col-span-1"></span></div>
                            <div className="space-y-2">{largeArmaments.map((hit) => { const originalIndex = (unitData.hitLocationTable || []).findIndex(h => h.part === hit.part); return (<div key={originalIndex} className="grid grid-cols-12 gap-x-4 gap-y-2 items-center"><div className="col-span-6"><Input value={hit.part} onChange={e => handleHitLocationChange(originalIndex, 'part', e.target.value)} /></div><div className="col-span-3"><Select value={hit.size || 'M'} onChange={e => handleHitLocationChange(originalIndex, 'size', e.target.value)}>{GAME_MASTER_DATA.sizeChart.map(s => <option key={s.sizeName} value={s.sizeName}>{s.sizeName}</option>)}</Select></div><div className="col-span-2"><Input type="number" value={unitData.parts?.[hit.part]?.unitPoints || 0} onChange={e => handleUnitDataChange(`parts.${hit.part}.unitPoints`, parseInt(e.target.value) || 0)} /></div><div className="col-span-1 text-center"><button onClick={() => removeHitLocation(originalIndex)} className="text-red-500 hover:text-red-400 text-2xl font-bold">×</button></div></div>)})}</div>
                            <button onClick={() => addHitLocation(true)} className="mt-3 text-sm bg-yellow-600 hover:bg-yellow-500 py-1 px-3 rounded">+ 大型武装を追加</button>
                        </div>
                        <div className="mt-4 p-3 bg-gray-950 rounded-lg flex justify-around text-center"><div><p className="text-sm text-gray-400">機体ポイント合計</p><p className="text-xl font-bold text-cyan-400">{totalUnitPoints}</p></div></div>
                    </div>
                );
            case 2: return <WizardStep2 unitData={unitData} handleUnitDataChange={handleUnitDataChange} />;
            case 3: return <WizardStep3 unitData={unitData} handleUnitDataChange={handleUnitDataChange} />;
            case 4: return <WizardStep4 unitData={unitData} handleUnitDataChange={handleUnitDataChange} />;
            case 5: return <WizardStep5 unitData={unitData} />;
            default: return <div className="bg-gray-900 p-4 rounded-lg"><h3 className="font-bold text-lg text-gray-500">不明なステップ</h3></div>;
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