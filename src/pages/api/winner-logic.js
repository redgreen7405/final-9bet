// utils/firebaseApi.js
import { ref, set } from "firebase/database";
import { database, firestore } from "../../utils/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  serverTimestamp,
  doc,
  writeBatch,
  addDoc,
} from "firebase/firestore";

// Add the timer configuration at the top of the file
const timers = [
  { label: "1min", duration: 60 },
  { label: "3min", duration: 180 },
  { label: "5min", duration: 300 },
  { label: "10min", duration: 600 },
];

// Start time for the application
let universalStartTime = 1743440970000;

// Track which periods have already been processed to avoid duplicate calls
const processedPeriods = new Set();

// Helper to calculate remaining time for a timer based on the universal start time
const getRemainingTime = (index) => {
  const now = Date.now();
  const elapsed = Math.floor((now - universalStartTime) / 1000); // Elapsed seconds
  const remaining = timers[index].duration - (elapsed % timers[index].duration); // Loop logic
  return remaining > 0 ? remaining : timers[index].duration;
};

// Get the current period number for a specific timer
const getCurrentPeriodNumber = (index) => {
  const now = Date.now();
  const elapsed = Math.floor((now - universalStartTime) / 1000); // Elapsed seconds
  return `${timers[index].label.replace("min", "M")}${
    new Date().toISOString().slice(0, 4) +
    (new Date().getMonth() + 1).toString().padStart(2, "0") +
    new Date().getDate().toString().padStart(2, "0")
  }${Math.floor(elapsed / timers[index].duration) + 1}`; // Period number
};

// Function to get all current periods
export const getCurrentPeriods = () => {
  return timers.map((_, index) => getCurrentPeriodNumber(index));
};

// Function to get remaining times for all timers
export const getRemainingTimes = () => {
  return timers.map((_, index) => getRemainingTime(index));
};

