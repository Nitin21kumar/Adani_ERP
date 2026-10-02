import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "@/services/authService";

const schema = z
  .object({
    old_password: z.string().min(1, "Required"),
    new_password: z.string().min(8, "Minimum 8 characters"),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, { message: "Passwords do not match", path: ["confirm_password"] });

type FormValues = z.infer<typeof schema>;

export default function ChangePassword() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => authService.changePassword(values.old_password, values.new_password),
    onSuccess: () => {
      toast.success("Password changed successfully.");
      reset();
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || "Failed to change password"),
  });

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Change Password</h1>
        <p className="text-sm text-muted-foreground">Choose a strong, unique password.</p>
      </div>

      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><KeyRound className="h-4 w-4" /> Update Password</CardTitle>
          <CardDescription>You'll stay logged in after changing your password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Current Password</Label>
              <Input type="password" {...register("old_password")} />
              {errors.old_password && <p className="text-xs text-destructive">{errors.old_password.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>New Password</Label>
              <Input type="password" {...register("new_password")} />
              {errors.new_password && <p className="text-xs text-destructive">{errors.new_password.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Confirm New Password</Label>
              <Input type="password" {...register("confirm_password")} />
              {errors.confirm_password && <p className="text-xs text-destructive">{errors.confirm_password.message}</p>}
            </div>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
