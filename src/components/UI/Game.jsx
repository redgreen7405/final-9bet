import React, { useState } from "react";
import Image from "next/image";
import balls from "../../assets";
import { useEffect } from "react";
import Drawer from "./Drawer";

const Game = ({
  showOverlay,
  timeLeft,
  selected,
  setMoney,
  setBidAmount,
  newPeriod,
  setSelected,
}) => {
  const [images] = useState(balls);
  const [isOpen, setIsOpen] = useState(false);
  const [color, setColor] = useState("green");

  const handlePlayButton = (e) => {
    const buttonId = e.target.id;
    const cleanedId = buttonId.replace("Button", "");
    setSelected(cleanedId);
    if (["red", "green", "violet"].includes(cleanedId)) {
      setColor(cleanedId);
    } else if (["0", "2", "4", "6", "8"].includes(cleanedId)) {
      setColor("red");
    } else if (["1", "3", "5", "7", "9"].includes(cleanedId)) {
      setColor("green");
    } else if (cleanedId === "big") {
      setColor("red");
    } else if (cleanedId === "small") {
      setColor("sky");
    }
    setIsOpen((prev) => !prev);
  };
  const activeButton = localStorage.getItem("btnIndx") || 0;
  useEffect(() => {
    timeLeft[activeButton] < 11 && setIsOpen(false);
  }, [timeLeft]);
  return (
    <div className="relative w-full max-w-full mx-auto md:max-w-2xl flex flex-col items-center justify-center space-y-6 px-5 py-0">
      {/* Overlay Warning */}
      {showOverlay && (
        <div className="absolute inset-0 mx-4 my-0 z-10 rounded-lg overflow-hidden">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/90 via-red-800/90 to-orange-900/90 animate-gradient-xy"></div>

          {/* Decorative patterns */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTUiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg==')] bg-repeat"></div>
          </div>

          {/* Content container */}
          <div className="relative h-full flex flex-col items-center justify-center">
            {/* Timer display */}
            <div className="text-center space-y-4">
              {timeLeft[activeButton] > 1 ? (
                <>
                  <div className="text-white text-2xl font-bold mb-2">
                    Time Remaining
                  </div>
                  <div className="text-8xl md:text-9xl font-black bg-gradient-to-r from-yellow-300 via-white to-yellow-300 text-transparent bg-clip-text animate-pulse">
                    {timeLeft[activeButton]}
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="text-4xl md:text-6xl font-black text-white animate-bounce">
                    Time is Up!
                  </div>
                  <div className="text-yellow-300 text-xl md:text-2xl font-semibold animate-pulse">
                    Results coming soon...
                  </div>
                </div>
              )}
            </div>

            {/* Decorative elements */}
            <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/30 to-transparent"></div>
          </div>
        </div>
      )}

      {/* Color Selection Buttons */}
      <div className="w-full flex flex-wrap justify-between md:space-y-0 md:space-x-4">
        {[
          { id: "redButton", color: "bg-red-500", label: "Red" },
          { id: "violetButton", color: "bg-purple-500", label: "Violet" },
          { id: "greenButton", color: "bg-green-500", label: "Green" },
        ].map((button) => (
          <button
            key={button.id}
            id={button.id}
            onClick={handlePlayButton}
            className={`
              ${button.color} text-white font-bold 
              py-2 px-4 rounded-lg hover:bg-opacity-90 
              flex-1 mx-1 transition-all duration-300
            `}
          >
            {button.label}
          </button>
        ))}
      </div>

      {/* Ball Images Grid */}
      <div className="rounded-lg p-3 w-full">
        {/* First Row of Balls */}
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {images.slice(0, 5).map((image, index) => (
            <div
              key={index}
              className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 cursor-pointer"
            >
              <Image
                src={image.src}
                id={`${index}Button`}
                onClick={handlePlayButton}
                alt={`Ball ${index}`}
                width={128}
                height={128}
                className="w-full h-full object-contain"
                priority
              />
            </div>
          ))}
        </div>

        {/* Second Row of Balls */}
        <div className="flex flex-wrap justify-center gap-2">
          {images.slice(5, 10).map((image, index) => (
            <div
              key={index + 5}
              className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 cursor-pointer"
            >
              <Image
                src={image.src}
                id={`${index + 5}Button`}
                onClick={handlePlayButton}
                alt={`Ball ${index + 5}`}
                width={128}
                height={128}
                className="w-full h-full object-contain"
                priority
              />
            </div>
          ))}
        </div>
      </div>

      {/* Big/Small Buttons */}
      <div className="w-full flex justify-center mt-6 pb-2">
        <div className="flex space-x-0 bg-gray-100 rounded-3xl p-1 shadow-md w-full">
          <button
            id="bigButton"
            onClick={handlePlayButton}
            className="bg-red-600 text-white text-sm md:text-lg font-bold py-2 px-10 md:px-16 rounded-l-3xl hover:bg-red-700 flex-1 transition-all duration-300"
          >
            Big
          </button>
          <button
            id="smallButton"
            onClick={handlePlayButton}
            className="bg-sky-500 text-white text-sm md:text-lg font-bold py-2 px-10 md:px-16 rounded-r-3xl hover:bg-sky-600 flex-1 transition-all duration-300"
          >
            Small
          </button>
        </div>
      </div>

      <Drawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        color={color}
        totalAmount={1.0}
        selected={selected}
        setMoney={setMoney}
        setBidAmount={setBidAmount}
        newPeriod={newPeriod}
      />
    </div>
  );
};

export default Game;
