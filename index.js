const express = require('express');
const app = express();
app.use(express.json());
const cors = require('cors');
require('dotenv').config();
const db = require('./db');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerOptions = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Your API Title',
        version: '1.0.0',
        description: 'A description of your API',
      },
      servers: [
        {
          url: 'http://localhost:3000',
        },
      ],
    },
    apis: ['./routes/envelopeRoutes.js'], // 指定你的路由文件所在位置
  };
  
  const swaggerDocs = swaggerJsdoc(swaggerOptions);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
// ...

app.use(cors());
app.get('/', (req, res) => {
  res.send('Hello, World');
});
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

app.get('/envelopes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const envelopeResult = await db.query('SELECT * FROM envelopes WHERE id = $1', [id]);

        if (envelopeResult.rows.length > 0) {
            const envelope = envelopeResult.rows[0];
            const transactionsResult = await db.query('SELECT * FROM transactions WHERE envelope_id = $1', [id]);
            const transactions = transactionsResult.rows;

            // Add transactions to the envelope object
            envelope.transactions = transactions;

            res.json(envelope);
        } else {
            res.status(404).send('Envelope not found');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/envelopes', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM envelopes');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/envelopes', async (req, res) => {
  try {
    const { title, budget } = req.body;
    const result = await db.query('INSERT INTO envelopes (title, budget) VALUES ($1, $2) RETURNING *', [title, budget]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

app.put('/envelopes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, budget } = req.body;
    const result = await db.query('UPDATE envelopes SET title = $1, budget = $2 WHERE id = $3 RETURNING *', [title, budget, id]);
    res.json(result.rows[0]);
  } catch (err) { console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

app.delete('/envelopes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM envelopes WHERE id = $1', [id]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/envelopes/transfer/:from/:to', async (req, res) => {
  try {
    const { from, to } = req.params;
    const { amount } = req.body;

    const fromResult = await db.query('SELECT * FROM envelopes WHERE id = $1', [parseInt(from)]);
    const toResult = await db.query('SELECT * FROM envelopes WHERE id = $1', [parseInt(to)]);

    if (fromResult.rowCount === 0 || toResult.rowCount === 0) {
      res.status(404).json({ message: 'Envelope not found' });
    } else {
      const fromEnvelope = fromResult.rows[0];
      const toEnvelope = toResult.rows[0];

      if (amount > fromEnvelope.budget) {
        res.status(400).json({ message: 'Insufficient funds in the source envelope' });
      } else {
        await db.query('UPDATE envelopes SET budget = budget - $1 WHERE id = $2', [amount, parseInt(from)]);
        await db.query('UPDATE envelopes SET budget = budget + $1 WHERE id = $2', [amount, parseInt(to)]);

        const updatedFromResult = await db.query('SELECT * FROM envelopes WHERE id = $1', [parseInt(from)]);
        const updatedToResult = await db.query('SELECT * FROM envelopes WHERE id = $1', [parseInt(to)]);

        res.status(200).json({
          message: 'Transfer successful',
          fromEnvelope: updatedFromResult.rows[0],
          toEnvelope: updatedToResult.rows[0],
        });
      }
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});


//transaction part

app.post('/transactions', async (req, res) => {
    try {
        const { date, amount, recipient, envelope_id } = req.body;

        // Check if envelope has enough budget
        const envelopeResult = await db.query('SELECT * FROM envelopes WHERE id = $1', [envelope_id]);
        if (envelopeResult.rows.length === 0) {
            res.status(404).send('Envelope not found');
            return;
        }

        const envelope = envelopeResult.rows[0];
        if (envelope.budget < amount) {
            res.status(400).send('Insufficient funds in the envelope');
            return;
        }

        // Deduct amount from envelope and update the envelope
        const updatedBudget = envelope.budget - amount;
        await db.query('UPDATE envelopes SET budget = $1 WHERE id = $2', [updatedBudget, envelope_id]);

        // Insert new transaction
        const result = await db.query('INSERT INTO transactions (date, amount, recipient, envelope_id) VALUES ($1, $2, $3, $4) RETURNING *', [date, amount, recipient, envelope_id]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/transactions', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM transactions');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/transactions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('SELECT * FROM transactions WHERE id = $1', [id]);
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).send('Transaction not found');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

app.put('/transactions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { date, amount, recipient, envelope_id } = req.body;

        // Get the original transaction
        const originalTransactionResult = await db.query('SELECT * FROM transactions WHERE id = $1', [id]);

        if (originalTransactionResult.rows.length > 0) {
            const originalTransaction = originalTransactionResult.rows[0];

            // Calculate the budget difference
            const budgetDifference = amount - originalTransaction.amount;

            // Check if the envelope has enough budget
            const envelopeResult = await db.query('SELECT * FROM envelopes WHERE id = $1', [envelope_id]);
            const envelope = envelopeResult.rows[0];

            if (envelope.budget < budgetDifference) {
                res.status(400).send('Insufficient funds in the envelope');
                return;
            }

            // Update the envelope budget
            await db.query('UPDATE envelopes SET budget = budget - $1 WHERE id = $2', [budgetDifference, envelope_id]);

            // Update the transaction
            const result = await db.query('UPDATE transactions SET date = $1, amount = $2, recipient = $3, envelope_id = $4 WHERE id = $5 RETURNING *', [date, amount, recipient, envelope_id, id]);
            res.json(result.rows[0]);
        } else {
            res.status(404).send('Transaction not found');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

app.delete('/transactions/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Get the transaction to be deleted
        const transactionResult = await db.query('SELECT * FROM transactions WHERE id = $1', [id]);
        if (transactionResult.rows.length > 0) {
            const transaction = transactionResult.rows[0];

            // Return the amount to the associated envelope
            await db.query('UPDATE envelopes SET budget = budget + $1 WHERE id = $2', [transaction.amount, transaction.envelope_id]);

            // Delete the transaction
            await db.query('DELETE FROM transactions WHERE id = $1', [id]);
            res.status(204).send();
        } else {
            res.status(404).send('Transaction not found');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});