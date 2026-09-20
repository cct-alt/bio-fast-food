// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, collection, query, orderBy, limit, getDocs } from "firebase/firestore";

// ⚠️ 請替換成您在 Firebase Console 取得的設定！
const firebaseConfig = {

    apiKey: "AIzaSyCtwSIO14lU56LR6L5T8fszTYB_JjD_qUc",

    authDomain: "biofastfood-f490a.firebaseapp.com",

    projectId: "biofastfood-f490a",

    storageBucket: "biofastfood-f490a.firebasestorage.app",

    messagingSenderId: "291945493605",

    appId: "1:291945493605:web:62a6d978161cd1e7ea428c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 📌 儲存分數：以「班級-學號」作為唯一 ID，只有破紀錄才會更新
export async function saveScore(classStr, studentNo, newScore) {
    try {
        const studentId = `${classStr}-${studentNo}`;
        const docRef = doc(db, "leaderboard", studentId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            // 如果已經有紀錄，判斷新分數是否更高
            if (newScore > docSnap.data().score) {
                await setDoc(docRef, { classStr, studentNo, score: newScore }, { merge: true });
                return "破紀錄啦！分數已更新！";
            } else {
                return "分數已記錄 (未打破個人最高分)";
            }
        } else {
            // 如果沒有紀錄，直接寫入
            await setDoc(docRef, { classStr, studentNo, score: newScore });
            return "分數上傳成功！";
        }
    } catch (error) {
        console.error("寫入分數失敗: ", error);
        return "連線失敗，請檢查網路。";
    }
}

// 📌 取得排行榜：抓取分數最高的前 10 名
export async function getLeaderboard() {
    try {
        const q = query(collection(db, "leaderboard"), orderBy("score", "desc"), limit(10));
        const querySnapshot = await getDocs(q);
        let top10 = [];
        querySnapshot.forEach((doc) => {
            top10.push(doc.data());
        });
        return top10;
    } catch (error) {
        console.error("讀取排行榜失敗: ", error);
        return [];
    }
}
