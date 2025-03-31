import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  XMarkIcon,
  TrophyIcon,
  FaceFrownIcon,
} from "@heroicons/react/24/outline";
import confetti from "canvas-confetti";

const WinLoseScreen = ({ myHistory, setResultDisplay }) => {
  const isWin = myHistory?.result === "Win";

  useEffect(() => {
    if (isWin) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [isWin]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{
          scale: 1,
          opacity: 1,
          transition: { type: "spring", damping: 15 },
        }}
        exit={{ scale: 0.5, opacity: 0 }}
        className={`bg-gradient-to-br ${
          isWin
            ? "from-yellow-900 via-yellow-800 to-yellow-900"
            : "from-gray-900 via-gray-800 to-gray-900"
        } rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative border-2 ${
          isWin ? "border-yellow-500" : "border-red-500"
        }`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent)] animate-pulse" />
        {/* <button
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 transition-colors "
          onClick={() => setResultDisplay(false)}
        >
          <XMarkIcon className="w-5 h-5 text-white cursor-pointer" />
        </button> */}

        <div className="p-8 relative">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: isWin ? [0, 10, -10, 0] : 0,
            }}
            transition={{
              duration: 0.5,
              repeat: isWin ? Infinity : 0,
              repeatDelay: 1,
            }}
            className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${
              isWin
                ? "bg-gradient-to-r from-yellow-400 to-yellow-600 shadow-[0_0_30px_rgba(234,179,8,0.5)]"
                : "bg-gradient-to-r from-red-500 to-red-600 shadow-[0_0_30px_rgba(239,68,68,0.5)]"
            }`}
          >
            {isWin ? (
              <TrophyIcon className="w-12 h-12 text-white" />
            ) : (
              <FaceFrownIcon className="w-12 h-12 text-white" />
            )}
          </motion.div>

          <motion.h2
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className={`text-3xl font-bold text-center mb-4 ${
              isWin ? "text-yellow-400" : "text-red-400"
            }`}
          >
            {isWin ? "Congratulations!" : "Better Luck Next Time!"}
          </motion.h2>

          <p className="text-center text-gray-300 mb-8">
            {isWin
              ? "You've won! Your strategy and skill have paid off."
              : "Don't give up! Every attempt brings you closer to victory."}
          </p>

          {isWin && (
            <>
              <div className="mb-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                <div className="text-center">
                  <p className="text-sm text-gray-300">Winning Number</p>
                  <motion.p
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="font-bold text-2xl text-yellow-400"
                  >
                    {myHistory?.drawNumber}
                  </motion.p>
                </div>
              </div>
              <div className="mb-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                <div className="text-center">
                  <p className="text-sm text-gray-300">Winning Amount</p>
                  <motion.p
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="font-bold text-2xl text-yellow-400"
                  >
                    {myHistory?.winningAmount?.toFixed(2)}
                  </motion.p>
                </div>
              </div>
            </>
          )}

          <div className="mb-8 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
            <div className="text-center">
              <p className="text-sm text-gray-300">Result</p>
              <motion.p
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className={`font-bold text-2xl ${
                  isWin ? "text-yellow-400" : "text-red-400"
                }`}
              >
                {myHistory?.result}
              </motion.p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-6 py-3 rounded-xl text-white font-medium transition-all
                ${
                  isWin
                    ? "bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700"
                    : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                } focus:ring-2 focus:ring-offset-2 focus:outline-none`}
              onClick={() => setResultDisplay(false)}
            >
              Continue
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 rounded-xl font-medium transition-all
                        text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm
                        focus:ring-2 focus:ring-white/30 focus:outline-none "
              onClick={() => setResultDisplay(false)}
            >
              Close
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default WinLoseScreen;
