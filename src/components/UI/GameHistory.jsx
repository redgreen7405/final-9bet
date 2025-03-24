"use client";

import { useState } from "react";
import RandomDataTable from "./RandomDataTable";
import MyHistoryTable from "./MyHistoryTable";

const GameHistory = ({ result }) => {
  const [activeTab, setActiveTab] = useState("1M");
  const [activeTable, setActiveTable] = useState("gameHistory");

  const tabs = [
    { id: "1M", label: "1 Min" },
    { id: "3M", label: "3 Min" },
    { id: "5M", label: "5 Min" },
    { id: "10M", label: "10 Min" },
  ];

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="flex flex-col items-center justify-center mt-8 space-y-4">
      <div className="w-full max-w-full md:max-w-2xl px-4 flex flex-row justify-between space-x-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`${
              activeTab === tab.id
                ? "bg-red-600 text-white"
                : "bg-gray-200 text-gray-500"
            } text-sm md:text-base font-bold py-2 px-2 md:py-3 md:px-4 rounded-lg flex-1 transition-colors duration-300 ${
              activeTab === tab.id ? "hover:bg-red-600" : "hover:bg-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="w-full max-w-full md:max-w-2xl px-4 flex flex-row justify-between space-x-2">
        <button
          onClick={() => setActiveTable("gameHistory")}
          className={`${
            activeTable === "gameHistory"
              ? "bg-red-600 text-white"
              : "bg-gray-200 text-gray-500"
          } text-sm md:text-lg font-bold py-2 px-4 md:py-3 md:px-6 rounded-lg flex-1 transition-colors duration-300 ${
            activeTable === "gameHistory"
              ? "hover:bg-red-600"
              : "hover:bg-gray-300"
          }`}
        >
          Game History
        </button>
        <button
          onClick={() => setActiveTable("myHistory")}
          className={`${
            activeTable === "myHistory"
              ? "bg-red-600 text-white"
              : "bg-gray-200 text-gray-500"
          } text-sm md:text-lg font-bold py-2 px-4 md:py-3 md:px-6 rounded-lg flex-1 transition-colors duration-300 ${
            activeTable === "myHistory"
              ? "hover:bg-red-600"
              : "hover:bg-gray-300"
          }`}
        >
          My History
        </button>
      </div>

      {activeTable === "gameHistory" && (
        <div className="p-4 rounded-lg w-full max-w-full md:max-w-2xl">
          <RandomDataTable periodFilter={activeTab} />
        </div>
      )}
      {activeTable === "myHistory" && (
        <div className="mt-4 w-full max-w-full md:max-w-2xl">
          <p className="text-gray-700 text-sm md:text-base">
            {/* Content for My History tab! */}
            <MyHistoryTable periodFilter={activeTab} />
          </p>
        </div>
      )}
    </div>
  );
};

export default GameHistory;
