// services/auth-service/lib/kafkaClient.js
const { Kafka } = require('kafkajs');

let producer = null;

async function initKafka() {
  const brokers = process.env.KAFKA_BROKERS;
  if (!brokers) {
    console.log('KAFKA_BROKERS not set — skipping kafka init');
    return;
  }
  try {
    const kafka = new Kafka({ clientId: 'auth-service', brokers: [brokers] });
    producer = kafka.producer();
    await producer.connect();
    console.log('Kafka producer connected');
  } catch (err) {
    console.warn('Kafka init failed:', err && err.message ? err.message : err);
    producer = null;
  }
}

async function publishUserUpdated(payload) {
  if (!producer) return;
  try {
    await producer.send({
      topic: 'user.updated',
      messages: [{ value: JSON.stringify(payload) }]
    });
  } catch (e) {
    console.warn('publishUserUpdated failed:', e.message || e);
  }
}

module.exports = { initKafka, publishUserUpdated };
