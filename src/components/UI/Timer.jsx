"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import axios from "axios";
import {
  ClockIcon,
  QuestionMarkCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { database, firestore } from "../../utils/firebase";
import { ref, onValue, off, set } from "firebase/database";
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  arrayUnion,
  addDoc,
} from "firebase/firestore";
import Image from "next/image";
import balls from "../../assets/index.js";

// Utility function to format time display
const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes < 10 ? "0" : ""}${minutes}:${secs < 10 ? "0" : ""}${secs}`;
};

const ColorChip = ({ number }) => {
  const ballImage = balls[number];

  if (!ballImage) {
    return null;
  }

  return (
    <div className="w-8 h-8 sm:w-10 sm:h-10">
      <div className="relative w-full h-full rounded-full overflow-hidden">
        <Image
          src={ballImage}
          alt={`Ball ${number}`}
          fill
          sizes="(max-width: 640px) 32px, 40px"
          className="object-contain"
          priority={number < 3}
        />
      </div>
    </div>
  );
};

// TimerButton component for timer selection
const TimerButton = ({ time, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center py-3 sm:py-4 rounded-xl transition-all duration-300 ${
      isActive
        ? "bg-red-600 text-white shadow-lg"
        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`}
    aria-pressed={isActive}
    aria-label={`Set timer to ${time.label}`}
  >
    <ClockIcon className="w-6 h-6 mb-1" />
    <span className="text-xs sm:text-sm font-medium">{time.label}</span>
  </button>
);

