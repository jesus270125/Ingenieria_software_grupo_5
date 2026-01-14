const express = require('express');
const router = express.Router();
const paymentCtrl = require('../controllers/paymentController');

router.post('/stripe-checkout', paymentCtrl.createStripeCheckout);
router.post('/yape/create', paymentCtrl.createYapeRequest);
router.get('/yape/confirm', paymentCtrl.confirmYape);
router.post('/yape/confirm', paymentCtrl.confirmYape);
router.get('/yape/launch', paymentCtrl.launchYapePage);
router.post('/webhook/stripe', express.raw({type: 'application/json'}), paymentCtrl.stripeWebhook);

module.exports = router;
