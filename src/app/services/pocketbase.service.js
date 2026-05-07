const PocketBase = require('pocketbase/cjs');

const pb = new PocketBase(process.env.PB_URL);

async function loginAdmin() {
  if (!pb.authStore.isValid) {
    await pb.admins.authWithPassword(
      process.env.PB_ADMIN_EMAIL,
      process.env.PB_ADMIN_PASSWORD
    );
  }
}

async function updateOrderStatus(orderId, status, paymentData = {}) {
  await loginAdmin();

  return pb.collection('orders').update(orderId, {
    status,
    paymentData
  });
}

module.exports = {
  updateOrderStatus
};