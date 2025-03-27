// components/AdminPanel.jsx
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, firestore } from "../utils/firebase";
import { toast, Toaster } from "react-hot-toast";
import { RoomCard } from "../components/AdminUI/RoomCard";
import { TIMER_DURATIONS } from "./../constants/timerConfig";
import Custom404 from "../components/UI/Custom404";
import Navbar from "../components/UI/Navbar";
import MobileNavbar from "../components/UI/MobileNavbar";
import BottomMenu from "../components/UI/BottomMenu";
import Footer from "../components/UI/Footer";
import "../app/globals.css";
import Loader from "../components/UI/Loader";
import RequestHistoryTable from "./request-table";
import { addDoc, collection, getDocs } from "firebase/firestore";
import { serverTimestamp } from "firebase/database";

export const AdminPanel = () => {
  const [user] = useAuthState(auth);
  const [selections, setSelections] = useState({});
  const [loading, setLoading] = useState(false);
  const [registeredUsers, setRegisteredUsers] = useState({
    count: 0,
    loading: true,
  });

  const rooms = [
    { id: 0, duration: TIMER_DURATIONS.ONE_MIN },
    { id: 1, duration: TIMER_DURATIONS.THREE_MIN },
    { id: 2, duration: TIMER_DURATIONS.FIVE_MIN },
    { id: 3, duration: TIMER_DURATIONS.TEN_MIN },
  ];

  // Fetch the total number of registered users
  const fetchRegisteredUsers = async () => {
    try {
      const usersRef = collection(firestore, "users");
      const usersSnapshot = await getDocs(usersRef);

      setRegisteredUsers({
        count: usersSnapshot.size,
        loading: false,
      });
    } catch (error) {
      console.error("Error fetching registered users:", error);
      setRegisteredUsers({
        count: 0,
        loading: false,
      });
    }
  };

  // Fetch registered users when component mounts
  useEffect(() => {
    if (user?.providerData[0].email === "redgreen7405@gmail.com") {
      fetchRegisteredUsers();
    }
  }, [user]);

  const handleValueChange = (roomId, type, value) => {
    setSelections((prev) => ({
      [roomId]: { ...prev[roomId], [type]: value },
    }));
  };

  const handleAddDraw = async (roomId) => {
    console.log(roomId, selections);

    const roomSelections = selections[0] || {};
    const loadingToast = toast.loading("Processing...");

    if (
      !roomSelections.number ||
      !roomSelections.color ||
      !roomSelections.size
    ) {
      toast.dismiss(loadingToast);
      toast.error("Please select all options before submitting");
      return;
    }

    setLoading(true);
    try {
      const docRef = await addDoc(collection(firestore, "adminResults"), {
        period: roomId,
        number: parseInt(roomSelections.number),
        color: roomSelections.color,
        bigSmall: roomSelections.size,
        timestamp: serverTimestamp(),
      });
      console.log({
        period: roomId,
        number: parseInt(roomSelections.number),
        color: roomSelections.color,
        bigSmall: roomSelections.size,
        timestamp: serverTimestamp(),
      });
      toast.success(
        `Selections added successfully for Room ${roomId} Number is ${roomSelections.number}`
      );
      setSelections((prev) => ({ ...prev, [roomId]: {} }));
    } catch (error) {
      console.error("Error adding draw:", error);
      toast.error("An error occurred. Please try again");
    } finally {
      toast.dismiss(loadingToast);
      setLoading(false);
    }
  };

  if (!user?.providerData[0].email) return <Loader />;
  if (user?.providerData[0].email !== "redgreen7405@gmail.com")
    return <Custom404 />;

  return (
    <>
      <Toaster position="top-center" />
      <div className="hidden md:block mb-12">
        <Navbar />
      </div>
      <div className="block md:hidden mb-12">
        <MobileNavbar />
      </div>

      <main className="px-4 py-8 mb-12 lg:mb-0">
        <div className="mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <div className="mt-3 md:mt-0 p-3 bg-white rounded-lg shadow-sm">
              <span className="font-medium text-gray-700">
                Total Registered Users:{" "}
              </span>
              {registeredUsers.loading ? (
                <span className="inline-block w-12 h-5 bg-gray-200 rounded animate-pulse"></span>
              ) : (
                <span className="font-bold text-blue-600">
                  {registeredUsers.count}
                </span>
              )}
            </div>
          </div>

          {/* Dashboard Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <div className="text-sm text-gray-500">Total Users</div>
              <div className="text-2xl font-bold text-blue-600">
                {registeredUsers.loading ? (
                  <div className="animate-pulse h-8 w-20 bg-gray-200 rounded"></div>
                ) : (
                  registeredUsers.count
                )}
              </div>
            </div>
            {/* You can add more summary stats here in the future */}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {rooms.map(({ id, duration }) => (
              <RoomCard
                key={id}
                roomNumber={id + 1}
                duration={duration}
                onSubmit={handleAddDraw}
                loading={loading}
                selectedValues={selections[id] || {}}
                onValueChange={(type, value) =>
                  handleValueChange(id, type, value)
                }
              />
            ))}
          </div>
        </div>
      </main>

      <RequestHistoryTable />

      <div className="hidden md:block mt-0">
        <Footer />
      </div>
      <div className="block md:hidden fixed bottom-0 w-full z-20 mt-12">
        <BottomMenu />
      </div>
    </>
  );
};

export default AdminPanel;
