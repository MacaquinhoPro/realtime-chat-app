// backend/src/config/rabbitmq.ts
import amqp, { Channel } from "amqplib";

let channel: Channel;

export async function connectRabbitMQ() {
  const conn = await amqp.connect(process.env.RABBITMQ_URL!);
  channel = await conn.createChannel();
  await channel.assertExchange("chat.exchange", "topic", { durable: true });
  console.log("RabbitMQ connected");
}

export function mq(): Channel {
  if (!channel) {
    throw new Error("RabbitMQ channel not initialized. Call connectRabbitMQ() first.");
  }
  return channel;
}
