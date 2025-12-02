// /shared/lib/constants.js
module.exports = {
  KAFKA_TOPICS: {
    USER_CREATED: 'user.created',
    USER_UPDATED: 'user.updated',
    ORDER_CREATED: 'order.created',
    PAYMENT_SUCCEEDED: 'payment.succeeded',
    USER_REFERRED: 'user.referred',
    FEED_CREATED: 'feed.created'
  },
  REDIS_KEYS: {
    REFCOUNT: (userId) => `refcount:${userId}`,
    CART: (userId) => `cart:${userId}`,
    IDEMP: (key) => `idemp:${key}`
  }
};
