// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCyoP4G25ENZ3VJRP1ZixxEeEQhYhSRcWI",
  authDomain: "chat-app-4a5eb.firebaseapp.com",
  projectId: "chat-app-4a5eb",
  storageBucket: "chat-app-4a5eb.appspot.com",
  messagingSenderId: "299047134705",
  appId: "1:299047134705:web:fcf623734c829c6fa69050",
  measurementId: "G-ZPGRTQ70M2"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);

export { auth, app, firestore };
