import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Lock, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import CompanyLogo from "@/components/shared/CompanyLogo";
import { useAuth } from "@/contexts/AuthContext";
import { useGeolocation } from "@/hooks/useGeolocation";
import { reverseGeocode } from "@/utils/deviceInfo";
import type { RoleName } from "@/types";

const loginSchema = z.object({
  username: z.string().min(1, "Enter your email or Employee ID"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { request: requestLocation } = useGeolocation();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema), defaultValues: { rememberMe: true } });

  const onSubmit = async (values: LoginFormValues) => {
    setSubmitting(true);
    try {
      const coords = await requestLocation();
      // Location permission may be denied or unavailable — that's fine,
      // login must never be blocked by it. Only attempt reverse geocoding
      // when we actually have coordinates to work with.
      const address = coords ? await reverseGeocode(coords.latitude, coords.longitude) : null;
      const user = await login({
        username: values.username,
        password: values.password,
        remember_me: !!values.rememberMe,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
        full_address: address ?? undefined,
      });

      toast.success(`Welcome back, ${user.email}`);
      // Identity verification now happens at attendance punch-in/punch-out
      // (see EmployeeAttendance), not here at app login.
      const roleHome = ["super_admin", "admin", "hr", "manager"].includes(user.role.name as RoleName)
        ? "/admin/dashboard"
        : "/employee/dashboard";
      navigate(roleHome, { replace: true });
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Invalid email/Employee ID or password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-soft p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Card className="glass shadow-xl">
          <CardHeader className="items-center text-center">
            <CompanyLogo
              size={88}
              showName
              className="mb-2 flex-col gap-2"
              nameClassName="text-2xl font-bold tracking-tight"
            />
            <CardDescription>Sign in to your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Email or Employee ID</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Admin: you@company.com · Others: EMP0001"
                    className="pl-9"
                    autoCapitalize="none"
                    {...register("username")}
                  />
                </div>
                {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="password" type="password" placeholder="••••••••" className="pl-9" {...register("password")} />
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="h-4 w-4 rounded border-border" {...register("rememberMe")} />
                  Remember me
                </label>
                <Link to="/forgot-password" className="text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
