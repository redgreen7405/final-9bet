/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    runtime: "edge",
  },
};

export default nextConfig;

// Helper to safely run server-side tasks only
const isServer = typeof window === "undefined";

// Initialize cron job only on the server and not during build
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

// Example function to fetch timer data from API route
const fetchTimerData = async () => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  try {
    await fetch(`${siteUrl}/api/timer`);
    console.log("✅ Timer data fetched from", siteUrl);
  } catch (error) {
    console.error("❌ Failed to fetch timer data:", error);
  }
};

if (isServer) {
  fetchTimerData();
}

console.log("process.env.NEXT_PUBLIC_SITE_URL:", process.env.NEXT_PUBLIC_SITE_URL);