// Function to calculate winners and distribute rewards based on smallest bet amount
export const handleWinRequest = async (timerIndex = 0) => {
  try {
    // If slotId is not provided, calculate it based on timerIndex

    let slotId = getCurrentPeriodNumber(timerIndex);

    const bidsRef = collection(firestore, "bids");
    const bidsSnapshot = await getDocs(
      query(bidsRef, where("slotId", "==", slotId))
    );

    // Check for admin result first
    const adminBidRef = collection(firestore, "adminResults");
    const adminBidRefSnapshot = await getDocs(
      query(adminBidRef, where("period", "==", slotId))
    );

    let finalNumber, colors, bigSmall;

    // If admin has set a result for this period, use it
    if (!adminBidRefSnapshot.empty) {
      const adminResult = adminBidRefSnapshot.docs[0].data();
      console.log("Using admin result for period", slotId, ":", adminResult);

      finalNumber = adminResult.number;
      colors =
        adminResult.number === 0 || adminResult.number === 5
          ? ["violet", adminResult.color]
          : [adminResult.color];
      bigSmall = adminResult.bigSmall;
    } else if (bidsSnapshot.empty) {
      finalNumber = Math.floor(Math.random() * 10);
      colors = [];
      if (finalNumber % 2 === 0) {
        colors.push("red");
      } else {
        colors.push("green");
      }

      // Add violet for 0 and 5
      if (finalNumber == 0 || finalNumber == 5) {
        colors.push("violet");
      }
      bigSmall = finalNumber > 4 ? "big" : "small";
      // Calculate totals
      const totalBets = 0;
      let totalAmount = 0;
      let totalPayout = 0;
      let winnerCount = 0;

      const gameData = {
        slotId,
        resultNumber: finalNumber,
        colors,
        bigSmall,
        timestamp: serverTimestamp(),
        totalBets,
        totalAmount,
        totalPayout,
        winnerCount,
        status: "completed",
      };
      const gamesRef = collection(firestore, "games");
      // Add to Firestore
      await addDoc(gamesRef, gameData);

      // Also add to Realtime Database for the RandomDataTable component
      const randomDataRef = ref(database, `randomData/${slotId}`);
      await set(randomDataRef, {
        period: slotId,
        number: finalNumber,
        colors,
        bigSmall,
        timestamp: Date.now(),
        date: `${new Date().getFullYear()}-${String(
          new Date().getMonth() + 1
        ).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`,
      });
      return {
        status: "success",
        message: "Bet results processed successfully",
        result: {
          resultNumber: finalNumber,
          colors,
          bigSmall,
          period: slotId,
          totalPayout,
          winDetails: [],
        },
      };
    }

    // Track the winning details: betType, betValue, and the smallest totalBetAmount
    let smallestBetAmount = Infinity;
    let winningBetType = null;
    let winningBetValue = null;
    let winningBids = [];
    let numberBets = [];
    let colorBets = [];
    let smallBets = [];
    let bigBets = [];
    let allBets = [];
    let allNumberBets = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

    bidsSnapshot.docs.forEach(async (doc) => {
      const bidData = doc.data();
      const docId = doc.id;
      console.log("docId", docId);
      let { betValue, totalBetAmount, betType, userId } = bidData;
      console.log(bidData);
      betType = isNaN(betValue)
        ? ["big", "small"].includes(betValue)
          ? "bigSmall"
          : "color"
        : "number";

      if (betType === "color") {
        if (betValue === "violet") {
          totalBetAmount = totalBetAmount * 4.41;
          betType = "purple";
        } else totalBetAmount = totalBetAmount * 1.96;
        allBets.push({ ...bidData, docId, totalBetAmount, betType });
      } else if (betType === "number") {
        totalBetAmount = totalBetAmount * 8.82;
        allBets.push({ ...bidData, docId, totalBetAmount, betType });
      } else if (betType === "bigSmall") {
        totalBetAmount = totalBetAmount * 1.96;
        if (betValue === "small") {
          allBets.push({ ...bidData, docId, totalBetAmount, betType });
        } else {
          allBets.push({ ...bidData, docId, totalBetAmount, betType });
        }
      }
    });

    const finalBets = {};
    for (let i = 0; i <= 9; i++) {
      finalBets[i] = 0;
    }
    allBets.forEach((bet) => {
      allNumberBets.forEach((num) => {
        if (bet.betType === "number") {
          if (bet.betValue == num) {
            console.log("number type", bet.totalBetAmount, bet.betValue, num);
            finalBets[num] = (finalBets[num] || 0) + bet.totalBetAmount;
          }
        } else if (bet.betType === "color") {
          const color = num % 2 == 0 ? "red" : "green";
          if (bet.betValue === color) {
            if (num == 0 || num == 5) {
              console.log(
                "color type",
                bet.totalBetAmount,
                bet.betValue,
                num,
                num % 2
              );
              finalBets[num] =
                (finalBets[num] || 0) + (bet.totalBetAmount / 1.96) * 1.47;
              bet.totalBetAmount = (bet.totalBetAmount / 1.96) * 1.47;
            } else {
              finalBets[num] = (finalBets[num] || 0) + bet.totalBetAmount;
            }
          }
        } else if (bet.betType === "purple") {
          if (num == 0 || num == 5) {
            console.log("purple type", bet.totalBetAmount, bet.betValue, num);
            finalBets[num] = (finalBets[num] || 0) + bet.totalBetAmount;
          }
        } else if (bet.betType === "bigSmall") {
          if (bet.betValue === (num > 4 ? "big" : "small")) {
            console.log(
              "bigsmall type",
              bet.totalBetAmount,
              bet.betValue,
              num,
              num > 4 ? "big" : "small"
            );
            finalBets[num] = (finalBets[num] || 0) + bet.totalBetAmount;
          }
        }
      });
    });
    console.log("final bets", finalBets);
    const minimalValue = Math.min(...Object.values(finalBets));
    console.log(minimalValue, "min");
    function findKeyByValue(obj, value) {
      for (const [key, val] of Object.entries(obj)) {
        if (val === value) {
          return key; // Return the key if the value matches
        }
      }
      return null; // Return null if no key is found
    }

    // Get the key for the value x
    const filterMin = findKeyByValue(finalBets, minimalValue);
    console.log("fmin", filterMin);
    finalNumber = !adminBidRefSnapshot.empty ? finalNumber : filterMin;

    console.log(finalNumber, "final");
    let winDetails = [];

    // Loop through the bids and update the winning ones
    const batch = writeBatch(firestore);

    allBets.forEach((bet) => {
      let isWin = false;
      // If the bet is a "number" and matches the final number, set isWin to true
      if (bet.betType === "number" && bet.betValue == finalNumber) {
        isWin = true;
        // const bidRef = doc(firestore, "bids", bet.docId);
        // batch.update(bidRef, { isWin: true });
        winDetails.push(bet.userId);
      }
      // If the bet is "purple" and the final number is 0 or 5, set isWin to true
      else if (
        bet.betType === "purple" &&
        (finalNumber == 0 || finalNumber == 5)
      ) {
        isWin = true;
        // const bidRef = doc(firestore, "bids", bet.docId);
        // batch.update(bidRef, { isWin: true });
        winDetails.push(bet.userId);
      }
      // If the bet is "color" and matches the color based on finalNumber, set isWin to true
      else if (
        bet.betType === "color" &&
        bet.betValue === (finalNumber % 2 == 0 ? "red" : "green")
      ) {
        isWin = true;
        // const bidRef = doc(firestore, "bids", bet.docId);
        // batch.update(bidRef, { isWin: true });
        winDetails.push(bet.userId);
      }
      // If the bet is "bigSmall" and matches the final number range, set isWin to true
      else if (
        bet.betType === "bigSmall" &&
        bet.betValue === (finalNumber > 4 ? "big" : "small")
      ) {
        isWin = true;
        // const bidRef = doc(firestore, "bids", bet.docId);
        // batch.update(bidRef, { isWin: true });
        winDetails.push(bet.userId);
      }
      const bidRef = doc(firestore, "bids", bet.docId);
      batch.update(bidRef, {
        resultNumber: finalNumber,
        isWin: isWin,
        winningAmount: isWin ? bet.totalBetAmount : 0,
      });
    });

    // Commit the batch to Firestore
    await batch.commit();

    allBets.forEach(async (doc) => {
      // Update the bid document with win/loss status and payout
      const isWinner = winDetails.includes(doc.userId);
      if (isWinner) {
        const userRef = collection(firestore, "users");
        const userSnapshot = await getDocs(
          query(userRef, where("id", "==", doc.userId))
        );

        if (!userSnapshot.empty) {
          const userDoc = userSnapshot.docs[0];
          const currentMoney = userDoc.data().money || 0;
          const newMoney = currentMoney + doc.totalBetAmount;

          // Update user's money in Firestore
          await updateDoc(userDoc.ref, { money: newMoney });
        }
      }
    });

    console.log("winner", allBets);
    // Create a new game record in the games collection

    // Generate a period ID (you can customize this format)
    const now = new Date();

    // Determine colors based on the final number
    colors = [];
    if (finalNumber % 2 === 0) {
      colors.push("red");
    } else {
      colors.push("green");
    }

    // Add violet for 0 and 5
    if (finalNumber == 0 || finalNumber == 5) {
      colors.push("violet");
    }

    // Determine big/small
    bigSmall = finalNumber > 4 ? "big" : "small";

    // Calculate totals
    const totalBets = bidsSnapshot.size;
    let totalAmount = 0;
    let totalPayout = 0;
    let winnerCount = 0;

    allBets.forEach((bet) => {
      totalAmount += bet.totalBetAmount;
      if (bet.isWin) {
        totalPayout += bet.totalBetAmount;
        winnerCount++;
      }
    });

    // Create the game record
    const gameData = {
      slotId,
      resultNumber: finalNumber,
      colors,
      bigSmall,
      timestamp: serverTimestamp(),
      totalBets,
      totalAmount,
      totalPayout,
      winnerCount,
      status: "completed",
    };

    const gamesRef = collection(firestore, "games");
    // Add to Firestore
    await addDoc(gamesRef, gameData);

    // Also add to Realtime Database for the RandomDataTable component
    const randomDataRef = ref(database, `randomData/${slotId}`);
    await set(randomDataRef, {
      period: slotId,
      number: finalNumber,
      colors,
      bigSmall,
      timestamp: Date.now(),
      date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(now.getDate()).padStart(2, "0")}`,
    });

    // Return the result
    return {
      status: "success",
      message: "Bet results processed successfully",
      result: {
        resultNumber: finalNumber,
        colors,
        bigSmall,
        period: slotId,
        totalPayout,
        winDetails,
      },
    };
    // let winDetails = [];

    // let winningBidDoc = null;
    bidsSnapshot.docs.forEach(async (doc) => {
      const bidData = doc.data();
      if (bidData.betType === "number" && bidData.betValue == finalNumber) {
        // Update isWin to true for the winning bid
        winningBidDoc = doc.ref;
        await updateDoc(winningBidDoc, { isWin: true });
      }
    });

    allBets.forEach((bet) => {
      if (bet.betType === "number") {
        if (bet.betValue == finalNumber) {
          console.log("number type", bet.totalBetAmount, bet.betValue, num);
          winDetails.push({
            userId,
            reward: bet.totalBetAmount,
            betValue,
            totalBetAmount,
          });
          finalBets[num] = (finalBets[num] || 0) + bet.totalBetAmount;
        }
      } else if (bet.betType === "color") {
        const color = num % 2 == 0 ? "red" : "green";
        if (bet.betValue === color) {
          if (num == 0 || num == 5) {
            console.log(
              "color type",
              bet.totalBetAmount,
              bet.betValue,
              num,
              num % 2
            );
            finalBets[num] =
              (finalBets[num] || 0) + (bet.totalBetAmount / 2) * 1.5;
          } else {
            finalBets[num] = (finalBets[num] || 0) + bet.totalBetAmount;
          }
        }
      } else if (bet.betType === "purple") {
        if (num == 0 || num == 5) {
          console.log("purple type", bet.totalBetAmount, bet.betValue, num);
          finalBets[num] = (finalBets[num] || 0) + bet.totalBetAmount;
        }
      } else if (bet.betType === "bigSmall") {
        if (bet.betValue === (num > 4 ? "big" : "small")) {
          console.log(
            "bigsmall type",
            bet.totalBetAmount,
            bet.betValue,
            num,
            num > 4 ? "big" : "small"
          );
          finalBets[num] = (finalBets[num] || 0) + bet.totalBetAmount;
        }
      }
    });

    // Now that we have the winning bet type and value, determine the actual result
    // let isSmall = winningBidValue >= 0 && winningBidValue <= 4; // Small if 0-4, otherwise big
    // let color = winningBidValue % 2 === 0 ? "red" : "green"; // Even is red, odd is green
    // if (winningBetType === "big" || winningBetType === "small") {
    //   isSmall = winningBetType === "small"; // Adjust if it's a "small" bet
    // }

    // Calculate the total payout for all winners based on the winning bet type
    // let totalPayout = 0;

    // Process the winning bids and calculate their payout
    for (const winningBid of winningBids) {
      const { userId, betValue, totalBetAmount } = winningBid;

      let payoutMultiplier = 0;

      // Determine the multiplier based on the bet type
      if (winningBetType === "color") {
        if (
          (betValue === "red" && color === "red") ||
          (betValue === "green" && color === "green")
        ) {
          payoutMultiplier = 1.99;
        }
      } else if (winningBetType === "number") {
        if (betValue === winningBetValue) {
          payoutMultiplier = 2.99;
        }
      } else if (winningBetType === "bigSmall") {
        if (
          (betValue === "big" && !isSmall) ||
          (betValue === "small" && isSmall)
        ) {
          payoutMultiplier = 1.99;
        }
      }

      if (payoutMultiplier > 0) {
        const reward = totalBetAmount * payoutMultiplier;
        totalPayout += reward;
        winDetails.push({ userId, reward, betValue, totalBetAmount });

        // Update user's balance in Firestore
        const userRef = collection(firestore, "users");
        const userSnapshot = await getDocs(
          query(userRef, where("id", "==", userId))
        );

        if (!userSnapshot.empty) {
          const userDoc = userSnapshot.docs[0];
          const currentMoney = userDoc.data().money || 0;
          const newMoney = currentMoney + reward;

          // Update user's money in Firestore
          await updateDoc(userDoc.ref, { money: newMoney });
        }
      }
    }

    // Update all bid documents with the result details
    bidsSnapshot.docs.forEach(async (doc) => {
      const bidData = doc.data();
      const { userId } = bidData;

      // Update the bid document with win/loss status and payout
      const isWinner = winDetails.some((detail) => detail.userId === userId);
      await updateDoc(doc.ref, {
        isWin: isWinner,
        payout: isWinner ? totalBetAmount * (payoutMultiplier || 0) : 0,
        resultNumber: winningBetValue,
        color,
        isSmall,
      });
    });

    return {
      status: "success",
      message: "Bet results processed successfully",
      result: {
        resultNumber: winningBetValue,
        color,
        isSmall,
        totalPayout,
        winDetails,
      },
    };
  } catch (error) {
    console.error("Error calculating win:", error);
    return {
      status: "error",
      message: error.message || "Error processing win calculation",
    };
  }
};
