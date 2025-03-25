import { useState, useEffect } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import toast from "react-hot-toast";
import { firestore } from "../utils/firebase";
import {
  getTransactions,
  updateTransactionStatus,
} from "./api/all-transactions";
import { serverTimestamp } from "firebase/database";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";

const RequestHistoryTable = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  const [tableHeaders] = useState([
    { label: "User ID", key: "userId" },
    { label: "Number", key: "upiNumber" },
    { label: "UPI ID", key: "upiId" },
    { label: "IFSC", key: "ifsc" },
    { label: "Bank A/C", key: "bankNo" },
    { label: "Amount", key: "amount" },
    { label: "Transaction Type", key: "type" },
    { label: "Date", key: "timestamp" },
    { label: "Actions", key: "actions" },
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const fetchedTransactions = await getTransactions(); // Get the transactions from Firebase
      setData(fetchedTransactions);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Something went wrong while fetching data.");
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (transactionId, status, data) => {
    try {
      setLoadingTransactions(true);
      await updateTransactionStatus(transactionId, status, data); // Update the transaction status in Firebase
      fetchData();
      toast.success(`Transaction ${status}`);
    } catch (error) {
      console.error("Error updating transaction status:", error);
      toast.error("Error updating transaction status.");
    } finally {
      setLoadingTransactions(false);
    }
  };

  // Filter data based on search term
  const filteredData = data.filter((transaction) =>
    Object.values(transaction)
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  return (
    <div className="container mx-auto px-4 py-6 text-center">
      {/* Search Input */}
      <div className="mb-4 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search by User ID, Amount, or Type"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Items per page selector */}
      <div className="flex justify-end mb-4">
        <select
          value={itemsPerPage}
          onChange={(e) => {
            setItemsPerPage(Number(e.target.value));
            setCurrentPage(1); // Reset to first page when changing items per page
          }}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={5}>5 per page</option>
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
          <option value={50}>50 per page</option>
        </select>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="w-full text-sm text-center">
          {/* Table Header */}
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              {tableHeaders.map((header) => (
                <th key={header.label} className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center">
                    {header.label}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="max-h-30 overflow-y-auto">
            {loading ? (
              <tr>
                <td
                  colSpan={tableHeaders.length}
                  className="px-4 py-3 text-center text-gray-500"
                >
                  Loading...
                </td>
              </tr>
            ) : currentItems.length === 0 ? (
              <tr>
                <td
                  colSpan={tableHeaders.length}
                  className="px-4 py-3 text-center text-gray-500"
                >
                  No transactions found
                </td>
              </tr>
            ) : (
              currentItems.map((transaction) => (
                <tr
                  key={transaction.id}
                  className={`border-b hover:bg-gray-100 transition duration-200 ${
                    transaction.type === "deposit" &&
                    transaction.status !== "pending"
                      ? "bg-green-100"
                      : transaction.status === "pending"
                      ? "bg-yellow-100"
                      : "bg-red-100"
                  }`}
                >
                  <td className="px-4 py-3 text-center">
                    {transaction.userId}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {transaction.upiNumber ? transaction.upiNumber : "-"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {transaction.upiId ? transaction.upiId : "-"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {transaction.ifsc ? transaction.ifsc : "-"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {transaction.bankNo ? transaction.bankNo : "-"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {transaction.amount}
                  </td>
                  <td className="px-4 py-3 text-center">{transaction.type}</td>
                  <td
                    className="px-4 py-3 text-center cursor-info"
                    title={new Date(transaction.timestamp).toLocaleString()}
                  >
                    {
                      new Date(transaction.timestamp)
                        .toLocaleString()
                        .split(",")[0]
                    }
                  </td>
                  <td className="px-4 py-3 text-center">
                    {transaction.status === "pending" && (
                      <>
                        <button
                          onClick={() =>
                            handleApproval(
                              transaction.id,
                              "approved",
                              transaction
                            )
                          }
                          disabled={loadingTransactions}
                          className="px-4 py-2 text-white bg-green-500 rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed "
                        >
                          Approve
                        </button>
                        <button
                          onClick={() =>
                            handleApproval(
                              transaction.id,
                              "rejected",
                              transaction
                            )
                          }
                          disabled={loadingTransactions}
                          className="ml-2 px-4 py-2 text-white bg-red-500 rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed "
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {transaction.status === "approved" && (
                      <span className="text-white rounded bg-green-500 bg-clip-border px-2 py-1.5 ">
                        Approved
                      </span>
                    )}
                    {transaction.status === "rejected" && (
                      <span className="text-white rounded bg-red-500 bg-clip-border px-2 py-1.5 ">
                        Rejected
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredData.length > 0 && (
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-700">
            Showing {indexOfFirstItem + 1} to{" "}
            {Math.min(indexOfLastItem, filteredData.length)} of{" "}
            {filteredData.length} entries
          </div>
          <div className="flex space-x-1">
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-md ${
                currentPage === 1
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Show 5 pages max with current page in the middle when possible
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => paginate(pageNum)}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === pageNum
                      ? "bg-blue-600 text-white"
                      : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded-md ${
                currentPage === totalPages
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestHistoryTable;
