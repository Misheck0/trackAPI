import express from 'express';
import { exec } from 'child_process';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/track/:orderID', (req, res) => {
  const orderID = req.params.orderID;

  exec(`node track.js ${orderID}`, (err, stdout, stderr) => {
    if (err) {
      console.error('Execution error:', err);
      return res.status(500).json({ status: 'error', message: 'Internal server error' });
    }

    try {
      const result = JSON.parse(stdout);
      res.json(result);
    } catch (e) {
      console.error('Parsing error:', e);
      res.status(500).json({ status: 'error', message: 'Failed to parse tracking data' });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
