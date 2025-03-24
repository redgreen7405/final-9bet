"use client";

import React, { useState, useEffect, useMemo } from "react";
import { app, database, firestore } from "../utils/firebase";
import { ref, onValue, set } from "firebase/database";
import {
  collection,
  query,
  orderBy,
  where,
  getDocs,
  updateDoc,
  addDoc,
  getFirestore,
  getDoc,
  doc,
} from "firebase/firestore";
import { Toaster, toast } from "react-hot-toast";
import Navbar from "../components/UI/Navbar";
import MobileNavbar from "../components/UI/MobileNavbar";
import Footer from "../components/UI/Footer";
import BottomMenu from "../components/UI/BottomMenu";
import {
  PlusCircleIcon,
  ChevronDownIcon,
  ClipboardDocumentIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  CameraIcon,
} from "@heroicons/react/24/solid";
import { Menu } from "@headlessui/react";
import Loader from "../components/UI/Loader";
import "../app/globals.css";
import { handleTransactionRequest } from "./api/transaction-handle";

// Define filter options as a constant outside the component
const FILTER_OPTIONS = [
  { value: "all", label: "All Transactions" },
  { value: "today", label: "Today's Transactions" },
  { value: "thisMonth", label: "This Month's Transactions" },
];

// Define the Dashboard component as a named function
export default function Dashboard() {
  const [amount, setAmount] = useState("");
  const [numbers, setNumbers] = useState("");
  const initialState = {
    depositNumbers: "",
    withdrawNumbers: "",
    upiId: "",
    ifsc: "",
    bankNo: "",
  };
  const [transactionData, setTransactionData] = useState(initialState);
  const [withdrawNumbers, setWithdrawNumbers] = useState("");
  const [image, setImage] = useState(null);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState(FILTER_OPTIONS[0]);
  const [referralUrl, setReferralUrl] = useState("");
  const [balance, setBalance] = useState();

  // Fetch payments and set referral URL
  useEffect(() => {
    // Ensure this runs only on client-side
    if (typeof window !== "undefined") {
      const generateReferralId = () => {
        return (
          Math.random().toString(36).substring(2, 15) +
          Math.random().toString(36).substring(2, 15)
        );
      };

      getReferralCode();

      fetchUserBalance();
      fetchPayments();
    }
  }, []);
  const getReferralCode = async () => {
    try {
      const userId = localStorage.getItem("user")?.slice(1, -1); // Assuming 'user' is stored as a string with extra quotes.

      if (!userId) throw new Error("User ID is not available in localStorage");

      const usersRef = collection(firestore, "users");
      const q = query(usersRef, where("id", "==", userId));
      const querySnapshot = await getDocs(q);
      console.log("que", querySnapshot.docs[0].data());
      if (querySnapshot.empty) throw new Error("User document not found.");

      // Assuming only one user will be matched, we can access the first document
      const userDocSnap = querySnapshot.docs[0];

      if (userDocSnap.exists()) {
        const code = userDocSnap.data().referralCode;
        // `${window.location.origin}/referral?id=${

        // }`;
        setReferralUrl(code);
      } else {
        throw new Error("User document does not contain a referral code.");
      }
    } catch (error) {
      console.error("Error getting referral code:", error);
    }
  };
  const fetchPayments = async () => {
    const userId = localStorage.getItem("user")?.slice(1, -1); // Get the userId from localStorage

    try {
      const usersRef = collection(firestore, "users"); // Reference to the 'users' collection
      const userSnapshot = await getDocs(
        query(usersRef, where("id", "==", userId))
      );

      if (!userSnapshot.empty) {
        // If the user exists, access the first user document
        const userData = userSnapshot.docs[0].data(); // Get the user data

        // Now that we have the user data, access the user's transactions sub-collection
        const transactionsRef = collection(
          firestore,
          `users/${userSnapshot.docs[0].id}/transactions` // Path to the transactions sub-collection
        );

        const transactionsSnapshot = await getDocs(transactionsRef); // Fetch the transactions from the sub-collection

        // Map through the transaction documents to get the required data
        const paymentsList = transactionsSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id, // Document ID
            amount: data.amount,
            type: data.type,
            timestamp: data.timestamp,
            status: data.status,
            formattedAmount: new Intl.NumberFormat("en-IN", {
              style: "currency",
              currency: "INR",
            }).format(data.amount),
          };
        });

        setPayments(paymentsList);
      } else {
        throw new Error("User not found.");
      }
    } catch (error) {
      console.error("Error fetching payments: ", error);
      toast.error("Could not fetch payments. Please try again.");
    }
  };

  // Fetch user balance
  const fetchUserBalance = async () => {
    try {
      const userId = localStorage.getItem("user")?.slice(1, -1);
      if (!userId) throw new Error("User ID not found.");

      const usersRef = collection(firestore, "users");
      const userSnapshot = await getDocs(
        query(usersRef, where("id", "==", userId))
      );

      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data();
        setBalance(userData.money || 0);
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
      toast.error("Could not fetch balance");
    }
  };

  // Handle transaction (deposit or withdrawal)
  const handleTransaction = async (type, value, number) => {
    if (!value || isNaN(value) || value <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    if (type === "withdrawal" && balance < Number(value)) {
      toast.error("Insufficient balance.");
      return;
    }
    if (type === "withdrawal" && Number(value) < 100) {
      toast.error("Minimum withdrawal amount is Rs. 100");
      return;
    }
    const numRegex = /^\d{10}$/;
    if (!numRegex.test(number)) {
      toast.error("Mobile number must be 10 digits");
      return;
    }
    if (type === "deposit" && transactionData.upiId.length !== 12) {
      toast.error("UPI ID must be 12 characters long ");
      return;
    }

    const ifscRegex = /^[A-Za-z]{4}[0-9]{7}$/;
    if (type === "withdrawal" && !ifscRegex.test(transactionData.ifsc)) {
      toast.error(
        "IFSC code must be 11 characters long and contain only letters and numbers"
      );
      return;
    }
    const bankRegex = /^\d{12}$/;
    if (type === "withdrawal" && !bankRegex.test(transactionData.bankNo)) {
      toast.error("Bank account number must be 12 digits");
      return;
    }
    try {
      setLoading(true);
      const userId = localStorage.getItem("user")?.slice(1, -1);
      if (!userId) throw new Error("User ID not found.");

      // const userDoc = userSnapshot.docs[0];
      // const currentMoney = userDoc.data().money || 0;
      // const numValue = parseFloat(value);
      // const newMoney =
      //   type === "add" ? currentMoney + numValue : currentMoney - numValue;

      // if (newMoney < 0) throw new Error("Insufficient balance.");

      // // Update Firestore document to reflect the new balance
      // await updateDoc(userDoc.ref, { money: newMoney });

      // // Create a new transaction document in the 'transactions' subcollection
      // const transactionRef = collection(userDoc.ref, "transactions");

      // // Each transaction gets a unique document ID automatically by Firestore
      // await addDoc(transactionRef, {
      //   amount: numValue,
      //   type: type === "add" ? "Deposit" : "Withdrawal",
      //   timestamp: new Date().toISOString(),
      // });

      // toast.success(`${type === "add" ? "Deposit" : "Withdrawal"} successful!`);
      // setBalance(newMoney);
      // type === "add" ? setAmount("") : setWithdrawAmount("");
      // await fetchPayments();
      const response = await handleTransactionRequest(
        userId,
        Number(value),
        number,
        type,
        transactionData.upiId,
        transactionData.ifsc,
        transactionData.bankNo
      );
      console.log(response, "rs ::");
      toast.success(type + " request successfull!");
    } catch (error) {
      toast.error(error.message || type + " request failed. Please try again.");
    } finally {
      setAmount("");
      setWithdrawAmount("");
      setNumbers("");
      setWithdrawNumbers("");
      setTransactionData(initialState);
      setLoading(false);
    }
  };

  // Copy referral URL
  const handleCopyReferralUrl = () => {
    navigator.clipboard
      .writeText(referralUrl)
      .then(() => toast.success("Referral URL copied!"))
      .catch(() => toast.error("Failed to copy URL."));
  };

  const filteredPayments = useMemo(() => {
    const now = new Date(); // Compute current date once

    return payments.filter((payment) => {
      if (filter.value === "all") return true;
      const paymentDate = new Date(payment.timestamp);

      // Filter for "today"
      if (filter.value === "today") {
        return (
          paymentDate.getDate() === now.getDate() &&
          paymentDate.getMonth() === now.getMonth() &&
          paymentDate.getFullYear() === now.getFullYear()
        );
      }

      // Filter for "this month"
      return (
        paymentDate.getMonth() === now.getMonth() &&
        paymentDate.getFullYear() === now.getFullYear()
      );
    });
  }, [payments, filter]);

  // return !balance ? <Loader /> : (
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Toaster position="top-center" />

      {/* Responsive Navigation */}
      <nav className="md:hidden">
        <MobileNavbar />
      </nav>
      <nav className="hidden md:block">
        <Navbar />
      </nav>

      <main className="container mx-auto mt-10 px-4 py-8 lg:max-w-4xl">
        <div className="bg-white rounded-xl p-3 lg:p-6 space-y-6">
          {/* Balance Display */}
          <div className="text-center mt-3 lg:mt-4">
            <h2 className="text-3xl font-bold text-red-600">
              ₹{balance ? balance.toLocaleString() : 0.0}
            </h2>
            <p className="text-gray-500">Current Balance</p>
          </div>

          {/* Transaction Sections */}
          <div className="grid md:grid-cols-2 gap-6 mt-8">
            {/* Deposit Section */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-4">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <ArrowUpTrayIcon className="w-6 h-6 mr-2" />
                  Deposit
                </h3>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleTransaction(
                    "deposit",
                    amount,
                    transactionData.depositNumbers
                  );
                }}
                className="p-6 space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      ₹
                    </span>
                    <input
                      type="number"
                      placeholder="Enter amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Mobile Number
                  </label>
                  <input
                    type="number"
                    placeholder="Enter payment processing number"
                    value={transactionData.depositNumbers}
                    onChange={(e) =>
                      setTransactionData({
                        ...transactionData,
                        depositNumbers: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    UPI Transaction ID
                  </label>
                  <input
                    placeholder="Enter UPI transaction ID"
                    value={transactionData.upiId}
                    onChange={(e) =>
                      setTransactionData({
                        ...transactionData,
                        upiId: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-gray-600 font-medium mb-3">
                    Scan QR for Deposit
                  </p>
                  <div className="bg-white p-3 rounded-lg inline-block">
                    <img
                      src="https://www.lyra.com/in/wp-content/uploads/sites/8/2020/05/OQ-Code-Payments.png"
                      className="h-40 w-40 object-contain"
                      alt="QR Code"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl font-medium hover:from-green-600 hover:to-green-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Processing..." : "Deposit Now"}
                </button>
              </form>
            </div>

            {/* Withdraw Section */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-red-500 to-red-600 p-4">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <ArrowDownTrayIcon className="w-6 h-6 mr-2" />
                  Withdraw
                </h3>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleTransaction(
                    "withdrawal",
                    withdrawAmount,
                    transactionData.withdrawNumbers
                  );
                }}
                className="p-6 space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      ₹
                    </span>
                    <input
                      type="number"
                      placeholder="Enter amount"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Mobile Number
                  </label>
                  <input
                    type="number"
                    placeholder="Enter payment processing number"
                    value={transactionData.withdrawNumbers}
                    onChange={(e) =>
                      setTransactionData({
                        ...transactionData,
                        withdrawNumbers: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    IFSC Code
                  </label>
                  <input
                    placeholder="Enter your IFSC Code"
                    value={transactionData.ifsc}
                    onChange={(e) =>
                      setTransactionData({
                        ...transactionData,
                        ifsc: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Bank Account Number
                  </label>
                  <input
                    type="number"
                    placeholder="Enter your Bank Account Number"
                    value={transactionData.bankNo}
                    onChange={(e) =>
                      setTransactionData({
                        ...transactionData,
                        bankNo: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-xl font-medium hover:from-red-600 hover:to-red-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Processing..." : "Withdraw Now"}
                </button>
              </form>
            </div>
          </div>

          {/* Transaction Filter */}
          <div>
            <label className="block mb-2 text-gray-700">
              Filter Transactions:
            </label>
            <Menu as="div" className="relative">
              <Menu.Button className="flex justify-between w-full bg-white border rounded-md px-4 py-2 hover:bg-gray-50">
                {filter.label}
                <ChevronDownIcon className="h-5 w-5 text-red-600" />
              </Menu.Button>
              <Menu.Items className="absolute z-10 w-full mt-2 bg-white shadow-lg rounded-md overflow-hidden">
                {FILTER_OPTIONS.map((option) => (
                  <Menu.Item key={option.value}>
                    {({ active }) => (
                      <button
                        onClick={() => setFilter(option)}
                        className={`block w-full text-left px-4 py-2 ${
                          active ? "bg-red-100" : ""
                        } ${filter.value === option.value ? "bg-red-200" : ""}`}
                      >
                        {option.label}
                      </button>
                    )}
                  </Menu.Item>
                ))}
              </Menu.Items>
            </Menu>
          </div>

          {/* Transaction History */}
          <div>
            <h3 className="text-xl font-semibold mb-4 text-gray-800">
              Transaction History
            </h3>
            {filteredPayments.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto scroll-smooth">
                {filteredPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className={`flex justify-between p-3 rounded-lg ${
                      payment.type === "deposit" ? "bg-green-100" : "bg-red-100"
                    }`}
                  >
                    <div>
                      <div className="flex items-center">
                        <p className="font-medium">{payment.type}</p>
                        <span
                          className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                            payment.status === "pending"
                              ? "bg-yellow-200 text-yellow-800"
                              : payment.status === "approved"
                              ? "bg-green-200 text-green-800"
                              : payment.status === "rejected"
                              ? "bg-red-200 text-red-800"
                              : "bg-gray-200 text-gray-800"
                          }`}
                        >
                          {payment.status || "-"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {/* Improved date formatting */}
                        {payment && payment.timestamp
                          ? new Date(payment.timestamp).toLocaleString(
                              "en-IN",
                              {
                                weekday: "short",
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "numeric",
                                second: "numeric",
                              }
                            )
                          : "N/A"}
                      </p>
                    </div>
                    <span
                      className={`font-bold ${
                        payment.type === "deposit"
                          ? "text-green-700"
                          : "text-red-700"
                      }`}
                    >
                      {payment.formattedAmount}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500">
                No transactions available.
              </p>
            )}
          </div>

          {/* Referral Section */}
          <div className="mb-3 lg:mb-4">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">
              Referral Code
            </h3>
            <div className="flex">
              {referralUrl ? (
                <input
                  type="text"
                  value={referralUrl}
                  readOnly
                  className="w-full p-2 border rounded-l-lg bg-gray-100 truncate"
                />
              ) : (
                <input
                  type="text"
                  value={"Please try again later"}
                  readOnly
                  className="w-full p-2 border rounded-l-lg bg-gray-100 truncate"
                />
              )}
              <button
                onClick={handleCopyReferralUrl}
                className="bg-red-600 text-white p-2 rounded-r-lg hover:bg-red-700 transition-colors"
              >
                <ClipboardDocumentIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Responsive Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0">
        <BottomMenu />
      </nav>

      {/* Desktop Footer */}
      <footer className="hidden md:block">
        <Footer />
      </footer>
    </div>
  );
}
