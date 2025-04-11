// utils/firebaseApi.js
import toast from "react-hot-toast";
import { firestore } from "../../utils/firebase"; // Adjust path based on your directory structure
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  where,
  updateDoc,
} from "firebase/firestore";

// Reusable API function to handle bids
export const handleBidRequest = async (
  slotId,
  betValue,
  multiplier,
  quantity,
  availableAmount
) => {
  // Validate quantity and available amount
  if (quantity <= 0) {
    return {
      status: "error",
      message: "Quantity must be greater than 0",
    };
  }

  if (availableAmount < 0) {
    return {
      status: "error",
      message: "Available amount cannot be negative",
    };
  }

  try {
    const userId = localStorage.getItem("user")?.slice(1, -1);
    if (!userId) throw new Error("User ID not found.");

    // Reference to the Firestore collection for users
    const usersRef = collection(firestore, "users");
    const userSnapshot = await getDocs(
      query(usersRef, where("id", "==", userId))
    );
    if (userSnapshot.empty) throw new Error("User document not found.");

    const userDoc = userSnapshot.docs[0];
    const currentMoney = userDoc.data().money || 0;
    const newMoney = currentMoney - quantity * multiplier * availableAmount;

    if (newMoney < 0) throw new Error("Insufficient balance.");

    console.log("new money", newMoney);

    // Update Firestore document to reflect the new balance
    await updateDoc(userDoc.ref, { money: newMoney });

    // Add the bid to the Firestore collection
    const bidRef = collection(firestore, "bids");
    const bidData = {
      slotId,
      userId,
      betValue,
      totalBetAmount: quantity * multiplier * availableAmount,
      winningAmount: 0,
      isWin: false,
      createdAt: serverTimestamp(),
    };
    await addDoc(bidRef, bidData);

    const usersDepositRef = collection(firestore, "userDeposits");
    const userDepositSnapshot = await getDocs(
      query(usersDepositRef, where("id", "==", userId))
    );

    if (!userDepositSnapshot.empty) {
      const userDepositDoc = userDepositSnapshot.docs[0];
      const newMoney = userDepositDoc.data().money;
      const newMoney2 = newMoney - availableAmount;
      await updateDoc(userDepositDoc.ref, { money: newMoney2 });
    } else {
      await addDoc(usersDepositRef, {
        id: userId,
        money: availableAmount,
        timestamp: serverTimestamp(),
      });
    }

    toast.success("Bid added successfully");
    return {
      status: "success",
      message: "Bid added successfully",
      data: bidData,
      availableAmount: newMoney,
    };
  } catch (error) {
    console.error("Error adding bid:", error);
    toast.error(error.message || "Error processing bid");
    return {
      status: "error",
      message: error.message || "Error processing bid",
    };
  }
};
