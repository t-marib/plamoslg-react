import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase/firebase.js';
import { collection, query, onSnapshot, doc, getDoc, setDoc, serverTimestamp, writeBatch, deleteDoc, getDocs } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';

function GmIndexPage() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newGameId, setNewGameId] = useState('');
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const authUnsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        signInAnonymously(auth).catch((err) => {
           console.error("Anonymous sign-in failed:", err);
           setError('認証に失敗しました。');
        });
      }
    });
    return () => authUnsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const sessionsCol = collection(db, 'plamo-slg-sessions');
    const q = query(sessionsCol);

    const dbUnsubscribe = onSnapshot(q, (querySnapshot) => {
      const gamesList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setGames(gamesList);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching GM games:", err);
      setError('ゲームリストの読み込みに失敗しました。');
      setLoading(false);
    });

    return () => dbUnsubscribe();
  }, [user]);

  const handleCreateGame = async () => {
    if (!newGameId.trim()) return alert('ゲームIDを入力してください。');
    if (!user) return alert('認証が完了していません。');

    const sessionRef = doc(db, 'plamo-slg-sessions', newGameId);
    const gameRef = doc(db, 'plamo-slg', newGameId);

    try {
      const docSnap = await getDoc(sessionRef);
      if (docSnap.exists()) return alert('そのゲームIDは既に使用されています。');

      const batch = writeBatch(db);
      batch.set(sessionRef, { gmId: user.uid, createdAt: serverTimestamp() });
      batch.set(gameRef, { gmId: user.uid, currentTurn: 1, currentSR: 1, createdAt: serverTimestamp() });
      await batch.commit();
      navigate(`/gm/${newGameId}`);
    } catch (err) {
      console.error("Error creating game session: ", err);
      alert('ゲームセッションの作成に失敗しました。');
    }
  };

  const handleDeleteGame = async (gameIdToDelete) => {
    if (!confirm(`本当にゲーム「${gameIdToDelete}」を削除しますか？\nこの操作は元に戻せません。`)) return;

    try {
        const gameRef = doc(db, 'plamo-slg', gameIdToDelete);
        const subcollections = ['units', 'teams', 'logs'];
        for (const sub of subcollections) {
            const subcollectionRef = collection(gameRef, sub);
            const snapshot = await getDocs(subcollectionRef);
            if (snapshot.size > 0) {
                const batch = writeBatch(db);
                snapshot.docs.forEach(doc => batch.delete(doc.ref));
                await batch.commit();
            }
        }
        await deleteDoc(gameRef);
        await deleteDoc(doc(db, 'plamo-slg-sessions', gameIdToDelete));
        alert(`ゲーム「${gameIdToDelete}」を削除しました。`);
    } catch (err) {
        console.error(`Failed to delete game ${gameIdToDelete}:`, err);
        alert(`ゲーム「${gameIdToDelete}」の削除に失敗しました。`);
    }
  };

  const renderGameList = () => {
    if (loading) return <p className="text-center text-gray-400">ゲームを読み込み中...</p>;
    if (error) return <p className="text-center text-red-500">{error}</p>;
    if (games.length === 0) return <p className="text-center text-gray-500">作成したゲームはありません。</p>;

    return games.map(game => (
        <div key={game.id} className="flex justify-between items-center bg-gray-700 p-3 rounded-md">
            <div>
                <span className="font-bold text-lg">{game.id}</span>
                <span className="text-xs text-gray-400 ml-2">作成者: {game.gmId ? game.gmId.substring(0, 8) : '不明'}...</span>
            </div>
            <div className="flex items-center gap-2">
                <Link to={`/gm/${game.id}`} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-1 px-3 rounded-md transition duration-300">入る</Link>
                <button onClick={() => handleDeleteGame(game.id)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-md transition duration-300">削除</button>
            </div>
        </div>
    ));
  };

  return (
    <div className="bg-gray-800 p-8 rounded-lg shadow-lg text-center max-w-lg mx-auto w-full">
        <p className="text-gray-400 mb-8">ゲームマスターとして参加</p>
        <div className="border-t border-gray-700 pt-8">
            <h2 className="text-xl font-semibold text-purple-400 mb-4">新しいゲームを作成</h2>
            <div className="flex flex-col sm:flex-row gap-2">
                <input type="text" value={newGameId} onChange={(e) => setNewGameId(e.target.value)} placeholder="新しいゲームIDを入力" className="flex-grow bg-gray-700 text-white p-3 rounded-md border border-gray-600"/>
                <button onClick={handleCreateGame} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-md transition duration-300">ゲームを作成</button>
            </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-8">
            <h2 className="text-xl font-semibold text-cyan-400 mb-4">既存のゲーム一覧</h2>
            <div className="space-y-3 text-left">{renderGameList()}</div>
        </div>
        <div className="mt-8">
            <Link to="/" className="text-cyan-400 hover:underline">プレイヤー用トップへ</Link>
        </div>
    </div>
  );
}

export default GmIndexPage;