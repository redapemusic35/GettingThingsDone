// client/src/hooks/useFirestoreTasks.ts
import { useEffect, useState, useRef } from "react";
import {
  collection,
  query,
  where,
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

  useEffect(() => {
    // Clean up old listener
    if (unsubRef.current) {
      console.log("Cleaning up old listener");
      unsubRef.current();
      unsubRef.current = null;
    }

    const user = auth.currentUser;
    if (!user) {
      console.log("No user → empty tasks");
      setTasks([]);
      setLoading(false);
      return;
    }

    let q = query(
      collection(db, "tasks"),
      where("uid", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    if (filter === "active") q = query(q, where("status", "==", "active"));
    else if (filter === "context" && value) q = query(q, where("context", "==", value));
    else if (filter === "tag" && value) q = query(q, where("tags", "array-contains", value));
    else if (filter === "project" && value) q = query(q, where("project", "==", value));
    else if (filter === "archive") q = query(q, where("status", "==", "completed"));

    console.log("Starting listener for UID:", user.uid, { filter, value });

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Task[];
        console.log("Snapshot →", list.length, "tasks");
        setTasks(list);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore error:", err);
        setLoading(false);
      }
    );

    unsubRef.current = unsub;

    return () => {
      console.log("Unsubscribing");
      if (unsubRef.current) unsubRef.current();
    };
  }, [filter, value, auth.currentUser?.uid]); // ← Re-run on login

  return { tasks, loading };
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
