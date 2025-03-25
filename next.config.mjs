/** @type {import('next').NextConfig} */
const nextConfig = {};

export default nextConfig;

const isServer = typeof window === "undefined";

if (
  isServer &&
  (process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PHASE === "phase-production-server")
) {
  import("./lib/localScheduler.js")
    .then(({ setupLocalScheduler }) => {
      setTimeout(() => {
        setupLocalScheduler();
        console.log("✅ Cron job initialized at server startup");
      }, 5000);
      fetchTimerData();
    })
    .catch((error) => {
      console.error("❌ Failed to initialize cron job:", error);
    });
}

const fetchTimerData = async () => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  try {
    await fetch(`${siteUrl}/api/timer`);
    console.log("✅ Timer data fetched from", siteUrl);
  } catch (error) {
    console.error("❌ Failed to fetch timer data:", error);
  }
};

console.log("process.env.NEXT_PUBLIC_SITE_URL:", process.env.NEXT_PUBLIC_SITE_URL);