// Main Timer component
const Timer = ({
  setMyHistory,
  times,
  onLastTenSeconds,
  timeLeft,
  setTimeLeft,
  selected,
  setSelected,
  result,
  setResult,
  bidAmount,
  setResultDisplay,
  newPeriod,
  setNewPeriod,
}) => {
  const [activeButton, setActiveButton] = useState(0);

  const [lastWins, setLastWins] = useState([]);
  const [currentPeriod, setCurrentPeriod] = useState("");
  const [nextPeriod, setNextPeriod] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);

  const instructions = [
    {
      id: 1,
      text: "Select green: if the result shows 1,3,7,9 you will get (98*2) 196; If the result shows 5, you will get (98*1.5) 147",
    },
    {
      id: 2,
      text: "Select red: if the result shows 2,4,6,8 you will get (98*2) 196; If the result shows 0, you will get (98*1.5) 147",
    },
    {
      id: 3,
      text: "Select violet: if the result shows 0 or 5, you will get (98*4.5) 441",
    },
    {
      id: 4,
      text: "Select number: if the result is the same as the number you selected, you will get (98*9) 882",
    },
    {
      id: 5,
      text: "Select big: if the result shows 5,6,7,8,9 you will get (98 * 2) 196",
    },
    {
      id: 6,
      text: "Select small: if the result shows 0,1,2,3,4 you will get (98 * 2) 196",
    },
  ];
  // Fetch the current timers from the backend - improved version
  const fetchTimers = async () => {
    try {
      const res = await fetch("/api/timer");

      if (!res.ok) {
        throw new Error(`API returned status: ${res.status}`);
      }

      const data = await res.json();

      if (!data || !data.timers || !Array.isArray(data.timers)) {
        console.error("Invalid data format received:", data);
        return;
      }

      // Update timer data
      setTimeLeft(data.timers.map((timer) => timer.remaining));

      // Update period information
      setNewPeriod(data.timers.map((timer) => timer.period));

      // Process timer logic
      data.timers.forEach((timer, index) => {
        const remaining = timer.remaining;

        if (index === activeButton) {
          // Handle winner API call at 5 seconds
          // if (remaining === 5) {
          //   callWinnerAPI(timer.period);
          // }

          // Handle bid result check at 2 seconds
          if (remaining === 2) {
            console.log("Checking bid result at 2 seconds remaining");
            checkBidResult(newPeriod);
          }

          // Handle last 10 seconds state
          if (remaining < 11 && remaining >= 1) {
            onLastTenSeconds(true);
          } else if (remaining < 1) {
            onLastTenSeconds(false);
          }
        }
      });
    } catch (error) {
      console.error("Error fetching timers:", error);
    }
  };

  // Set up initial fetch and interval
  useEffect(() => {
    // Initial fetch
    fetchTimers();

    // Set up interval for regular fetching
    const interval = setInterval(fetchTimers, 1000);

    // Cleanup on component unmount
    return () => clearInterval(interval);
  }, []);

  // Format period helper function
  const formatPeriod = useCallback((index) => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const number = String(index).padStart(4, "0");
    return `${year}${month}${day}${number}`;
  }, []);

  // Calculate next period function
  const calculateNextPeriod = useCallback(
    (currentPeriod) => {
      if (!currentPeriod) return "";
      const currentNumber = parseInt(currentPeriod.slice(-4));
      return formatPeriod(currentNumber + 1);
    },
    [formatPeriod]
  );

  // Setup Firebase listeners
  useEffect(() => {
    const randomDataRef = ref(database, "randomData");

    onValue(randomDataRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const dataArray = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));

        // Sort by timestamp (descending order)
        dataArray.sort((a, b) => b.timestamp - a.timestamp);

        // Get last 5 wins for display
        const last5 = dataArray.slice(0, 5).map((entry) => ({
          colors: entry.colors,
          number: entry.number,
          period: entry.period || formatPeriod(dataArray.length),
        }));

        setLastWins(last5);

        if (dataArray.length > 0) {
          const latestEntry = dataArray[0];
          const latestPeriod =
            latestEntry.period || formatPeriod(dataArray.length);
          setCurrentPeriod(latestPeriod);
          setNextPeriod(calculateNextPeriod(latestPeriod));
        }
      }
    });

    return () => {
      off(randomDataRef);
    };
  }, [calculateNextPeriod, formatPeriod]);

  const handlePeriod = () => {
    return `${new Date().getFullYear()}${
      new Date().getMonth() + 1
    }${new Date().getDate()}${new Date().getHours()}${new Date().getMinutes()}${new Date().getSeconds()}`;
  };
  useEffect(() => {
    timeLeft.forEach((time, index) => {
      if (time <= 1) {
        fetchTimers();
      }
    });
  }, [timeLeft]);

  async function addMyHistory(myHistory) {
    try {
      const userId = localStorage.getItem("user")?.slice(1, -1);
      if (!userId) throw new Error("User ID not found in localStorage.");

      const usersRef = collection(firestore, "users");
      const q = query(usersRef, where("id", "==", userId));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("User Not found in the database");
      }
      const userDoc = querySnapshot.docs[0];

      // Assuming `myHistory` contains the new history object
      const myHistoryRef = collection(userDoc.ref, "myHistory");

      await addDoc(myHistoryRef, myHistory);
      setResultDisplay(true);
    } catch (error) {
      console.error("Error Adding My History:", error);
    }
  }
  const checkBidResult = async (np) => {
    try {
      const slotId = np;
      if (!slotId) {
        console.log("No bid amount or slot ID provided");
        return null;
      }

      const bidsRef = collection(firestore, "bids");
      const q = query(bidsRef, where("slotId", "==", slotId));

      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        console.log("No matching bid found for slot ID:", slotId);
        return null;
      }

      const bidResults = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
        };
      });

      const foundWin = bidResults.find((result) => result.isWin == true);

      console.log(bidResults, foundWin);
      const myHistory = {
        timestamp: Date.now(),
        selected,
        drawNumber: bidResults[0].resultNumber,
        result: foundWin ? "Win" : "Loss",
      };
      console.log(myHistory);
      setMyHistory(myHistory);
      setResultDisplay(true);
      setSelected();
      return bidResults;
    } catch (error) {
      console.error("Error Checking Bid Result:", error);
      return null;
    }
  };

  // Handle active button change
  useEffect(() => {
    console.log(timeLeft[activeButton] > 11);
    localStorage.setItem("btnIndx", activeButton);

    if (timeLeft[activeButton] >= 11) onLastTenSeconds(false);
    else onLastTenSeconds(true);
  }, [activeButton, timeLeft]);

  // Memoized timer display
  const activeTimerDisplay = useMemo(() => {
    if (!timeLeft.length) return null;
    return formatTime(timeLeft[activeButton])
      .split("")
      .map((digit, index) => (
        <div
          key={index}
          className="bg-white text-red-600 w-7 h-7 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-lg sm:text-2xl font-bold font-mono shadow-md"
        >
          {digit}
        </div>
      ));
  }, [timeLeft, activeButton]);

  return (
    <>
      <div className="max-w-2xl mx-auto px-4">
        {/* Timer Selection */}
        <div className="grid grid-cols-2 grid-rows-2 lg:grid-cols-4 lg:grid-rows-1 gap-2 sm:gap-4 mb-5">
          {times.slice(0, 10).map((time, index) => (
            <TimerButton
              key={index}
              time={time}
              isActive={activeButton === index}
              onClick={() => setActiveButton(index)}
            />
          ))}
        </div>

        {/* Timer Display */}
        <div className="bg-gradient-to-r from-red-600 to-rose-500 rounded-2xl shadow-xl overflow-hidden">
          <div className="grid grid-cols-2 divide-x divide-white/20">
            <div className="p-4 sm:p-6 space-y-3">
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center justify-center gap-2 bg-white/20 text-white py-2 px-4 rounded-full hover:bg-white/30 transition-colors text-sm sm:text-base w-full"
              >
                <QuestionMarkCircleIcon className="w-5 h-5" />
                How to Play
              </button>
              <p className="text-white font-semibold text-sm sm:text-base">
                9bets
                {/* {times[activeButton].label} */}
              </p>

              {/* Win History Grid */}
              <div className="grid grid-cols-5 grid-rows-1 gap-2 mt-2">
                {lastWins?.map((win, index) => (
                  <ColorChip
                    key={index}
                    colors={win.colors}
                    number={win.number}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col justify-center items-center p-4 sm:p-6">
              <h3 className="text-white text-sm sm:text-base font-medium mb-2">
                Time Remaining
              </h3>
              <div className="flex space-x-1 mb-3">{activeTimerDisplay}</div>

              {/* Period Display */}
              <h3 className="text-white mt-3">
                {newPeriod?.length > 0
                  ? newPeriod[activeButton || 0]
                  : "loading..."}
              </h3>
            </div>
          </div>
        </div>
      </div>
      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[90vh] flex flex-col mx-4">
            {/* Fixed Header */}
            <div className="flex justify-between items-center p-6 border-b bg-white rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="bg-red-100 p-2 rounded-xl">
                  <QuestionMarkCircleIcon className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">How to Play</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full hover:bg-red-50 text-red-600 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="bg-gradient-to-r from-red-50 to-rose-50 p-6 rounded-xl border border-red-100">
                <p className="text-gray-700 font-medium">
                  1 minutes 1 issue, 45 seconds to order, 15 seconds waiting for
                  the draw. It opens all day. The total number of trade is 1440
                  issues.
                </p>
                <p className="mt-3 text-gray-700 font-medium">
                  If you spend 100 to trade, after deducting 2 service fee, your
                  contract amount is 98:
                </p>
              </div>

              <div className="space-y-4">
                {instructions.map((instruction) => (
                  <div
                    key={instruction.id}
                    className="p-6 bg-white rounded-xl border border-gray-200 hover:border-red-200 hover:shadow-lg transition-all duration-300"
                  >
                    <p className="text-gray-700">{instruction.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Optional Footer */}
            <div className="p-6 border-t bg-gray-50/50 rounded-b-2xl">
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-full bg-red-600 text-white py-3 px-4 rounded-xl hover:bg-red-700 transition-colors font-medium"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Timer;
