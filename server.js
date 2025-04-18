import express from 'express';
import { trackParcel } from './track.js'; // Direct import instead of child_process

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/track/:orderID', async (req, res) => {
  try {
    const result = await trackParcel(req.params.orderID);
    res.json(result);
  } catch (error) {
    console.error('Error in /track/:orderID route:', error); // Log the error on the server
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      error: error.message
    });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));