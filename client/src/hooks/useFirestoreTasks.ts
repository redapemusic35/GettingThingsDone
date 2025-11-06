// client/src/hooks/useFirestoreTasks.ts
import { useEffect, useState, useRef } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  orderBy,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { Task } from "@shared/schema";

type Filter = "active" | "context" | "tag" | "project" | "archive";

export function useFirestoreTasks(filter?: Filter, value?: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const unsubRef = useRef<(() => void) | null>(null);

  const fetchAndListen = async () => {
    if (!auth.currentUser) {
      setTasks([]);
      setLoading(false);
      return;
    }

    // --- 1. FETCH ONCE ---
    let q = query(
      collection(db, "tasks"),
      where("uid", "==", auth.currentUser.uid),
      orderBy("createdAt", "desc")
    );

    if (filter === "active") q = query(q, where("status", "==", "active"));
    else if (filter === "context" && value) q = query(q, where("context", "==", value));
    else if (filter === "tag" && value) q = query(q, where("tags", "array-contains", value));
    else if (filter === "project" && value) q = query(q, where("project", "==", value));
    else if (filter === "archive") q = query(q, where("status", "==", "completed"));

    try {
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Task[];
      console.log("Initial fetch →", list.length, "tasks");
      setTasks(list);
      setLoading(false);
    } catch (e) {
      console.error("Fetch failed:", e);
      setLoading(false);
    }

    // --- 2. LIVE LISTENER ---
    if (unsubRef.current) unsubRef.current();

    const liveQ = q; // reuse same query
    const unsub = onSnapshot(
      liveQ,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Task[];
        console.log("Live update →", list.length, "tasks");
        setTasks(list);
      },
      (err) => console.error("Live sync error:", err)
    );

    unsubRef.current = unsub;
  };

  useEffect(() => {
    fetchAndListen();

    return () => {
      if (unsubRef.current) {
        console.log("Unsubscribing from live sync");
        unsubRef.current();
      }
    };
  }, [filter, value, auth.currentUser?.uid]);

  const refetch = () => {
    console.log("Manual refetch");
    fetchAndListen();
  };

  return { tasks, loading, refetch };
}

// ADD TASK
export async function addTask(data: Omit<Task, "id" | "uid" | "createdAt">) {
  if (!auth.currentUser) throw new Error("Not logged in");
  const payload = { ...data, uid: auth.currentUser.uid, createdAt: serverTimestamp() };
  const ref = await addDoc(collection(db, "tasks"), payload);
  console.log("Task added →", ref.id);
  return ref.id;
}

// COMPLETE TASK
export async function completeTask(id: string) {
  await updateDoc(doc(db, "tasks", id), { status: "completed" });
}
