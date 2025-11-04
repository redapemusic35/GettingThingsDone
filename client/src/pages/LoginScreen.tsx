// client/src/pages/LoginScreen.tsx
import { useState } from "react";
import { View, TextInput, Button, Alert, ActivityIndicator } from "react-native";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../firebase";

export default function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("123456");
  const [loading, setLoading] = useState(false);

  const signUp = async () => {
    setLoading(true);
    try {
      console.log("Signing up...", { email });
      await createUserWithEmailAndPassword(auth, email, password);
      console.log("Signed up!");
      onSuccess();
    } catch (e: any) {
    console.error("Sign-up error:", e.code, e.message);
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async () => {
    setLoading(true);
    try {
      console.log("Signing in...", { email });
      await signInWithEmailAndPassword(auth, email, password);
      console.log("Signed in!");
      onSuccess();
    } catch (e: any) {
      console.error("Sign-in error:", e.code, e.message);
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        style={{ borderWidth: 1, padding: 12, marginBottom: 12, borderRadius: 6 }}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, padding: 12, marginBottom: 20, borderRadius: 6 }}
      />
      {loading ? (
        <ActivityIndicator />
      ) : (
        <>
          <Button title="Sign In" onPress={signIn} />
          <View style={{ height: 10 }} />
          <Button title="Create Account" onPress={signUp} />
        </>
      )}
    </View>
  );
}
