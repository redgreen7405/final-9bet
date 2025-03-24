import { CronJob } from "cron";

const timers = [
  { label: "1min", duration: 60 },
  { label: "3min", duration: 180 },
  { label: "5min", duration: 300 },
  { label: "10min", duration: 600 },
];

// Centralized start time stored globally for simplicity
let universalStartTime = new Date();
// Track which periods have already been processed to avoid duplicate calls
const processedPeriods = new Set();

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
    Math.floor(elapsed / timers[index].duration) + 123456
  }`; // Period number
};

// Keep track of whether the job has been initialized
let isInitialized = false;
// Store the job instance
let jobInstance = null;

// Your cron job setup
export function setupCronJob() {
  // If the job is already initialized, don't create a new one
  if (isInitialized) {
    console.log("Cron job already initialized, skipping setup");
    return jobInstance;
  }

  console.log("Setting up new cron job");
  let count = 0;

  jobInstance = new CronJob("* * * * * *", async function () {
    try {
      count++;
      // Log less frequently to reduce console spam
      console.log(count + "Cron job has run");
      if (count === 1 || count % 30 === 0) {
        console.log(`Cron job has run ${count} times`);
      }

      // Process each timer sequentially
      for (let index = 0; index < timers.length; index++) {
        const remaining = getRemainingTime(index);
        const period = getCurrentPeriodNumber(index);

        // Check if timer is about to end (at exactly 5 seconds left)
        if (remaining === 5) {
          const periodKey = `${period}-${index}`;

          // Only process if this period hasn't been processed yet
          if (!processedPeriods.has(periodKey)) {
            try {
              console.log(`Calling winner logic for period ${period}`);
              // Call the winner API
              // fetch(`http://localhost:3000/api/winner?period=${period}`)
              //   .then((response) => response.json())
              //   .then((data) => {
              //     console.log(
              //       `Winner API response for period ${period}:`,
              //       data
              //     );
              //   })
              //   .catch((error) => {
              //     console.error(
              //       `Error calling winner API for period ${period}:`,
              //       error
              //     );
              //   });

              processedPeriods.add(periodKey);

              // Clean up old processed periods (keep only the last 100)
              if (processedPeriods.size > 100) {
                const iterator = processedPeriods.values();
                processedPeriods.delete(iterator.next().value);
              }
            } catch (error) {
              console.error(
                `Error calling winner API for period ${period}:`,
                error
              );
            }
          }
        }
      }
    } catch (error) {
      console.error("Error in cron job:", error);
    }
  });

  jobInstance.start();
  isInitialized = true;
  console.log("Cron job scheduled and started");

  return jobInstance;
}
