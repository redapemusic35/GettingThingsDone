// client/src/hooks/useFirestoreTasks.ts
import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
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

  const fetch = async () => {
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

    if (filter === "active") q = query(q, where("status", "==", "active"));
    else if (filter === "context" && value) q = query(q, where("context", "==", value));
    else if (filter === "tag" && value) q = query(q, where("tags", "array-contains", value));
    else if (filter === "project" && value) q = query(q, where("project", "==", value));
    else if (filter === "archive") q = query(q, where("status", "==", "completed"));

    try {
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Task[];
      console.log("Fetched", list.length, "tasks");
      setTasks(list);
    } catch (e) {
      console.error("Fetch failed:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, [filter, value, auth.currentUser?.uid]);

  return { tasks, loading, refetch: fetch };
}

// ADD TASK
export async function addTask(data: Omit<Task, "id" | "uid" | "createdAt">) {
  if (!auth.currentUser) throw new Error("Not logged in");
  const payload = { ...data, uid: auth.currentUser.uid, createdAt: serverTimestamp() };
  const ref = await addDoc(collection(db, "tasks"), payload);
  console.log("Added task →", ref.id);
  return ref.id;
}

// COMPLETE TASK
export async function completeTask(id: string) {
  await updateDoc(doc(db, "tasks", id), { status: "completed" });
}
