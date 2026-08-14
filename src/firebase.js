import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const SCORES_COLLECTION = "scores";

/**
 * 반응 속도 기록을 Firestore에 저장한다.
 * @param {string} nickname
 * @param {number} ms
 */
export async function saveScore(nickname, ms) {
  await addDoc(collection(db, SCORES_COLLECTION), {
    nickname,
    ms,
    createdAt: serverTimestamp(),
  });
}

/**
 * 반응 속도가 가장 빠른(ms가 작은) 순으로 상위 n개 기록을 가져온다.
 * @param {number} n
 * @returns {Promise<Array<{ nickname: string, ms: number }>>}
 */
export async function getTop(n) {
  const q = query(
    collection(db, SCORES_COLLECTION),
    orderBy("ms", "asc"),
    limit(n),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data());
}
