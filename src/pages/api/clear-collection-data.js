import { ref, set, remove } from "firebase/database";

// Function to clear all records from the randomData database
export const clearRandomDataDatabase = async () => {
  try {
    // Reference to the randomData node in the database
    const randomDataRef = ref(database, "randomData");

    // Remove all data under the randomData node
    await remove(randomDataRef);

    return {
      status: "success",
      message: "All records have been deleted from the randomData database",
    };
  } catch (error) {
    console.error("Error clearing randomData database:", error);
    return {
      status: "error",
      message: error.message || "Error clearing randomData database",
    };
  }
};
