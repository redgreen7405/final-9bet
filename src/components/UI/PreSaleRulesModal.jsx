import React from "react";

const PreSaleRulesModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl w-[90%] max-w-2xl max-h-[80vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-orange-500 px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">Pre-sale Rules</h3>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh] text-gray-700">
          <div className="space-y-4">
            <p className="font-semibold text-lg">
              In order to protect the legitimate rights and interests of users
              participating in the pre-sale and maintain the normal operating
              order of the pre-sale, these rules are formulated in accordance
              with relevant agreements and laws and regulations.
            </p>

            <div>
              <h4 className="font-bold text-lg mb-2">Chapter 1 Definition</h4>
              <div className="space-y-3">
                <p>
                  <span className="font-semibold">
                    1.1 Pre-sale definition:
                  </span>{" "}
                  refers to a sales model in which a seller offers a bundle of a
                  product or service, collects consumer orders through product
                  tools before selling, and makes it available to customers.
                </p>

                <p>
                  <span className="font-semibold">1.2 Presale mode:</span> is
                  "deposit" mode. "Consignment" refers to the pre-delivery of a
                  fixed number of items prior to sale.{" "}
                  <span className="text-red-600 font-semibold">
                    "Deposit" Scam Join mini games for a chance to win more
                    deposits. Deposits can be exchanged directly for goods.
                    Deposit is not refundable.
                  </span>
                </p>

                <p>
                  <span className="font-semibold">1.3 Pre-sale product:</span> A
                  product that is shipped by the seller using the pre-sale
                  product tool. Only highlight the word presale on the product
                  name or product detail page, and products that do not use the
                  presale product tool are not presale.
                </p>

                <p>
                  <span className="font-semibold">1.4 Pre-sale system:</span>{" "}
                  refers to the system product tool that helps sellers to sell
                  samples before selling.
                </p>

                <p>
                  <span className="font-semibold">
                    1.5 Product price before selling:
                  </span>{" "}
                  is the selling price of the product before selling. The price
                  of pre-sale items consists of two parts: deposit and final
                  payment.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-red-600 to-orange-500 text-white py-2 rounded-lg hover:opacity-90 transition-opacity font-semibold"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreSaleRulesModal;
