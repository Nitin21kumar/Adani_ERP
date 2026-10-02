import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Lock, Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { useAuditAuth } from "@/contexts/AuditAuthContext";
import adaniPowerLogo from "@/assets/adani-power-logo.jpg";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type LoginFormValues = z.infer<typeof loginSchema>;

const roleHome: Record<string, string> = {
  audit_admin: "/audit/admin/dashboard",
  auditor: "/audit/auditor/dashboard",
  mis_verifier: "/audit/mis/dashboard",
};

/** Dedicated login screen for the Asset Audit Portal — entirely separate from the Employee ERP's /login page and AuthContext. */
export default function AuditLogin() {
  const navigate = useNavigate();
  const { login } = useAuditAuth();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginFormValues) => {
    setSubmitting(true);
    try {
      const user = await login(values);
      toast.success(`Welcome back, ${user.name}`);
      navigate(roleHome[user.role] || "/audit/login", { replace: true });
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Invalid email or password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-soft p-4">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-md">
        <Card className="glass shadow-xl">
          <CardHeader className="items-center text-center">
            <img src={adaniPowerLogo} alt="Adani Power" className="mb-2 h-24 w-24 rounded-xl bg-white object-contain shadow-sm" />
            <p className="text-2xl font-bold tracking-tight text-brand-gradient">Adani Power</p>
            <p className="text-sm font-medium text-muted-foreground">Asset Audit Portal</p>
            <CardDescription>Sign in with your audit account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="you@company.com" className="pl-9" autoCapitalize="none" {...register("email")} />
                </div>
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="password" type="password" placeholder="••••••••" className="pl-9" {...register("password")} />
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              For auditors, MIS verifiers, and audit administrators only. Employee ERP accounts cannot sign in here.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
