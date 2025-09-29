import admin from "firebase-admin";

let app;

if (!admin.apps.length) {
  // Parse the JSON string from .env.local
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} else {
  app = admin.app();
}

const db = admin.firestore();

export { db };
