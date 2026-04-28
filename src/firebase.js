import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  runTransaction,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
  Timestamp,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyA8opMBeAjRXDx5CzfBGZbEnz2dwRkXfvw",
  authDomain: "picard-dashboard.firebaseapp.com",
  projectId: "picard-dashboard",
  storageBucket: "picard-dashboard.firebasestorage.app",
  messagingSenderId: "1040549507887",
  appId: "1:1040549507887:web:57ad214060fbf6a5ee27da"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)

export {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  runTransaction,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
  Timestamp,
}
