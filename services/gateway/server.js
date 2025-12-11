const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// AUTH SERVICE (port 4000 inside docker network)
app.use('/auth', createProxyMiddleware({
  target: 'http://auth-service:4000',
  changeOrigin: true,
  pathRewrite: { '^/auth': '' }
}));

// USER SERVICE (port 4100)
app.use('/user', createProxyMiddleware({
  target: 'http://user-service:4100',
  changeOrigin: true,
  pathRewrite: { '^/user': '' }
}));

app.get('/', (req, res) => {
  res.json({ status: "Gateway running" });
});

app.listen(5000, "0.0.0.0", () => {
  console.log("Gateway running on port 5000");
});
