// Import the functions you need from the SDKs you need
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/storage";
import "firebase/compat/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCVyK-yiM-IEh6m4Z5faDyNnez7ikoCK3U",
  authDomain: "sneakylink-68f57.firebaseapp.com",
  databaseURL: "https://sneakylink-68f57-default-rtdb.firebaseio.com",
  projectId: "sneakylink-68f57",
  storageBucket: "sneakylink-68f57.appspot.com",
  messagingSenderId: "844381457733",
  appId: "1:844381457733:web:2a31b8f161729e3d20422c",
  measurementId: "G-QF8283TPHJ",
};

// Initialize Firebase
let app;
if (firebase.apps.length === 0) {
  app = firebase.initializeApp(firebaseConfig);
} else {
  app = firebase.app();
}

const auth = firebase.auth();
const storage = firebase.storage();
const database = firebase.database();
const firestore = firebase.firestore();

export { auth, storage, database, firestore };
