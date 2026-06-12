const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/ApiError");
const { ok } = require("../../utils/response");

/** Stub Stripe — activer avec STRIPE_SECRET_KEY en production. */
const createCheckoutSession = asyncHandler(async (req, res) => {
  const { booking, successUrl, cancelUrl } = req.body;
  if (!booking?.totalPrice) {
    throw new ApiError(400, "VALIDATION_ERROR", "Booking invalide");
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    ok(res, {
      url: successUrl || "/admin/reservations",
      mock: true,
      message: "Stripe non configuré — redirection simulée",
    });
    return;
  }

  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{
      price_data: {
        currency: req.body.currency || "usd",
        product_data: { name: booking.vehicleName },
        unit_amount: Math.round(booking.totalPrice * 100),
      },
      quantity: 1,
    }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { bookingId: booking.id },
  });
  ok(res, { url: session.url });
});

module.exports = { createCheckoutSession };
