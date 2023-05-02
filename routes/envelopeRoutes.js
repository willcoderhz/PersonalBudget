/**
 * @swagger
 * /envelopes:
 *   get:
 *     summary: Retrieve a list of envelopes
 *     description: Retrieve a list of all envelopes from the database
 *     responses:
 *       200:
 *         description: A list of envelopes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   title:
 *                     type: string
 *                   budget:
 *                     type: number
 */
app.get('/envelopes', async (req, res) => {
    // ...
  });