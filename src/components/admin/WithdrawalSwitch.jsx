import { useState, useEffect } from "react";
import { collection, doc, getDoc, setDoc } from "firebase/firestore";
import { firestore } from "../../utils/firebase";

export default function WithdrawalSwitch() {
  const [isRestricted, setIsRestricted] = useState(true);

  useEffect(() => {
    fetchSetting();
  }, []);

  const fetchSetting = async () => {
    const settingDoc = await getDoc(doc(firestore, "settings", "withdrawal"));
    if (settingDoc.exists()) {
      setIsRestricted(settingDoc.data().isRestricted);
    }
  };

  const toggleRestriction = async () => {
    try {
      await setDoc(doc(firestore, "settings", "withdrawal"), {
        isRestricted: !isRestricted,
        updatedAt: new Date(),
      });
      setIsRestricted(!isRestricted);
    } catch (error) {
      console.error("Error updating withdrawal setting:", error);
    }
  };

  return (
    <div className="flex items-center">
      <button
        onClick={toggleRestriction}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          isRestricted ? "bg-blue-600" : "bg-gray-200"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            isRestricted ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
