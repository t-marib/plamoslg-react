import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig';

// Firebaseアプリを初期化
const app = initializeApp(firebaseConfig);

// 各サービスを取得してエクスポート
export const auth = getAuth(app);
export const db = getFirestore(app);
