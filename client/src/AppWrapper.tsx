// client/src/AppWrapper.tsx
import { useAuth } from "./hooks/useAuth";
import Home from "./pages/Home";
import LoginScreen from "./pages/LoginScreen";
import { View, ActivityIndicator, Text } from "react-native";

export default function AppWrapper() {
  const { user, loading, error } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 12 }}>Loading…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: "red" }}>{error}</Text>
      </View>
    );
  }

  return user ? <Home /> : <LoginScreen onSuccess={() => {}} />;
}
