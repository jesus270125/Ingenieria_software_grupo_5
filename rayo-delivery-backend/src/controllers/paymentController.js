const Pedido = require('../models/pedidoModel');
const stripeLib = require('stripe');

// In-memory simple store for Yape payment tokens (for demo). In production use DB table.
const yapeStore = new Map();

exports.createStripeCheckout = async (req, res) => {
  try {
    const { orderId, amount, currency = 'usd', successUrl, cancelUrl } = req.body;
    // If Stripe is configured, create a real Checkout session
    if (process.env.STRIPE_SECRET_KEY) {
      const stripe = stripeLib(process.env.STRIPE_SECRET_KEY);

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{ price_data: { currency, product_data: { name: `Pedido ${orderId}` }, unit_amount: Math.round(amount * 100) }, quantity: 1 }],
        mode: 'payment',
        // include orderId as client_reference_id so webhook can find it
        client_reference_id: String(orderId),
        success_url: successUrl || `${process.env.BACKEND_URL || 'http://localhost:4000'}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl || `${process.env.BACKEND_URL || 'http://localhost:4000'}/cancel`
      });

      return res.json({ url: session.url });
    }

    // If Stripe not configured, return 501 so client knows it's not available
    return res.status(501).json({ error: 'Stripe no configurado' });
  } catch (err) {
    console.error('Stripe create error', err);
    res.status(500).json({ error: 'Error creando sesión de pago' });
  }
};

exports.createYapeRequest = async (req, res) => {
  try {
    const { orderId, amount, phone } = req.body;
    if (!orderId || !amount) return res.status(400).json({ error: 'orderId y amount requeridos' });

    // Generate simple token
    const token = `yape_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    const payload = { orderId, amount, token, createdAt: Date.now() };
    yapeStore.set(token, payload);

    // Create a QR payload (simple text, frontend can render QR from this data)
    // Include phone if provided to help the payer identify recipient
    let qrData = `YAPE|ORDER:${orderId}|AMT:${amount}|TOKEN:${token}`;
    if (phone) qrData = `YAPE|PHONE:${phone}|` + qrData;

    const paymentUrl = `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/payments/yape/launch?token=${encodeURIComponent(token)}` + (phone ? `&phone=${encodeURIComponent(phone)}` : '');

    res.json({ token, qrData: paymentUrl, phone: phone || null, paymentUrl });
  } catch (err) {
    console.error('createYapeRequest error', err);
    res.status(500).json({ error: 'Error creando solicitud Yape' });
  }
};

// Launch page: attempts to open Yape app with phone and amount, fallback to instructions and confirm button
exports.launchYapePage = (req, res) => {
  try {
    const token = req.query.token;
    if (!token) return res.status(400).send('token requerido');
    const data = yapeStore.get(token);
    if (!data) return res.status(404).send('token no encontrado');

    const phone = req.query.phone || data.phone || '';
    const amount = data.amount;
    // Construct a custom URL scheme that many apps may handle. This is a best-effort; actual Yape scheme may differ.
    const appUrl = `yape://pay?phone=${encodeURIComponent(phone)}&amount=${encodeURIComponent(amount)}`;
    const html = `
      <!doctype html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Abrir Yape</title></head>
      <body style="font-family:Arial,Helvetica,sans-serif; text-align:center; padding:20px;">
        <h2>Abrir Yape</h2>
        <p>Se intentará abrir la app Yape con el número <b>${phone}</b> y monto <b>${amount}</b>.</p>
        <p>Si tu dispositivo tiene Yape instalado, debería abrirse automáticamente. Si no, usa el botón de abajo para copiar los datos.</p>
        <button id="openBtn" style="padding:12px 18px; font-size:16px;">Abrir Yape</button>
        <div style="margin-top:16px">
          <button id="copyBtn" style="padding:8px 12px;">Copiar número y monto</button>
        </div>
        <div style="margin-top:18px">
          <button id="confirmBtn" style="padding:8px 12px; background:#2ecc71; color:#fff; border:none;">Ya pagué (Confirmar)</button>
        </div>
        <script>
          const appUrl = ${JSON.stringify(appUrl)};
          document.getElementById('openBtn').addEventListener('click', () => {
            window.location = appUrl;
            setTimeout(() => {
              // Nothing else; user will return to app
            }, 1500);
          });
          document.getElementById('copyBtn').addEventListener('click', async () => {
            try {
              await navigator.clipboard.writeText('${phone} ${amount}');
              alert('Número y monto copiados al portapapeles');
            } catch (e) {
              alert('No se pudo copiar automáticamente. Copia manualmente: ${phone} ${amount}');
            }
          });
          document.getElementById('confirmBtn').addEventListener('click', () => {
            fetch('/api/payments/yape/confirm?token=${encodeURIComponent(token)}', { method: 'GET' })
              .then(r => r.json()).then(j => { alert('Pago confirmado: ' + (j.message||'OK')); window.location = '/'; })
              .catch(e => { alert('Error confirmando pago'); });
          });
        </script>
      </body>
      </html>
    `;
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    console.error('launchYapePage error', err);
    res.status(500).send('Error interno');
  }
};

// Simple confirm endpoint for Yape (would be webhook in real integration)
exports.confirmYape = async (req, res) => {
  try {
    const token = req.query.token || req.body.token;
    if (!token) return res.status(400).json({ error: 'token requerido' });
    const data = yapeStore.get(token);
    if (!data) return res.status(404).json({ error: 'token no encontrado' });

    // Mark pedido as pagado
    await Pedido.updateEstadoPago(data.orderId, 'pagado');
    // Optionally update estado to 'pagado' as well
    await Pedido.updateEstado(data.orderId, 'pagado');

    // remove token
    yapeStore.delete(token);

    res.json({ message: 'Pago Yape confirmado', orderId: data.orderId });
  } catch (err) {
    console.error('confirmYape error', err);
    res.status(500).json({ error: 'Error confirmando Yape' });
  }
};

// Stripe webhook handler (optional) to mark orders as paid
exports.stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(501).send('Stripe webhook not configured');
  }
  const stripe = stripeLib(process.env.STRIPE_SECRET_KEY);
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody || req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature error', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    // We stored orderId in client_reference_id? Not for now — if provided, parse it.
    const metadataOrder = session.client_reference_id || null;
    // Attempt update if we have order id
    if (metadataOrder) {
      try {
        await Pedido.updateEstadoPago(metadataOrder, 'pagado');
        await Pedido.updateEstado(metadataOrder, 'pagado');
      } catch (e) { console.warn('Error marking order paid from webhook', e); }
    }
  }

  res.json({ received: true });
};
