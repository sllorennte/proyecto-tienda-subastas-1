const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) 
    return res.status(401).json({ error: 'No token, acceso denegado' });

  const [_, token] = authHeader.split(' ');
  if (!token) 
    return res.status(401).json({ error: 'Token malformado' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;  
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token no válido' });
  }
};