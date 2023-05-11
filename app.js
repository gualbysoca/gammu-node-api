require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const basicAuth = require('express-basic-auth');
const { exec } = require('child_process');
const { body, validationResult } = require('express-validator');

const app = express();

app.use(bodyParser.json());

app.use(basicAuth({
    users: { [process.env.BASIC_AUTH_USER]: process.env.BASIC_AUTH_PASSWORD },
    unauthorizedResponse: {
        error: 'Unauthorized'
    }
}));

app.post('/send_sms', 
    body('destination_number')
        .isLength({ min: 11, max: 11 })
        .custom((value) => {
            if (!value.startsWith('+591')) {
                throw new Error('destination_number must start with +591');
            }
            return true;
        }),
    body('message').isLength({ max: 160 }),
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const destinationNumber = req.body.destination_number;
        const message = req.body.message;

        const command = `${process.env.GAMMU_COMMAND} sendsms TEXT ${destinationNumber} -text "${message}"`;

        exec(command, (err, stdout, stderr) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            res.json({
                success: true,
                message: 'SMS sent successfully'
            });
        });
    }
);


const PORT = process.env.SERVER_PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
