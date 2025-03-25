// utils/firebaseApi.js
import {
  addDoc,
  collection,
  getDocs,
  updateDoc,
  where,
} from "firebase/firestore";
import { database, firestore } from "../../utils/firebase"; // Adjust path as per your project structure
import { ref, push, set, serverTimestamp, query } from "firebase/database";

// Reusable API function to handle transactions
export const handleTransactionRequest = async (
  userId,
  amount,
  upiNumber,
  type,
  upiId,
  ifsc,
  bankNo
) => {
  // Prepare data for insertion
  const data = {
    timestamp: serverTimestamp(), // Automatically set timestamp from Firebase
    userId,
    amount,
    upiNumber,
    type, // "deposit" or "withdrawal"
    status: "pending", // Default status
    upiId: upiId ?? "-",
    ifsc: ifsc ?? "-",
    bankNo: bankNo ?? "-",
  };

  try {
    const usersRef = collection(firestore, "users");
    const userSnapshot = await getDocs(
      query(usersRef, where("id", "==", data.userId))
    );
    if (userSnapshot.empty) throw new Error("User document not found.");

    // for user
    const userDoc = userSnapshot.docs[0];
    if (data.type == "withdrawal") {
      const currentMoney = userDoc.data().money || 0;
      const numValue = parseFloat(data.amount);
      const newMoney = currentMoney - numValue;

      if (newMoney < 0) throw new Error("Insufficient balance.");

      // Update Firestore document to reflect the new balance
      await updateDoc(userDoc.ref, { money: newMoney });
    }
    // Create a new transaction document in the 'transactions' subcollection
    const transactionRef = collection(userDoc.ref, "transactions");
    console.log({
      amount: data.amount,
      type: data.type === "deposit" ? "deposit" : "withdrawal",
      timestamp: new Date().toISOString(),
      status: "pending",
    });

    const res = await addDoc(transactionRef, {
      amount: data.amount,
      type: data.type === "deposit" ? "deposit" : "withdrawal",
      timestamp: new Date().toISOString(),
      status: "pending",
    });
    console.log(res.id, "res");
    // all req
    const dataBody = { ...data, id_ref: res.id };
    const dbRef = ref(database, "transactions");
    await push(dbRef, dataBody);
    return {
      status: "success",
      message: "Transaction submitted successfully",
      dataBody,
    };
  } catch (error) {
    console.error("Error adding transaction:", error);
    return {
      status: "error",
      message: error.message || "Error processing transaction",
    };
  }
};
