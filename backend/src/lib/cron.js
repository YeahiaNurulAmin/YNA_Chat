import { CronJob } from "cron";

function getHealthUrl(port) {
  const baseUrl =
    process.env.RENDER_EXTERNAL_URL ||
    process.env.APP_URL ||
    `http://localhost:${port}`;

  return `${baseUrl.replace(/\/$/, "")}/health`;
}

async function pingHealth(healthUrl) {
  try {
    const response = await fetch(healthUrl);
    const data = await response.json();
    console.log(
      `[cron] Health ping OK (${response.status}): ${data.message ?? "ok"}`
    );
  } catch (error) {
    console.error("[cron] Health ping failed:", error.message);
  }
}

export function startCronJobs(port = process.env.PORT || 3000) {
  const healthUrl = getHealthUrl(port);

  console.log(`[cron] Keep-alive enabled — pinging ${healthUrl} every 14 minutes`);

  pingHealth(healthUrl);

  const job = new CronJob(
    "*/14 * * * *",
    () => pingHealth(healthUrl),
    null,
    true,
    "UTC"
  );

  return job;
}
