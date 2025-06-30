import axios from "axios";

export async function sendTeamsNotification(
  employeeEmail: string,
  message: string
) {
  try {
    const payload = {
      recipient: employeeEmail,
      body: message,
    };

    const response = await axios.post(
      process.env.POWER_AUTOMATE_WEBHOOK_URL!,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status !== 200 && response.status !== 202) {
      throw new Error(
        `Failed to send Teams notification: ${response.statusText}`
      );
    }

    return true;
  } catch (error) {
    console.error("Error sending Teams notification:", error);
    return false;
  }
}
