import React, { useState, useEffect } from 'react';

import firebase from 'firebase/app';
import firestore from 'firebase/firestore';
import 'firebase/auth';


const firebaseConfig = {
  apiKey: "AIzaSyCz_Ad1i7jehRpqrgtKGtnrvzkOXinnQz4",
  authDomain: "radiator-c38a6.firebaseapp.com",
  databaseURL: "https://radiator-c38a6.firebaseio.com",
  projectId: "radiator-c38a6",
  storageBucket: "radiator-c38a6.appspot.com",
  messagingSenderId: "745140813294",
  appId: "1:745140813294:web:c73b3e7f70588f6fdce2ff"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth;

const logout = () => { auth().signOut() };

const objectFromDocs = snapshot => {
  const hash = {};
  snapshot.docs.map(doc => hash[doc.id] = doc.data());
  return hash;
}

const listFromDocs = snapshot => snapshot.docs.map(d => d.data());

function useFirestoreCollection(path, {where, type = 'hash'} = {}) {
  const [data, setData] = useState({});

  useEffect(() => {
    let collection = db.collection(path);
    if (where) collection = collection.where(...where);
    const unsub = collection.onSnapshot(snapshot => {
      if (type === 'hash') {
        setData(objectFromDocs(snapshot));
      } else {
        setData(listFromDocs(snapshot));
      }
    });

    return () => { unsub() };
  }, [path]);

  return data;
}

export {
  firebaseConfig, auth, db, logout, useFirestoreCollection
}
