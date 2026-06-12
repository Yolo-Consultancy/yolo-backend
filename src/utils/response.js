function ok(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}

function paginated(res, data, meta) {
  return res.json({ success: true, data, meta });
}

module.exports = { ok, paginated };
