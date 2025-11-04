// client/src/pages/LoginScreen.tsx
import { useState } from "react";
import {
  View,
  TextInput,
  Button,
  Alert,
  ActivityIndicator,
  Text,
} from "react-native";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../firebase";

export default function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  // ← Real, empty fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const signUp = async () => {
    console.log("Create Account pressed");
    setLoading(true);
    try {
      console.log("Calling createUserWithEmailAndPassword…", { email });
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      console.log("Success – UID:", cred.user.uid);
      onSuccess();
    } catch (e: any) {
      console.error("Sign‑up error:", e.code, e.message);
      Alert.alert("Sign‑up failed", e.message);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async () => {
    console.log("Sign‑In pressed");
    setLoading(true);
    try {
      console.log("Calling signInWithEmailAndPassword…", { email });
      const cred = await signInWithEmailAndPassword(auth, email, password);
      console.log("Success – UID:", cred.user.uid);
      onSuccess();
    } catch (e: any) {
      console.error("Sign‑in error:", e.code, e.message);
      Alert.alert("Sign‑in failed", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#fff" }}>
      <Text style={{ fontSize: 28, fontWeight: "bold", textAlign: "center", marginBottom: 30 }}>
        GTD Task Manager
      </Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          padding: 14,
          marginBottom: 12,
          borderRadius: 8,
          backgroundColor: "#f9f9f9",
        }}
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          padding: 14,
          marginBottom: 20,
          borderRadius: 8,
          backgroundColor: "#f9f9f9",
        }}
      />

      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <>
          <Button title="Sign In" onPress={signIn} />
          <View style={{ height: 12 }} />
          <Button title="Create Account" onPress={signUp} />
        </>
      )}
    </View>
  );
}
