// utils/firebaseApi.js
import { database, firestore } from "../../utils/firebase"; // Adjust path as per your project structure
import {
  ref,
  get,
  update,
  serverTimestamp,
  orderByChild,
  equalTo,
} from "firebase/database";
import {
  collection,
  query,
  orderBy,
  where,
  getDocs,
  updateDoc,
  addDoc,
  doc,
} from "firebase/firestore";

export const runtime = "edge";
// Fetch all transactions from Firebase
export const getTransactions = async () => {
  const transactionsRef = ref(database, "transactions");
  try {
    const snapshot = await get(transactionsRef);

    if (snapshot.exists()) {
      const transactions = [];
      snapshot.forEach((childSnapshot) => {
        const transaction = childSnapshot.val();
        transactions.push({
          id: childSnapshot.key, // Use the transaction ID as the key
          ...transaction,
        });
      });
      console.log(transactions);
      return transactions.reverse();
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error fetching transactions:", error);
    throw error;
  }
};

// export const getUserTransactions = async () => {
//   const userId = localStorage.getItem("user")?.slice(1, -1);

//   if (!userId) {
//     throw new Error("User ID is required");
//   }

//   try {
//     // Get transactions from the main transactions collection in Realtime Database
//     // Filter by userId directly on the Firebase side
//     const transactionsRef = ref(database, "transactions");

//     const userTransactionsQuery = query(
//       transactionsRef,
//       orderByChild("userId"),
//       equalTo(userId)
//     );

//     const snapshot = await get(userTransactionsQuery);
//     const transactions = [];

//     if (snapshot.exists()) {
//       snapshot.forEach((childSnapshot) => {
//         console.log(childSnapshot.val(), "cc");
//         const transaction = childSnapshot.val();
//         transactions.push({
//           id: childSnapshot.key,
//           ...transaction,
//         });
//       });
//     }

//     return transactions;
//   } catch (error) {
//     console.error("Error fetching user transactions:", error);
//     throw error;
//   }
// };

// Update the transaction status (approve or reject)
export const updateTransactionStatus = async (transactionId, status, data) => {
  try {
    const usersRef = collection(firestore, "users");
    const userSnapshot = await getDocs(
      query(usersRef, where("id", "==", data.userId))
    );
    if (userSnapshot.empty) throw new Error("User document not found.");
    const userDoc = userSnapshot.docs[0];

    if (status === "rejected") {
      const transactionReff = ref(database, `transactions/${transactionId}`);
      await update(transactionReff, { status }); // Update the status of the transaction
      const transactionRef = collection(userDoc.ref, "transactions");

      // Each transaction gets a unique document ID automatically by Firestore

      if (data.type === "withdrawal") {
        const currentMoney = userDoc.data().money || 0;
        const numValue = parseFloat(data.amount);
        const newMoney = currentMoney + numValue;

        // Update Firestore document to reflect the new balance
        await updateDoc(userDoc.ref, { money: newMoney });
      }
      const transactionReffData = (
        await get(ref(database, `transactions/${transactionId}`))
      ).val();
      const transactionRef2 = doc(transactionRef, transactionReffData?.id_ref);
      await updateDoc(transactionRef2, {
        status: "rejected",
      });
      return;
    }

    const currentMoney = userDoc.data().money || 0;
    const numValue = parseFloat(data.amount);
    if (data.type === "deposit") {
      const newMoney = currentMoney + numValue;

      if (newMoney < 0) throw new Error("Insufficient balance.");

      // Update Firestore document to reflect the new balance
      await updateDoc(userDoc.ref, { money: newMoney });
    }
    // Create a new transaction document in the 'transactions' subcollection
    const transactionRef = collection(userDoc.ref, "transactions");

    // Each transaction gets a unique document ID automatically by Firestore
    // await addDoc(transactionRef, {
    //   amount: numValue,
    //   type: data.type === "deposit" ? "deposit" : "withdrawal",
    //   timestamp: new Date().toISOString(),
    //   status: "approved",
    // });
    const transactionReffData = (
      await get(ref(database, `transactions/${transactionId}`))
    ).val();
    const transactionRef2 = doc(transactionRef, transactionReffData?.id_ref);
    await updateDoc(transactionRef2, {
      status: "approved",
    });

    const transactionReff = ref(database, `transactions/${transactionId}`);
    await update(transactionReff, { status }); // Update the status of the transaction
  } catch (error) {
    console.error("Error updating transaction status:", error);
    throw error;
  }
};
