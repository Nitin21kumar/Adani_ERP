import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Loader2, Paperclip, Save, Send } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { dailyReportService } from "@/services/dailyReportService";
import { uploadService } from "@/services/uploadService";

const schema = z.object({
  task_description: z.string().min(5, "Describe the work done"),
});

type FormValues = z.infer<typeof schema>;

export default function EmployeeDailyWork() {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: today, isLoading: loadingToday } = useQuery({
    queryKey: ["daily-report", "today"],
    queryFn: dailyReportService.today,
  });

  const { data: history } = useQuery({
    queryKey: ["daily-report", "history"],
    queryFn: () => dailyReportService.myReports(30),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (today) {
      reset({ task_description: today.task_description });
    }
  }, [today, reset]);

  const submitMutation = useMutation({
    mutationFn: dailyReportService.submit,
    onSuccess: () => {
      toast.success("Report submitted for today.");
      queryClient.invalidateQueries({ queryKey: ["daily-report"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || "Failed to submit report"),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: FormValues & { attachment_url?: string }) =>
      dailyReportService.update(today!.id, payload),
    onSuccess: () => {
      toast.success("Today's report updated.");
      queryClient.invalidateQueries({ queryKey: ["daily-report"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || "Failed to update report"),
  });

  const onSubmit = async (values: FormValues) => {
    let attachment_url: string | undefined;
    if (file) {
      setUploading(true);
      try {
        attachment_url = await uploadService.upload(file);
      } catch {
        toast.error("Attachment upload failed — continuing without it.");
      } finally {
        setUploading(false);
      }
    }
    if (today) {
      updateMutation.mutate({ ...values, attachment_url });
    } else {
      submitMutation.mutate({ ...values, attachment_url });
    }
  };

  const isBusy = submitMutation.isPending || updateMutation.isPending || uploading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Daily Work Report</h1>
        <p className="text-sm text-muted-foreground">
          {today ? "You can edit today's report until midnight." : "Submit what you worked on today."}
        </p>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="glass">
          <CardHeader>
            <CardTitle>{format(new Date(), "EEEE, MMMM d, yyyy")}</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingToday ? (
              <p className="text-muted-foreground">Loading…</p>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <textarea
                    className="flex min-h-[120px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    placeholder="What did you accomplish today?"
                    {...register("task_description")}
                  />
                  {errors.task_description && <p className="text-xs text-destructive">{errors.task_description.message}</p>}
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
                {today?.admin_comments && (
                  <div className="rounded-md bg-secondary/60 p-3 text-sm">
                    <span className="font-medium">Admin comment: </span>
                    {today.admin_comments}
                  </div>
                )}
                <div>
                  <Button type="submit" disabled={isBusy}>
                    {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : today ? <Save className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                    {today ? "Update Report" : "Submit Report"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Report History</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Description</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {history?.map((r) => (
                <tr key={r.id} className="border-b border-border/50 last:border-0">
                  <td className="px-6 py-3 whitespace-nowrap">{format(new Date(r.report_date), "MMM d, yyyy")}</td>
                  <td className="px-6 py-3 text-muted-foreground">{r.task_description}</td>
                  <td className="px-6 py-3 capitalize text-muted-foreground">{r.status}</td>
                </tr>
              ))}
              {!history?.length && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">No reports submitted yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
