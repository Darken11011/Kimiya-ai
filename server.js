// Simple redirect server for Render deployment
// Redirects all requests to the Vercel deployment

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Redirect all requests to Vercel deployment
app.use('*', (req, res) => {
  const vercelUrl = 'https://kimiya-ai.vercel.app';
  res.redirect(301, vercelUrl + req.originalUrl);
});

app.listen(port, () => {
  console.log(`Redirect server running on port ${port}`);
  console.log(`Redirecting all traffic to: https://kimiya-ai.vercel.app`);
});
