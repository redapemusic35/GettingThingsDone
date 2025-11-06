// client/src/hooks/useFirestoreTasks.ts
import { useEffect, useState, useRef } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  getDocs,
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

  // --- FETCH ONCE on mount / login ---
  const fetchTasks = async () => {
    if (!auth.currentUser) return;
    setLoading(true);

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
      console.log("Fetched →", list.length, "tasks");
      setTasks(list);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Clean up old listener
    if (unsubRef.current) {
      console.log("Cleaning up old listener");
      unsubRef.current();
      unsubRef.current = null;
    }

    if (!auth.currentUser) {
      setTasks([]);
      setLoading(false);
      return;
    }

    // --- FETCH ONCE ---
    fetchTasks();

    // --- REAL‑TIME LISTENER ---
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

    console.log("Starting real-time listener →", { filter, value });

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Task[];
        console.log("Live update →", list.length, "tasks");
        setTasks(list);
      },
      (err) => console.error("Listener error:", err)
    );

    unsubRef.current = unsub;

    return () => {
      if (unsubRef.current) {
        console.log("Unsubscribing");
        unsubRef.current();
      }
    };
  }, [filter, value, auth.currentUser?.uid]);

  return { tasks, loading, refetch: fetchTasks };
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
