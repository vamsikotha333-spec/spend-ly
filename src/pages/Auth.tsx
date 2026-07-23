import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Wallet, Eye, EyeOff, Check, X, User, Mail, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

function PasswordInput({
  value,
  onChange,
  placeholder,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  id?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        id={id}
        type={show ? "text" : "password"}
        required
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9 pr-10 h-11 rounded-lg"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition"
        tabIndex={-1}
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function checkPassword(pw: string) {
  return {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /\d/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  };
}

function Requirement({ met, label }: { met: boolean; label: string }) {
  return (
    <li className={cn("flex items-center gap-1.5 text-xs transition-colors", met ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
      {met ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
      {label}
    </li>
  );
}

function friendlySignUpError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("registered") || m.includes("already") || m.includes("exists")) return "This email is already registered.";
  if (m.includes("invalid") && m.includes("email")) return "Please enter a valid email address.";
  if (m.includes("password")) return "Password does not meet the requirements.";
  return "We couldn't create your account. Please try again.";
}
function friendlySignInError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid credentials")) return "Incorrect email or password.";
  if (m.includes("email not confirmed")) return "Please confirm your email before signing in.";
  return "We couldn't sign you in. Please try again.";
}

export default function Auth() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">("signin");

  // Sign in
  const [siEmail, setSiEmail] = useState("");
  const [siPassword, setSiPassword] = useState("");
  const [siLoading, setSiLoading] = useState(false);

  // Sign up
  const [fullName, setFullName] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPassword, setSuPassword] = useState("");
  const [suConfirm, setSuConfirm] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [suLoading, setSuLoading] = useState(false);
  const [suErrors, setSuErrors] = useState<{ name?: string; email?: string; password?: string; confirm?: string }>({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/", { replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate("/", { replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const pwChecks = useMemo(() => checkPassword(suPassword), [suPassword]);
  const pwScore = Object.values(pwChecks).filter(Boolean).length;
  const pwStrength =
    suPassword.length === 0 ? null : pwScore <= 2 ? "weak" : pwScore <= 4 ? "medium" : "strong";
  const passwordsMatch = suConfirm.length > 0 && suPassword === suConfirm;
  const allValid =
    fullName.trim().length >= 3 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(suEmail.trim()) &&
    pwScore === 5 &&
    passwordsMatch &&
    agreed;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSiLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: siEmail.trim(), password: siPassword });
    setSiLoading(false);
    if (error) toast.error(friendlySignInError(error.message));
    else toast.success("Welcome back!");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof suErrors = {};
    const name = fullName.trim();
    if (name.length < 3) errs.name = "Full name must be at least 3 characters.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(suEmail.trim())) errs.email = "Please enter a valid email address.";
    if (Object.values(pwChecks).some((v) => !v)) errs.password = "Password does not meet all requirements.";
    if (suPassword !== suConfirm) errs.confirm = "Passwords do not match.";
    setSuErrors(errs);
    if (Object.keys(errs).length > 0 || !agreed) return;

    setSuLoading(true);
    const { error } = await supabase.auth.signUp({
      email: suEmail.trim(),
      password: suPassword,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: name },
      },
    });
    setSuLoading(false);
    if (error) {
      const friendly = friendlySignUpError(error.message);
      toast.error(friendly);
      if (friendly.includes("registered")) setSuErrors((p) => ({ ...p, email: friendly }));
      return;
    }
    toast.success("Welcome to FinTracker! Your workspace has been created successfully.");
  };

  const handleGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
  };

  const strengthColor =
    pwStrength === "strong" ? "bg-emerald-500" : pwStrength === "medium" ? "bg-amber-500" : "bg-red-500";
  const strengthWidth =
    pwStrength === "strong" ? "w-full" : pwStrength === "medium" ? "w-2/3" : pwStrength === "weak" ? "w-1/3" : "w-0";
  const strengthLabel =
    pwStrength === "strong" ? "Strong" : pwStrength === "medium" ? "Medium" : pwStrength === "weak" ? "Weak" : "";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/40 p-4">
      <Card className="w-full max-w-md p-8 shadow-xl border-border/60 rounded-2xl">
        <div className="flex flex-col items-center mb-6">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">FinTracker</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {tab === "signin" ? "Sign in to access your finances" : "Create your account to get started"}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full mb-4 gap-2 h-11 rounded-lg"
          onClick={handleGoogle}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </Button>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or with email</span>
          </div>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={handleSignIn} className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <Label htmlFor="si-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input id="si-email" type="email" required value={siEmail} onChange={(e) => setSiEmail(e.target.value)} className="pl-9 h-11 rounded-lg" placeholder="you@example.com" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="si-password">Password</Label>
                <PasswordInput id="si-password" value={siPassword} onChange={setSiPassword} placeholder="Your password" />
              </div>
              <Button type="submit" className="w-full h-11 rounded-lg" disabled={siLoading}>
                {siLoading ? "Signing in..." : "Sign In"}
              </Button>
              <Button
                type="button"
                variant="link"
                className="w-full"
                onClick={async () => {
                  if (!siEmail) return toast.error("Enter your email first");
                  const { error } = await supabase.auth.resetPasswordForEmail(siEmail.trim(), {
                    redirectTo: `${window.location.origin}/reset-password`,
                  });
                  if (error) toast.error("Could not send reset link. Please try again.");
                  else toast.success("Password reset link sent. Check your inbox.");
                }}
              >
                Forgot password?
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <Label htmlFor="su-name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="su-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => { setFullName(e.target.value); setSuErrors((p) => ({ ...p, name: undefined })); }}
                    placeholder="Enter your full name"
                    className="pl-9 h-11 rounded-lg"
                  />
                </div>
                {suErrors.name && <p className="text-xs text-destructive">{suErrors.name}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="su-email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="su-email"
                    type="email"
                    required
                    value={suEmail}
                    onChange={(e) => { setSuEmail(e.target.value); setSuErrors((p) => ({ ...p, email: undefined })); }}
                    placeholder="you@example.com"
                    className="pl-9 h-11 rounded-lg"
                  />
                </div>
                {suErrors.email && <p className="text-xs text-destructive">{suErrors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="su-password">Password</Label>
                <PasswordInput id="su-password" value={suPassword} onChange={(v) => { setSuPassword(v); setSuErrors((p) => ({ ...p, password: undefined })); }} placeholder="Create a strong password" />

                {suPassword.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className={cn("h-full transition-all", strengthColor, strengthWidth)} />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground w-14 text-right">{strengthLabel}</span>
                    </div>
                    <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
                      <Requirement met={pwChecks.length} label="8+ characters" />
                      <Requirement met={pwChecks.upper} label="Uppercase letter" />
                      <Requirement met={pwChecks.lower} label="Lowercase letter" />
                      <Requirement met={pwChecks.number} label="Number" />
                      <Requirement met={pwChecks.special} label="Special character" />
                    </ul>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="su-confirm">Confirm Password</Label>
                <PasswordInput id="su-confirm" value={suConfirm} onChange={(v) => { setSuConfirm(v); setSuErrors((p) => ({ ...p, confirm: undefined })); }} placeholder="Re-enter your password" />
                {suConfirm.length > 0 && !passwordsMatch && (
                  <p className="text-xs text-destructive">Passwords do not match.</p>
                )}
                {passwordsMatch && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><Check className="h-3.5 w-3.5" /> Passwords match</p>
                )}
              </div>

              <div className="flex items-start gap-2 pt-1">
                <Checkbox id="terms" checked={agreed} onCheckedChange={(v) => setAgreed(!!v)} className="mt-0.5" />
                <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer select-none">
                  I agree to the <a href="#" className="text-primary hover:underline">Terms &amp; Conditions</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
                </label>
              </div>

              <Button type="submit" className="w-full h-11 rounded-lg" disabled={suLoading || !allValid}>
                {suLoading ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
