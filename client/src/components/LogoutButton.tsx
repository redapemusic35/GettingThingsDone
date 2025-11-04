// client/src/components/LogoutButton.tsx
import { Button } from "../components/ui/button";
import { LogOut } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useToast } from "../hooks/use-toast";

export default function LogoutButton() {
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Logged out", description: "See you later!" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <Button variant="ghost" size="icon" onClick={handleLogout}>
      <LogOut className="h-5 w-5" />
    </Button>
  );
}
