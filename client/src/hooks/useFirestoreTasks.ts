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
  deleteDoc,
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

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Task[];
        setTasks(list);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore error:", err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [filter, value]);

  return { tasks, loading };
}

// Helper: Add a task
export async function addTask(task: Omit<Task, "id" | "uid" | "createdAt">) {
  if (!auth.currentUser) throw new Error("Not logged in");
  return await addDoc(collection(db, "tasks"), {
    ...task,
    uid: auth.currentUser.uid,
    createdAt: serverTimestamp(),
  });
}

// Helper: Update a task
export async function updateTask(id: string, updates: Partial<Task>) {
  if (!auth.currentUser) throw new Error("Not logged in");
  return await updateDoc(doc(db, "tasks", id), updates);
}

// Helper: Delete a task
export async function deleteTask(id: string) {
  if (!auth.currentUser) throw new Error("Not logged in");
  return await deleteDoc(doc(db, "tasks", id));
}
