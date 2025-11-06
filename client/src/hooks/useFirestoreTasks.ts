// client/src/hooks/useFirestoreTasks.ts
import { useEffect, useState } from "react";
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

  useEffect(() => {
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

    console.log("Query →", { filter, value, uid: auth.currentUser.uid });

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Task[];
        console.log("Snapshot →", list);
        setTasks(list);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
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
