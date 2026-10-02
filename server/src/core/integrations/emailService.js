export async function sendEmail({ to, subject, text }) { console.info(`Email queued for ${to}: ${subject}`); return { delivered: false, provider: "console", text }; }
