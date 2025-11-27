import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await login(email, password);
      toast({ title: "Welcome back" });
      navigate("/dashboard");
    } catch (err: any) {
      toast({
        title: "Login failed",
        description: err.message,
        variant: "destructive",
      });
    }
    setSubmitting(false);
  }

  function onReset() {
    if (!email)
      return toast({
        title: "Enter email",
        description: "Provide your email to reset.",
      });
    toast({
      title: "Password reset",
      description: "A reset link would be sent when email is configured.",
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-elegant animate-enter"
      >
        <h1 className="text-2xl font-display">Admin Login</h1>
        <div className="mt-4 grid gap-3">
          <div>
            <label className="text-sm">Email</label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
          </div>
          <div>
            <label className="text-sm">Password</label>
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
          </div>
          <Button type="submit" variant="gold" disabled={submitting}>
            {submitting ? "Signing in..." : "Sign In"}
          </Button>
          <button type="button" onClick={onReset} className="text-sm underline">
            Forgot password?
          </button>
        </div>
      </form>
    </div>
  );
}
