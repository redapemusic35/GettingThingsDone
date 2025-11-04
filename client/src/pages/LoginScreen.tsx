// client/src/pages/LoginScreen.tsx
import { useState } from "react";
import { View, TextInput, Button, Alert, ActivityIndicator } from "react-native";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

export default function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const signUp = async () => {
    console.log("Create Account clicked");
    setLoading(true);
    try {
      console.log("Calling Firebase...", { email });
      await createUserWithEmailAndPassword(auth, email, password);
      console.log("Account created!");
      onSuccess();
    } catch (e: any) {
      console.error("ERROR:", e.code, e.message);
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async () => {
    console.log("Sign In clicked");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("Signed in!");
      onSuccess();
    } catch (e: any) {
      console.error("ERROR:", e.code, e.message);
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} />
      <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      {loading ? <ActivityIndicator /> : (
        <>
          <Button title="Sign In" onPress={signIn} />
          <Button title="Create Account" onPress={signUp} />
        </>
      )}
    </View>
  );
}
