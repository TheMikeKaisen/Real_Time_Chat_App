import amqp from "amqplib";
import nodemailer from "nodemailer";
export const startOtpConsumer = async () => {
    try {
        const connection = await amqp.connect({
            protocol: "amqp",
            port: 5672,
            hostname: process.env.RABBITMQ_HOSTNAME,
            username: process.env.RABBITMQ_USERNAME,
            password: process.env.RABBITMQ_PASSWORD
        });
        // create channel for otp server <--> rabbitMQ
        const channel = await connection.createChannel();
        const queueName = "send-otp";
        // create the queue if not exists
        await channel.assertQueue(queueName, { durable: true }); // durable:true ensures the connection to retry if failed
        console.log("✅ Mail Service Consumer started listening for otp emails.");
        // CONSUME THE MESSAGE from RabbitMQ
        await channel.consume(queueName, async (msg) => {
            if (msg) {
                try {
                    const { to, subject, body } = JSON.parse(msg.content.toString());
                    let transporter = nodemailer.createTransport({
                        host: "smtp.gmail.com",
                        port: 465,
                        auth: {
                            user: process.env.NODEMAILER_USER,
                            pass: process.env.NODEMAILER_PASSWORD
                        }
                    });
                    await transporter.sendMail({
                        // from: "Microservice Chat Application", 
                        to,
                        subject,
                        text: body,
                    });
                    console.log(`OTP mail sent to ${to}`);
                    channel.ack(msg);
                }
                catch (error) {
                    console.log("❌ Could not consume the message from queue!", error);
                }
            }
        });
    }
    catch (error) {
        console.log("✅ Failed to Start RabbitMq Consumer!", error);
    }
};
