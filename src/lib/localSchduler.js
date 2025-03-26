let isInitialized = false;

const timers = [
  { label: "1min", duration: 60 },
  { label: "3min", duration: 180 },
  { label: "5min", duration: 300 },
  { label: "10min", duration: 600 },
];

export const runtime = "edge";

// Centralized start time stored globally for simplicity
let universalStartTime = new Date();
// Track which periods have already been processed to avoid duplicate calls
const processedPeriods = new Set();

// Helper to calculate remaining time for a timer based on the universal start time
const getRemainingTime = (index) => {
  const now = Date.now();
  const elapsed = Math.floor((now - universalStartTime) / 1000); // Elapsed seconds
  const remaining = timers[index].duration - (elapsed % timers[index].duration); // Loop logic
  return remaining > 0 ? remaining : 0;
};

const getCurrentPeriodNumber = (index) => {
  const now = Date.now();
  const elapsed = Math.floor((now - universalStartTime) / 1000); // Elapsed seconds
  return `${timers[index].label.replace("min", "M")}${
    new Date().toISOString().slice(0, 4) +
    (new Date().getMonth() + 1).toString().padStart(2, "0") +
    new Date().getDate().toString().padStart(2, "0")
  }${Math.floor(elapsed / timers[index].duration) + 1}`; // Period number
};

export function setupLocalScheduler() {
  const fetchTimerData = () => {
    // Direct API call like RoomCard
    timers.map((_, index) => {
      const remaining = getRemainingTime(index) + 4;
      const period = getCurrentPeriodNumber(index);
      console.log("timer", remaining);
      if (remaining === 5) {
        console.log("winning");
        const periodKey = `${period}-${index}`;

        // Only process if this period hasn't been processed yet
        if (!processedPeriods.has(periodKey)) {
          try {
            console.log(`Calling winner logic for period ${period}`);
            // Call the winner API
            fetch(`https://9bets.in/api/winner?period=${period}`)
              .then((response) => response.json())
              .then((data) => {
                console.log(`Winner API response for period ${period}:`, data);
              })
              .catch((error) => {
                console.error(
                  `Error calling winner API for period ${period}:`,
                  error
                );
              });

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
    });
  };
  fetchTimerData();

  setInterval(fetchTimerData, 1000);
}
