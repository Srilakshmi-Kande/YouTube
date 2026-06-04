// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC-mFbfpETpHXrZHTNHpFYaLhswvLPY0Mg",
  authDomain: "yourtube-e0f39.firebaseapp.com",
  projectId: "yourtube-e0f39",
  storageBucket: "yourtube-e0f39.firebasestorage.app",
  messagingSenderId: "440074061002",
  appId: "1:440074061002:web:03e5937a4697b5f8796033"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export {auth,provider};