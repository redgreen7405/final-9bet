/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    runtime: "edge",
  },
};

export default nextConfig;

// Initialize cron job only once at server startup
// This will only run in development or on the server, not during build
if (
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PHASE === "phase-production-server"
) {
  // import("./lib/cronScheduler.js")
  //   .then(({ setupCronJob }) => {
  //     setTimeout(() => {
  //       setupCronJob();
  //     }, 5000);
  //     fetchTimerData();
  //     console.log("Cron job initialized at server startup");
  //   })
  //   .catch((error) => {
  //     console.error("Failed to initialize cron job:", error);
  //   });
  import("./lib/localSchduler.js")
    .then(({ setupLocalScheduler }) => {
      setupLocalScheduler();
      console.log("Cron job initialized at server startup");
    })
    .catch((error) => {
      console.error("Failed to initialize cron job:", error);
    });
}

// Example function to fetch from the `/api/timer` route
export const fetchTimerData = async () => {
  try {
    // await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/timer`);
    await fetch("https://9bets.in/api/timer");
  } catch (error) {
    console.error("Failed to fetch timer data:", error);
  }
};

// Call the function at runtime initialization
fetchTimerData();
