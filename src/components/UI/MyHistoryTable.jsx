import { useState, useEffect, useMemo } from "react";
import {
  MagnifyingGlassIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/20/solid";
import { getDocs, collection, query, where, orderBy } from "firebase/firestore";
import { firestore } from "../../utils/firebase";
import toast from "react-hot-toast";

const MyHistoryTable = ({ periodFilter = "1M" }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState([]);
  const [tableHeaders] = useState([
    { label: "Period", key: "slotId" },
    { label: "Selected", key: "betValue" },
    { label: "Amount", key: "totalBetAmount" },
    { label: "Result", key: "resultNumber" },
    { label: "Status", key: "isWin" },
    { label: "Date", key: "createdAt" },
  ]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });

  useEffect(() => {
    fetchData();
  }, [periodFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem("user")?.slice(1, -1);

      if (!userId) {
        toast.error("User not logged in");
        setLoading(false);
        return;
      }

      // Query the bids collection directly
      const bidsRef = collection(firestore, "bids");
      const q = query(bidsRef, where("userId", "==", userId));

      const querySnapshot = await getDocs(q);

      const fetchedData = querySnapshot.docs.map((doc) => {
        const bidData = doc.data();
        console.log(bidData);
        return {
          id: doc.id,
          slotId: bidData.slotId || "N/A",
          betValue: bidData.betValue || "N/A",
          totalBetAmount: bidData.totalBetAmount || 0,
          isWin:
            bidData.resultNumber !== undefined
              ? bidData.isWin
                ? "Win"
                : "Loss"
              : "Pending",
          resultNumber:
            bidData.resultNumber !== undefined
              ? bidData.resultNumber
              : "Pending",
          createdAt: bidData.createdAt
            ? new Date(bidData.createdAt.seconds * 1000)
            : new Date(),
        };
      });

      // Filter by period similar to RandomDataTable
      const filteredData = fetchedData.filter((item) => {
        // Check if slotId starts with the specified period (e.g., "1M", "3M", etc.)
        return item.slotId && item.slotId.startsWith(periodFilter);
      });

      setData(filteredData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching bid data:", error);
      toast.error("Something went wrong while fetching your bet history.");
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === "desc"
          ? "asc"
          : "desc",
    }));
  };

  // Process data with sorting, filtering, and pagination (without the time-based filtering)
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Filter data based on search term
    const filteredData = data.filter((item) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        !searchTerm ||
        (item.slotId && item.slotId.toLowerCase().includes(searchLower)) ||
        (item.betValue &&
          item.betValue.toString().toLowerCase().includes(searchLower)) ||
        (item.resultNumber &&
          item.resultNumber.toString().toLowerCase().includes(searchLower)) ||
        (item.isWin && item.isWin.toLowerCase().includes(searchLower)) ||
        (item.createdAt &&
          item.createdAt.toLocaleDateString().includes(searchLower))
      );
    });

    // Sort data
    const sortedData = [...filteredData].sort((a, b) => {
      const modifier = sortConfig.direction === "asc" ? 1 : -1;

      if (a[sortConfig.key] < b[sortConfig.key]) return -1 * modifier;
      if (a[sortConfig.key] > b[sortConfig.key]) return 1 * modifier;

      return 0;
    });

    // Paginate data
    const indexOfLastItem = currentPage * pageSize;
    const indexOfFirstItem = indexOfLastItem - pageSize;

    return sortedData.slice(indexOfFirstItem, indexOfLastItem);
  }, [data, searchTerm, sortConfig, currentPage, pageSize]);

  // Update the totalPages calculation to match the approach
  const totalPages = Math.ceil(
    data.filter((item) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        !searchTerm ||
        (item.slotId && item.slotId.toLowerCase().includes(searchLower)) ||
        (item.betValue &&
          item.betValue.toString().toLowerCase().includes(searchLower)) ||
        (item.resultNumber &&
          item.resultNumber.toString().toLowerCase().includes(searchLower)) ||
        (item.isWin && item.isWin.toLowerCase().includes(searchLower))
      );
    }).length / pageSize
  );

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1);
    setIsDropdownOpen(false);
  };

  return (
    <div className="container mx-auto px-4 py-6 text-center">
      {/* Search Input */}
      {/* <div className="mb-4 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search by Period, Selected, or Result"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div> */}

      {/* Responsive Table */}
      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="w-full text-sm text-center">
          {/* Table Header */}
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              {tableHeaders.map((header) => (
                <th
                  key={header.label}
                  className="px-4 py-3 text-center cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort(header.key)}
                >
                  <div className="flex items-center justify-center">
                    {header.label}
                    {sortConfig.key === header.key && (
                      <span className="ml-1">
                        {sortConfig.direction === "asc" ? (
                          <ArrowUpIcon className="h-4 w-4 inline" />
                        ) : (
                          <ArrowDownIcon className="h-4 w-4 inline" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={tableHeaders.length}
                  className="px-4 py-3 text-center text-gray-500"
                >
                  Loading...
                </td>
              </tr>
            ) : processedData.length === 0 ? (
              <tr>
                <td
                  colSpan={tableHeaders.length}
                  className="px-4 py-3 text-center text-gray-500"
                >
                  No bet history found
                </td>
              </tr>
            ) : (
              processedData.map((item) => (
                <tr
                  key={item.id}
                  className="border-b hover:bg-gray-100 transition duration-200"
                >
                  <td className="px-4 py-3 text-center">{item.slotId}</td>
                  <td className="px-4 py-3 text-center">
                    {item.betValue.charAt(0).toUpperCase() +
                      item.betValue.slice(1)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {item.totalBetAmount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center">{item.resultNumber}</td>
                  <td
                    className={`px-4 py-3 text-center font-medium ${
                      item.isWin === "Win"
                        ? "text-green-600"
                        : item.isWin === "Loss"
                        ? "text-red-600"
                        : "text-yellow-500"
                    }`}
                  >
                    {item.isWin}
                  </td>
                  {/* <td className="px-4 py-3 text-center">
                    {item.createdAt instanceof Date
                      ? item.createdAt.toLocaleString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "N/A"}
                  </td> */}
                  <td className="px-4 py-3 text-center">
                    {item.createdAt instanceof Date
                      ? item.createdAt
                          .toLocaleString("en-US", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                          .replace(/\/$/, "")
                      : "N/A"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative">
          {/* <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50"
          >
            {pageSize}
          </button> */}

          {isDropdownOpen && (
            <div className="absolute left-0 z-10 w-40 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5">
              <div className="py-1" role="menu">
                {[10, 20, 50, 100].map((size) => (
                  <button
                    key={size}
                    onClick={() => handlePageSizeChange(size)}
                    className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    role="menuitem"
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="p-2 border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="First page"
          >
            <ChevronDoubleLeftIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="p-2 border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Previous page"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <span className="px-4 py-2 text-sm text-gray-700">
            Page {currentPage} of {totalPages || 1}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => prev + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-2 border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Next page"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-2 border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Last page"
          >
            <ChevronDoubleRightIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyHistoryTable;
