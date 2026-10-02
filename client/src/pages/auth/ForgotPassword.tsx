import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { User as UserIcon, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { authService } from "@/services/authService";

const schema = z.object({ identifier: z.string().min(1, "Enter your email or Employee ID") });
type FormValues = z.infer<typeof schema>;

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      await authService.forgotPassword(values.identifier);
      setSent(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-soft p-4">
      <Card className="glass w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle>Forgot Password</CardTitle>
          <CardDescription>
            {sent
              ? "If that account exists, a reset link has been sent to its registered email."
              : "Enter your email or Employee ID — we'll send a reset link to the email on file for that account."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!sent ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identifier">Email or Employee ID</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="identifier" className="pl-9" placeholder="you@company.com or EMP0001" {...register("identifier")} />
                </div>
                {errors.identifier && <p className="text-xs text-destructive">{errors.identifier.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Send Reset Link
              </Button>
            </form>
          ) : null}
          <Link to="/login" className="mt-4 flex items-center gap-1 text-sm text-primary hover:underline">
            <ArrowLeft className="h-3 w-3" /> Back to login
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
