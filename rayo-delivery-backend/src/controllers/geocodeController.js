const fetch = require('node-fetch');

exports.reverse = async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: 'lat y lon son requeridos' });

    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`;
    const r = await fetch(url, { headers: { 'User-Agent': 'RayoDelivery/1.0 (contacto@ejemplo.com)' } });
    if (!r.ok) return res.status(502).json({ error: 'Nominatim response error', status: r.status });
    const data = await r.json();
    return res.json(data);
  } catch (err) {
    console.error('geocode.reverse error', err);
    return res.status(500).json({ error: 'Error al obtener datos de geocoding' });
  }
};
