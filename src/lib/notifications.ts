import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const clients = new Map();

export const getClients = () => clients;

export const removeClient = (userId: number) => {
  clients.delete(userId);
};

export const addClient = (
  userId: number,
  controller: ReadableStreamDefaultController
) => {
  clients.set(userId, controller);
};

export async function sendNotification(userId: number, message: string) {
  try {
    await prisma.notifications.create({
      data: {
        message,
        user_id: userId,
      },
    });

    const controller = clients.get(userId);
    if (controller) {
      try {
        const eventData = {
          type: "notification",
          message,
          timestamp: new Date().toISOString(),
        };
        const eventString = `event: notification\ndata: ${JSON.stringify(
          eventData
        )}\n\n`;
        console.log(`Sending notification to user ${userId}:`, message);
        controller.enqueue(eventString);
      } catch (error) {
        clients.delete(userId);
        console.error("Error sending notification, client removed:", error);
      }
    }
  } catch (error) {
    console.error("Error sending notification:", error);
    throw error;
  }
}
