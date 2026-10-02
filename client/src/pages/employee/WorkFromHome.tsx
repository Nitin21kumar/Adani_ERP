import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CalendarDays, Loader2, Paperclip, Send } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import StatusBadge from "@/components/shared/StatusBadge";
import { wfhService } from "@/services/wfhService";
import { uploadService } from "@/services/uploadService";

const schema = z
  .object({
    reason: z.string().min(5, "Please provide a short reason"),
    expected_work: z.string().min(5, "Describe what you plan to work on"),
    from_date: z.string().min(1, "Required"),
    to_date: z.string().min(1, "Required"),
  })
  .refine((d) => d.to_date >= d.from_date, { message: "To date must be after from date", path: ["to_date"] });

type FormValues = z.infer<typeof schema>;

export default function EmployeeWFH() {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const { data: myRequests } = useQuery({ queryKey: ["wfh", "me"], queryFn: wfhService.myRequests });

  const applyMutation = useMutation({
    mutationFn: wfhService.apply,
    onSuccess: () => {
      toast.success("WFH request submitted for approval.");
      reset();
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ["wfh"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || "Failed to submit WFH request"),
  });

  const onSubmit = async (values: FormValues) => {
    let attachment_url: string | undefined;
    if (file) {
      setUploading(true);
      try {
        attachment_url = await uploadService.upload(file);
      } catch {
        toast.error("Attachment upload failed — submitting without it.");
      } finally {
        setUploading(false);
      }
    }
    applyMutation.mutate({ ...values, attachment_url });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Work From Home</h1>
        <p className="text-sm text-muted-foreground">Request remote work days and track approval.</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="glass">
          <CardHeader>
            <CardTitle>Submit WFH Request</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>From Date</Label>
                <Input type="date" {...register("from_date")} />
                {errors.from_date && <p className="text-xs text-destructive">{errors.from_date.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>To Date</Label>
                <Input type="date" {...register("to_date")} />
                {errors.to_date && <p className="text-xs text-destructive">{errors.to_date.message}</p>}
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Reason</Label>
                <textarea
                  className="flex min-h-[70px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  placeholder="Why do you need to work from home?"
                  {...register("reason")}
                />
                {errors.reason && <p className="text-xs text-destructive">{errors.reason.message}</p>}
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Expected Work</Label>
                <textarea
                  className="flex min-h-[70px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  placeholder="What do you plan to accomplish?"
                  {...register("expected_work")}
                />
                {errors.expected_work && <p className="text-xs text-destructive">{errors.expected_work.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Attachment (optional)</Label>
                <div className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="file"
                    className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={applyMutation.isPending || uploading}>
                  {(applyMutation.isPending || uploading) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Submit Request
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      <Card className="glass">
        <CardHeader>
          <CardTitle>My WFH History</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-medium">Dates</th>
                <th className="px-6 py-3 font-medium">Reason</th>
                <th className="px-6 py-3 font-medium">Expected Work</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Comment</th>
              </tr>
            </thead>
            <tbody>
              {myRequests?.map((w) => (
                <tr key={w.id} className="border-b border-border/50 last:border-0">
                  <td className="px-6 py-3">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {format(new Date(w.from_date), "MMM d")} – {format(new Date(w.to_date), "MMM d, yyyy")}
                    </span>
                  </td>
                  <td className="max-w-xs truncate px-6 py-3">{w.reason}</td>
                  <td className="max-w-xs truncate px-6 py-3">{w.expected_work}</td>
                  <td className="px-6 py-3"><StatusBadge status={w.status} /></td>
                  <td className="max-w-xs truncate px-6 py-3 text-muted-foreground">{w.review_comment || "—"}</td>
                </tr>
              ))}
              {!myRequests?.length && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No WFH requests yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
