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

type FilterType = "active" | "context" | "tag" | "project" | "archive";

export function useFirestoreTasks(filter?: FilterType, value?: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (unsubRef.current) unsubRef.current();
    if (!auth.currentUser) {
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
    } else if (filter === "project" && value) {
      q = query(q, where("project", "==", value));
    } else if (filter === "archive") {
      q = query(q, where("status", "==", "completed"));
    }

    console.log("Firestore query →", { filter, value });

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Task[];
        console.log("Snapshot →", list);
        setTasks(list);
        setLoading(false);
      },
      (err) => console.error("Firestore error:", err)
    );

    unsubRef.current = unsub;
    return () => unsubRef.current?.();
  }, [filter, value]);

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
