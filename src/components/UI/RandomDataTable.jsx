import React, { useEffect, useMemo, useState } from "react";
import {
  ChevronUpDownIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from "@heroicons/react/24/solid";
import { ref, onValue, query, orderByChild, equalTo } from "firebase/database";
import { database } from "../../utils/firebase";

const getNumberColor = (number) => {
  const colorMap = {
    0: {
      bg: "bg-gradient-to-r from-red-500 to-purple-500",
      text: "text-white",
    },
    5: {
      bg: "bg-gradient-to-r from-green-500 to-purple-500",
      text: "text-white",
    },
    1: { bg: "bg-green-500", text: "text-white" },
    3: { bg: "bg-green-500", text: "text-white" },
    7: { bg: "bg-green-500", text: "text-white" },
    9: { bg: "bg-green-500", text: "text-white" },
    2: { bg: "bg-red-500", text: "text-white" },
    4: { bg: "bg-red-500", text: "text-white" },
    6: { bg: "bg-red-500", text: "text-white" },
    8: { bg: "bg-red-500", text: "text-white" },
  };

  return colorMap[number] || { bg: "bg-gray-500", text: "text-white" };
};

const RandomDataTable = ({ periodFilter = "1M" }) => {
  const [randomData, setRandomData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "timestamp",
    direction: "desc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Firebase real-time listener
  useEffect(() => {
    const dbRef = ref(database, "randomData");

    const unsubscribe = onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Convert to array and sort by timestamp
        const sortedEntries = Object.entries(data).sort(
          ([, a], [, b]) => b.timestamp - a.timestamp
        );

        // Map with period
        const dataArray = sortedEntries.map(([id, item]) => ({
          id,
          ...item,
        }));

        setRandomData(dataArray);
      }
    });

    return () => unsubscribe();
  }, []);

  // Reset page when period changes
  useEffect(() => {
    setCurrentPage(1);
  }, [periodFilter]);

  const tableHeaders = [
    { key: "period", label: "Period" },
    { key: "number", label: "Number" },
    { key: "bigSmall", label: "Big Small" },
    { label: "Color" },
    { key: "timestamp", label: "Date" },
  ];

  const processedData = useMemo(() => {
    if (!randomData || randomData.length === 0) return [];

    // First filter by period
    const periodFiltered = randomData.filter(
      (item) => item.period && item.period.startsWith(periodFilter)
    );

    // Then filter by search term
    const searchFiltered = periodFiltered.filter((item) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        (item.period && item.period.toLowerCase().includes(searchLower)) ||
        (item.number !== undefined &&
          item.number.toString().includes(searchLower)) ||
        (item.bigSmall && item.bigSmall.toLowerCase().includes(searchLower)) ||
        (item.timestamp &&
          new Date(item.timestamp).toLocaleDateString().includes(searchLower))
      );
    });

    // Finally sort the filtered data
    const sortedData = [...searchFiltered].sort((a, b) => {
      const modifier = sortConfig.direction === "asc" ? 1 : -1;
      if (sortConfig.key === "timestamp") {
        return (a[sortConfig.key] - b[sortConfig.key]) * modifier;
      }
      if (a[sortConfig.key] < b[sortConfig.key]) return -1 * modifier;
      if (a[sortConfig.key] > b[sortConfig.key]) return 1 * modifier;
      return 0;
    });

    const indexOfLastItem = currentPage * pageSize;
    const indexOfFirstItem = indexOfLastItem - pageSize;
    return sortedData.slice(indexOfFirstItem, indexOfLastItem);
  }, [randomData, periodFilter, searchTerm, sortConfig, currentPage, pageSize]);

  const handleSort = (key) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === "desc"
          ? "asc"
          : "desc",
    }));
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1);
    setIsDropdownOpen(false);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Update total pages calculation to include both period and search filters
  const totalPages = Math.ceil(
    randomData
      .filter((item) => item.period && item.period.startsWith(periodFilter))
      .filter((item) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          (item.period && item.period.toLowerCase().includes(searchLower)) ||
          (item.number !== undefined &&
            item.number.toString().includes(searchLower)) ||
          (item.bigSmall &&
            item.bigSmall.toLowerCase().includes(searchLower)) ||
          (item.timestamp &&
            new Date(item.timestamp).toLocaleDateString().includes(searchLower))
        );
      }).length / pageSize
  );

  return (
    <div className="container mx-auto px-4 py-6">
      {/* <div className="mb-6 flex justify-center items-center gap-4 flex-col sm:flex-row">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by Period, Number, or Big Small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div> */}

      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="w-full text-sm text-center">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              {tableHeaders.map((header) => (
                <th
                  key={header.label}
                  className={`px-4 py-3 text-center cursor-pointer ${
                    header.key ? "hover:bg-gray-100" : ""
                  }`}
                  onClick={() => header.key && handleSort(header.key)}
                >
                  <div className="flex items-center justify-center">
                    {header.label}
                    {header.key && sortConfig.key === header.key && (
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
          <tbody>
            {processedData.length === 0 ? (
              <tr>
                <td
                  colSpan={tableHeaders.length}
                  className="px-4 py-3 text-center text-gray-500"
                >
                  No data found
                </td>
              </tr>
            ) : (
              processedData.map((data) => (
                <tr
                  key={data.id}
                  className="border-b hover:bg-gray-100 transition duration-200"
                >
                  <td className="px-4 py-3 text-center">{data.period}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center">
                      <div
                        className={`${getNumberColor(data.number).bg} ${
                          getNumberColor(data.number).text
                        } w-8 h-8 flex items-center justify-center rounded-full font-bold text-lg`}
                      >
                        {data.number}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center capitalize">
                    {data.bigSmall}
                  </td>
                  <td className="px-4 py-3 flex justify-center space-x-2">
                    {data.colors.map((color, index) => (
                      <span
                        key={index}
                        className="w-4 h-4 sm:w-5 sm:h-5 rounded-full inline-block"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {data.timestamp
                      ? new Date(data.timestamp)
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
            Show {pageSize} entries
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

export default RandomDataTable;
