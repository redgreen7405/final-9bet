// pages/api/timer.js
import { setupLocalScheduler } from "../../../lib/localSchduler";
import { handleWinRequest } from "./winner-logic";
import { CronJob } from "cron";

const timers = [
  { label: "1min", duration: 60 },
  { label: "3min", duration: 180 },
  { label: "5min", duration: 300 },
  { label: "10min", duration: 600 },
];

export const runtime = "edge";

// Centralized start time stored globally for simplicity
let universalStartTime = 1743441030000;

// Track which periods have already been processed to avoid duplicate calls
const processedPeriods = new Set();

// Global variable to track if the cron job is already running
let cronJobRunning = false;

// Helper to calculate remaining time for a timer based on the universal start time
const getRemainingTime = (index) => {
  const now = Date.now();
  const elapsed = Math.floor((now - universalStartTime) / 1000); // Elapsed seconds
  const remaining = timers[index].duration - (elapsed % timers[index].duration); // Loop logic
  return remaining > 0 ? remaining : 0;
};

// Helper to calculate the current period number
const getCurrentPeriodNumber = (index) => {
  const now = Date.now();
  const elapsed = Math.floor((now - universalStartTime) / 1000); // Elapsed seconds
  return `${timers[index].label.replace("min", "M")}${
    new Date().toISOString().slice(0, 4) +
    (new Date().getMonth() + 1).toString().padStart(2, "0") +
    new Date().getDate().toString().padStart(2, "0")
  }${Math.floor(elapsed / timers[index].duration) + 1}`; // Period number
};

// API handler
export default async function handler(req) {
  if (req.method === "GET") {
    // Calculate remaining time and period number for all timers
    const remainingTimes = await Promise.all(
      timers.map(async (_, index) => {
        const remaining = getRemainingTime(index);
        const period = getCurrentPeriodNumber(index);

        // Check if timer is about to end (between 5-6 seconds left)
        // This ensures we only call the winner logic once per period
        // if (remaining >= 5 && remaining <= 6) {
        //   const periodKey = `${period}-${index}`;

        //   // Only process if this period hasn't been processed yet
        //   if (!processedPeriods.has(periodKey)) {
        //     try {
        //       console.log(`Calling winner logic for period ${period}`);
        //       // Call the winner logic API
        //       // await handleWinRequest(period);

        //       // Mark this period as processed
        //       processedPeriods.add(periodKey);

        //       // Clean up old processed periods (keep only the last 100)
        //       if (processedPeriods.size > 100) {
        //         const iterator = processedPeriods.values();
        //         processedPeriods.delete(iterator.next().value);
        //       }
        //     } catch (error) {
        //       console.error(
        //         `Error calling winner logic for period ${period}:`,
        //         error
        //       );
        //     }
        //   }
        // }

        return {
          label: timers[index].label,
          remaining: remaining,
          period: period,
        };
      })
    );

    // const job = new CronJob("* * * * * *", async function () {
    //   console.log("cron job started");
    //   // Process each timer sequentially instead of using map
    //   for (let index = 0; index < timers.length; index++) {
    //     const remaining = getRemainingTime(index);
    //     const period = getCurrentPeriodNumber(index);

    //     // Check if timer is about to end (between 5-6 seconds left)
    //     // This ensures we only call the winner logic once per period
    //     if (remaining === 5) {
    //       const periodKey = `${period}-${index}`;

    //       // Only process if this period hasn't been processed yet
    //       if (!processedPeriods.has(periodKey)) {
    //         try {
    //           console.log(`Calling winner logic for period ${period}`);
    //           // Call the winner API
    //           fetch(`http://localhost:3000/api/winner?period=${period}`)
    //             .then((response) => response.json())
    //             .then((data) => {
    //               console.log(
    //                 `Winner API response for period ${period}:`,
    //                 data
    //               );
    //             })
    //             .catch((error) => {
    //               console.error(
    //                 `Error calling winner API for period ${period}:`,
    //                 error
    //               );
    //             });

    //           processedPeriods.add(periodKey);

    //           // Clean up old processed periods (keep only the last 100)
    //           if (processedPeriods.size > 100) {
    //             const iterator = processedPeriods.values();
    //             processedPeriods.delete(iterator.next().value);
    //           }
    //         } catch (error) {
    //           console.error(
    //             `Error calling winner API for period ${period}:`,
    //             error
    //           );
    //         }
    //       }
    //     }
    //   }
    // });

    // Start the cron job only if it's not already running
    // job.start();

    // Return response with the remaining times as JSON
    return new Response(JSON.stringify({ timers: remainingTimes }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method === "POST" && req.url.includes("reset")) {
    // Reset the universal start time
    universalStartTime = Date.now();

    // Return a response confirming the reset
    return new Response(JSON.stringify({ message: "Timers reset" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { "Content-Type": "application/json" },
  });
}
