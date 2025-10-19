import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db, auth } from '../firebase/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';

function HomePage() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Firebase Authで匿名認証
    onAuthStateChanged(auth, (user) => {
      if (user) {
        // ゲームセッション一覧をリアルタイムで取得
        const sessionsCol = collection(db, 'plamo-slg-sessions');
        const q = query(sessionsCol, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const gamesList = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setGames(gamesList);
          setLoading(false);
        }, (err) => {
          console.error("Error fetching game sessions: ", err);
          setError('ゲームリストの読み込みに失敗しました。');
          setLoading(false);
        });

        // コンポーネントがアンマウントされた時にリスナーを解除
        return () => unsubscribe();
      } else {
        signInAnonymously(auth).catch((err) => {
          console.error("Anonymous sign-in failed:", err);
          setError('認証に失敗しました。');
          setLoading(false);
        });
      }
    });
  }, []); // 空の依存配列で、初回レンダリング時にのみ実行

  const renderGameList = () => {
    if (loading) {
      return <p className="text-center text-gray-400">アクティブなゲームを読み込み中...</p>;
    }
    if (error) {
      return <p className="text-center text-red-500">{error}</p>;
    }
    if (games.length === 0) {
      return <p className="text-center text-gray-500">現在、参加可能なゲームはありません。</p>;
    }
    return games.map((game) => (
      <Link
        key={game.id}
        to={`/player/${game.id}`}
        className="block w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-md transition duration-300 text-center"
      >
        {game.id}
      </Link>
    ));
  };

  return (
    <div className="bg-gray-800 p-8 rounded-lg shadow-lg text-center max-w-lg mx-auto w-full">
      <p className="text-gray-400 mb-8">プレイヤーとして参加</p>
      <div>
        <h2 className="text-xl font-semibold text-blue-400 mb-4">参加するゲームを選択してください</h2>
        <div className="space-y-3 text-left">
          {renderGameList()}
        </div>
      </div>
      <div className="mt-8">
        <Link to="/gm" className="text-cyan-400 hover:underline">GMはこちら</Link>
      </div>
    </div>
  );
}

export default HomePage;
