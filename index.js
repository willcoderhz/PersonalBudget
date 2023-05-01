const express = require('express');
const app = express();
app.use(express.json());
const cors = require('cors');

// ...

app.use(cors());
app.get('/', (req, res) => {
    res.send('Hello, World');
  });
  const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

const envelopes=[];
let totalBudget=0;
let envelopeId = 1;

app.post('/envelopes', (req, res) => {
    const { title, budget } = req.body;
    const newEnvelope = { id: envelopeId, title, budget };
    envelopes.push(newEnvelope);
    totalBudget += budget;
    envelopeId++
    res.status(201).json({ message: 'Envelope created successfully', newEnvelope });
  });

  app.get('/envelopes/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const envelope = envelopes.find((envelope) => envelope.id === id);
  
    if (envelope) {
      res.status(200).json(envelope);
    } else {
      res.status(404).json({ message: 'Envelope not found' });
    }
  });

app.get('/envelopes', (req, res) => {
  res.status(200).json(envelopes);
});

app.put('/envelopes/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { amount, title } = req.body;
  
    const envelopeIndex = envelopes.findIndex((envelope) => envelope.id === id);
  
    if (envelopeIndex === -1) {
      res.status(404).json({ message: 'Envelope not found' });
    } else {
      if (amount) {
        if (amount > envelopes[envelopeIndex].budget) {
          res.status(400).json({ message: 'Insufficient funds in the envelope' });
        } else {
          envelopes[envelopeIndex].budget -= amount;
          totalBudget -= amount;
        }
      }
  
      if (title) {
        envelopes[envelopeIndex].title = title;
      }
  
      res.status(200).json({ message: 'Envelope updated successfully', updatedEnvelope: envelopes[envelopeIndex] });
    }
  });

  app.delete('/envelopes/:id', (req, res) => {
    const id = parseInt(req.params.id);
  
    // Find index of the envelope with the given id
    const envelopeIndex = envelopes.findIndex((envelope) => envelope.id === id);
  
    // If the envelope doesn't exist, send 404 error
    if (envelopeIndex === -1) {
      res.status(404).json({ message: 'Envelope not found' });
    } else {
      // Remove the envelope from the array
      const removedEnvelope = envelopes.splice(envelopeIndex, 1);
  
      // Update the total budget
      totalBudget -= removedEnvelope[0].budget;
  
      // Send success response with the removed envelope
      res.status(200).json({ message: 'Envelope deleted successfully', removedEnvelope: removedEnvelope[0] });
    }
  });

  app.post('/envelopes/transfer/:from/:to', (req, res) => {
    const { from, to } = req.params;
    const { amount } = req.body;
  
    const fromEnvelopeIndex = envelopes.findIndex((envelope) => envelope.id === parseInt(from));
    const toEnvelopeIndex = envelopes.findIndex((envelope) => envelope.id === parseInt(to));
  
    if (fromEnvelopeIndex === -1 || toEnvelopeIndex === -1) {
      res.status(404).json({ message: 'Envelope not found' });
    } else {
      if (amount > envelopes[fromEnvelopeIndex].budget) {
        res.status(400).json({ message: 'Insufficient funds in the source envelope' });
      } else {
        envelopes[fromEnvelopeIndex].budget -= amount;
        envelopes[toEnvelopeIndex].budget += amount;
        res.status(200).json({ message: 'Transfer successful', fromEnvelope: envelopes[fromEnvelopeIndex], toEnvelope: envelopes[toEnvelopeIndex] });
      }
    }
  });