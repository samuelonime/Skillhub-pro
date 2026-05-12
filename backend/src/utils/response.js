const success  = (res, data, message = 'Success')       => res.status(200).json({ success: true,  message, data });
const created  = (res, data, message = 'Created')       => res.status(201).json({ success: true,  message, data });
const badRequest = (res, message, errors = null)        => res.status(400).json({ success: false, message, errors });
const unauthorized = (res, message = 'Unauthorized')    => res.status(401).json({ success: false, message });
const forbidden  = (res, message = 'Forbidden')         => res.status(403).json({ success: false, message });
const notFound   = (res, message = 'Not found')         => res.status(404).json({ success: false, message });
const error      = (res, message = 'Server error', status = 500) => res.status(status).json({ success: false, message });

module.exports = { success, created, badRequest, unauthorized, forbidden, notFound, error };
