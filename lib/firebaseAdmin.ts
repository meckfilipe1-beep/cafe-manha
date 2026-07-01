import admin from "firebase-admin"

function getServiceAccount() {
  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!encoded) return null
  try {
    return JSON.parse(Buffer.from(encoded, "base64").toString())
  } catch {
    return null
  }
}

function initAdmin() {
  const serviceAccount = getServiceAccount()
  if (!admin.apps.length) {
    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      })
    } else {
      admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "tapicuz-aa78f",
      })
    }
  }
  return admin
}

export { admin, initAdmin }
