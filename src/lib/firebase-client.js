import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

const firebaseConfig = {
  apiKey: 'AIzaSyBdldIWl9iz7bFSEHgd5xkqnZtsLY2EkSg',
  authDomain: 'nexus-app-61494.firebaseapp.com',
  projectId: 'nexus-app-61494',
  storageBucket: 'nexus-app-61494.firebasestorage.app',
  messagingSenderId: '835373837904',
  appId: '1:835373837904:web:050099d87ff2ea7ff16b55',
  measurementId: 'G-GBRXVLMWVK',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const fns = getFunctions(app, 'europe-west1');

export const getSanitasBalance = () => httpsCallable(fns, 'getSanitasBalance');
export const redeemSanitas = () => httpsCallable(fns, 'redeemSanitas');
export const linkWalletAddress = () => httpsCallable(fns, 'linkWalletAddress');
export const convertXpToSanitas = () => httpsCallable(fns, 'convertXpToSanitas');
