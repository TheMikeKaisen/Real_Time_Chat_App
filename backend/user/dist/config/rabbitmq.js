import amqp from "amqplib";
let channel;
// connect rabbit mq with node server
export const RabbitMqConnection = async () => {
    try {
        const connection = await amqp.connect({
            protocol: "amqp",
            port: 5672,
            hostname: process.env.RABBITMQ_HOSTNAME,
            username: process.env.RABBITMQ_USERNAME,
            password: process.env.RABBITMQ_PASSWORD,
        });
        channel = await connection.createChannel();
        console.log("✅ connected to rabbitMQ and created Channel Successfully!");
    }
    catch (error) {
        console.log("Error creating Channel", error);
    }
};
export const PublishToQueue = async (queueName, message) => {
    try {
        if (!channel) {
            console.log("Channel not initialized!");
            throw new Error("Channel not yet initialized");
        }
        // create a queue, if it doesn't already exists
        await channel.assertQueue(queueName, { durable: true }); // durable = true means it will retry if failed
        // DEFAULT EXCHANGE
        // here, the name of the queue will be the routing key
        channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), {
            // save this message to disk so it won’t be lost if RabbitMQ crashes or restarts
            persistent: true
        });
        console.log("message sent successfully!");
    }
    catch (error) {
        console.log("Couldn't publish the message!", error);
    }
};
