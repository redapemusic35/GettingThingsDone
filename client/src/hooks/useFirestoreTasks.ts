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

export function useFirestoreTasks(
  filter?: "active" | "context" | "tag",
  value?: string
) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Clean up any previous listener
    if (unsubRef.current) {
      console.log("Cleaning up old listener");
      unsubRef.current();
      unsubRef.current = null;
    }

    if (!auth.currentUser) {
      console.log("No user → empty tasks");
      setTasks([]);
      setLoading(false);
      return;
    }

    let q = query(
      collection(db, "tasks"),
      where("uid", "==", auth.currentUser.uid),
      orderBy("createdAt", "desc")
    );

    if (filter === "active") {
      q = query(q, where("status", "==", "active"));
    } else if (filter === "context" && value) {
      q = query(q, where("context", "==", value));
    } else if (filter === "tag" && value) {
      q = query(q, where("tags", "array-contains", value));
    }

    console.log("Starting Firestore listener →", { filter, value, uid: auth.currentUser.uid });

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Task[];
        console.log("Snapshot received →", list);
        setTasks(list);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore listener error:", err);
        setLoading(false);
      }
    );

    unsubRef.current = unsub;

    return () => {
      console.log("Unsubscribing from Firestore");
      if (unsubRef.current) unsubRef.current();
    };
  }, [filter, value]);

  return { tasks, loading };
}

// ────── ADD TASK ──────
export async function addTask(
  data: Omit<Task, "id" | "uid" | "createdAt">
): Promise<string> {
  if (!auth.currentUser) throw new Error("Not logged in");

  const payload = {
    ...data,
    uid: auth.currentUser.uid,
    createdAt: serverTimestamp(),
  };
  console.log("addTask payload →", payload);

  const ref = await addDoc(collection(db, "tasks"), payload);
  console.log("Task saved →", ref.id);
  return ref.id;
}

// ────── COMPLETE TASK ──────
export async function completeTask(id: string) {
  await updateDoc(doc(db, "tasks", id), { status: "completed" });
  console.log("Task completed →", id);
}
