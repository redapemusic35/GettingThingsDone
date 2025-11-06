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
  Timestamp,
} from "firebase/firestore";
import { db, auth } from "../firebase";
// client/src/hooks/useFirestoreTasks.ts
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Task } from "@shared/schema";

export function useFirestoreTasks(
  filter?: "active" | "context" | "tag",
  value?: string
) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) {
      console.log("No user logged in → returning empty tasks");
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

    console.log("Firestore query:", { filter, value, uid: auth.currentUser.uid });

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
          } as Task;
        });
        console.log("Firestore tasks loaded:", list);
        setTasks(list);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore error:", err);
        setLoading(false);
      }
    );

    return () => {
      console.log("Unsubscribing from Firestore");
      unsubscribe();
    };
  }, [filter, value]);

  return { tasks, loading };
}

// ────── ADD TASK ──────
// client/src/hooks/useFirestoreTasks.ts
export async function addTask(
  data: Omit<Task, "id" | "uid" | "createdAt">
): Promise<string> {
  if (!auth.currentUser) throw new Error("Not logged in");

  const payload = {
    ...data,
    uid: auth.currentUser.uid,
    createdAt: serverTimestamp(),
  };

  console.log("addTask payload →", payload); // ← DEBUG

  const docRef = await addDoc(collection(db, "tasks"), payload);
  console.log("Task saved with ID:", docRef.id); // ← SUCCESS
  return docRef.id;
}

// ────── COMPLETE TASK ──────
export async function completeTask(id: string): Promise<void> {
  await updateDoc(doc(db, "tasks", id), { status: "completed" });
  console.log("Task completed:", id);
}

// ────── DELETE TASK (optional) ──────
export async function deleteTask(id: string): Promise<void> {
  await deleteDoc(doc(db, "tasks", id));
  console.log("Task deleted:", id);
}
