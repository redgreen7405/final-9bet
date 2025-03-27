// components/RoomCard.jsx
import { TimerSelector } from "./TimerSelector";
import { DropdownMenu } from "./DropdownMenu";
import {
  numberOptions,
  colorOptions,
  sizeOptions,
} from "../../constants/timerConfig";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { firestore } from "../../utils/firebase";

// Utility function to format time display
const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes < 10 ? "0" : ""}${minutes}:${secs < 10 ? "0" : ""}${secs}`;
};

const times = [60, 180, 300, 600];

export const RoomCard = ({
  roomNumber,
  duration,
  onSubmit,
  loading,
  selectedValues,
  onValueChange,
}) => {
  const [timeLeft, setTimeLeft] = useState();
  const [currentPeriod, setCurrentPeriod] = useState("");
  const [error, setError] = useState(false);
  const [bidStats, setBidStats] = useState({
    totalBids: 0,
    totalAmount: 0,
    colorBids: {
      red: 0,
      green: 0,
      violet: 0,
    },
    colorAmounts: {
      red: 0,
      green: 0,
      violet: 0,
    },
  });
  const [statsLoading, setStatsLoading] = useState(false);

  const fetchTimers = async () => {
    try {
      setError(false);
      const res = await fetch("/api/timer");
      const data = await res.json();

      if (data.timers && Array.isArray(data.timers)) {
        setTimeLeft(data.timers.map((timer) => timer.remaining));
        const timerData = data.timers[roomNumber - 1];
        if (timerData?.period) {
          setCurrentPeriod(timerData.period);
        }
      }
    } catch (error) {
      console.error("Error fetching timers:", error);
      setError(true);
    }
  };

  const fetchBidStats = async (period) => {
    if (!period) return;

    setStatsLoading(true);
    try {
      const bidsRef = collection(firestore, "bids");
      const q = query(bidsRef, where("slotId", "==", period));
      const querySnapshot = await getDocs(q);

      let totalAmount = 0;
      const colorBids = {
        red: 0,
        green: 0,
        violet: 0,
      };
      const colorAmounts = {
        red: 0,
        green: 0,
        violet: 0,
      };

      querySnapshot.docs.forEach((doc) => {
        const bid = doc.data();
        totalAmount += bid.totalBetAmount || 0;

        // Track bids by color
        if (
          bid.betType === "color" ||
          bid.betValue === "red" ||
          bid.betValue === "green" ||
          bid.betValue === "violet"
        ) {
          const color = bid.betValue;
          colorBids[color] = (colorBids[color] || 0) + 1;
          colorAmounts[color] =
            (colorAmounts[color] || 0) + (bid.totalBetAmount || 0);
        }
      });

      setBidStats({
        totalBids: querySnapshot.size,
        totalAmount: totalAmount,
        colorBids,
        colorAmounts,
      });
    } catch (error) {
      console.error("Error fetching bid stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      if (mounted) {
        await fetchTimers();
      }
    };

    fetchData();
    const refreshInterval = setInterval(fetchData, 1000);

    return () => {
      mounted = false;
      clearInterval(refreshInterval);
    };
  }, [roomNumber]); // Add roomNumber as dependency

  useEffect(() => {
    let interval;

    if (currentPeriod) {
      // Fetch immediately when period changes
      fetchBidStats(currentPeriod);

      // Then set up interval to fetch every 5 seconds
      interval = setInterval(() => {
        fetchBidStats(currentPeriod);
      }, 5000);
    }

    // Cleanup interval when component unmounts or period changes
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [currentPeriod]);

  // Helper to render a color stat item
  const ColorStatItem = ({ color, count, amount }) => (
    <div className="flex flex-col items-center">
      <div
        className={`w-3 h-3 rounded-full mb-1 ${
          color === "red"
            ? "bg-red-500"
            : color === "green"
            ? "bg-green-500"
            : "bg-purple-500"
        }`}
      />
      <span className="text-xs font-medium">{count}</span>
      <span className="text-xs text-gray-500">₹{amount}</span>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-semibold text-gray-900">
            Room {roomNumber} ({duration / 60}M)
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Period:</span>
            <span
              className={`text-sm font-bold ${
                error ? "text-red-600" : "text-gray-900"
              }`}
            >
              {error ? "Error loading period" : currentPeriod || "Loading..."}
            </span>
          </div>
        </div>
        <h3 className="text-xl font-medium text-gray-900">
          {timeLeft && timeLeft[roomNumber - 1] !== undefined
            ? formatTime(timeLeft[roomNumber - 1])
            : "--:--"}
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-sm text-gray-500">Total Bids</div>
          <div className="text-lg font-bold text-gray-900">
            {statsLoading ? (
              <div className="animate-pulse h-6 w-16 bg-gray-200 rounded mx-auto"></div>
            ) : (
              bidStats.totalBids
            )}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-500">Total Amount</div>
          <div className="text-lg font-bold text-gray-900">
            {statsLoading ? (
              <div className="animate-pulse h-6 w-20 bg-gray-200 rounded mx-auto"></div>
            ) : (
              `₹${bidStats.totalAmount}`
            )}
          </div>
        </div>
      </div>

      {/* Color-specific bid stats */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-500 mb-3 text-center">
          Bids by Color
        </div>
        {statsLoading ? (
          <div className="flex justify-around space-x-2">
            <div className="animate-pulse h-12 w-12 bg-gray-200 rounded"></div>
            <div className="animate-pulse h-12 w-12 bg-gray-200 rounded"></div>
            <div className="animate-pulse h-12 w-12 bg-gray-200 rounded"></div>
          </div>
        ) : (
          <div className="flex justify-around">
            <ColorStatItem
              color="red"
              // count={bidStats.colorBids.red}
              amount={bidStats.colorAmounts.red}
            />
            <ColorStatItem
              color="green"
              // count={bidStats.colorBids.green}
              amount={bidStats.colorAmounts.green}
            />
            <ColorStatItem
              color="violet"
              // count={bidStats.colorBids.violet}
              amount={bidStats.colorAmounts.violet}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {[
          { label: "Color", key: "color", options: colorOptions },
          { label: "Number", key: "number", options: numberOptions },
        ].map(({ label, key, options }) => (
          <div key={key} className="space-y-2">
            <label className="text-sm font-medium text-gray-700">{label}</label>
            <DropdownMenu
              value={selectedValues[key] || ""}
              onChange={(value) => {
                if (key == "color") {
                  onValueChange("number", "");
                  onValueChange("size", "");
                }
                if (key == "number") {
                  onValueChange("size", value <= 4 ? "small" : "big");
                }
                onValueChange(key, value);
              }}
              options={
                key === "number"
                  ? options.filter((ele) =>
                      selectedValues["color"] === "violet"
                        ? ele.isMix === "true"
                        : ele.color === selectedValues["color"]
                    )
                  : options
              }
              placeholder={`Select ${label.toLowerCase()}`}
            />
          </div>
        ))}
        {selectedValues["number"] && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              "Big / Small"
            </label>
            <div className="relative w-full">
              <button className="w-full flex items-center justify-between px-4 py-2 text-sm bg-white border rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500">
                <span className="text-gray-700 truncate">
                  {selectedValues["number"] <= 4 ? "small" : "big"}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => onSubmit(currentPeriod)}
        disabled={loading}
        className="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Processing..." : "Submit"}
      </button>
    </div>
  );
};
