/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    runtime: "nodejs", // Ensures Next.js API runs in a Node.js environment
  },
};

export default nextConfig;

const isServer = typeof window === "undefined";

import("./src/lib/localSchduler.js")
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

const fetchTimerData = async () => {
  try {
    await fetch(`https://9bets.in/api/timer`);
    console.log("✅ Timer data fetched from", `https://9bets.in`);
  } catch (error) {
    console.error("❌ Failed to fetch timer data:", error);
  }
};

console.log(
  "process.env.NEXT_PUBLIC_SITE_URL:",
  process.env.NEXT_PUBLIC_SITE_URL
);
