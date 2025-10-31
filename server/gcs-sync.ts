// server/gcs-sync.ts (import into your main server)
import admin from 'firebase-admin';
import { Storage } from '@google-cloud/storage';
import serviceAccount from '../firebase-adminsdk.json';  // Your key
import gcsKey from '../gcs-key.json';  // Your GCS key

// Init Firebase
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const auth = admin.auth();

// Init GCS
const storage = new Storage({ keyFilename: './gcs-key.json' });
const bucket = storage.bucket(process.env.GCS_BUCKET!);

// Middleware: Verify Firebase ID token (from frontend header/cookie)
const verifyAuth = async (req: any, res: any, next: any) => {
  try {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ error: 'No token' });
    const decoded = await auth.verifyIdToken(idToken);
    req.user = { uid: decoded.uid };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Example: Sync tasks (POST /api/tasks/sync) - Like TaskWarrior's 'task sync'
app.post('/api/tasks/sync', verifyAuth, async (req, res) => {
  const { uid } = req.user;
  const { tasks } = req.body;  // Array of task objects from frontend (or CLI export)

  try {
    // User-specific path (isolate data)
    const userPath = `users/${uid}/tasks.json`;
    const file = bucket.file(userPath);

    // Upload (encrypt if needed: use crypto lib client-side)
    await file.save(JSON.stringify(tasks, null, 2), { contentType: 'application/json' });

    // Or for TaskWarrior format: Export as pend/completed UUIDs, upload blob
    // const taskDbBlob = Buffer.from(taskExport);  // Your TaskWarrior DB export logic
    // await file.save(taskDbBlob);

    res.json({ message: 'Synced', path: userPath });
  } catch (err) {
    res.status(500).json({ error: 'Sync failed' });
  }
});

// GET /api/tasks - Download user tasks
app.get('/api/tasks', verifyAuth, async (req, res) => {
  const { uid } = req.user;
  const userPath = `users/${uid}/tasks.json`;
  const file = bucket.file(userPath);

  try {
    const [exists] = await file.exists();
    if (!exists) return res.json([]);  // Empty for new users

    const [data] = await file.download();
    const tasks = JSON.parse(data.toString());
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Fetch failed' });
  }
});

// Register/Login: Reuse Firebase (no backend needed, but proxy if wanted)
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const userRecord = await admin.auth().createUser({ email, password });
    // Init empty user folder in GCS
    await bucket.file(`users/${userRecord.uid}/`).create();  // Placeholder
    res.json({ uid: userRecord.uid });
  } catch (err) {
    res.status(400).json({ error: 'Registration failed' });
  }
});
