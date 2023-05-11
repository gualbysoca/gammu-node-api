require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const basicAuth = require('express-basic-auth');
const { exec } = require('child_process');
const { body, validationResult } = require('express-validator');
const winston = require('winston');

const app = express();

// Create logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: process.env.LOG_FILE_PATH })
    ]
});

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
        .notEmpty()
        .custom((value) => {
            if (!value.startsWith('+591')) {
                throw new Error('destination_number must start with +591');
            }
            return true;
        }),
    body('message')
        .isLength({ max: 160 })
        .notEmpty(),
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.error(`Validation Error: ${JSON.stringify(errors.array())}`);
            return res.status(400).json({ errors: errors.array() });
        }

        const destinationNumber = req.body.destination_number;
        const message = req.body.message;

        if (!process.env.GAMMU_COMMAND) {
            logger.error('GAMMU_COMMAND is not set in environment variables.');
            return res.status(500).json({ error: 'GAMMU_COMMAND is not set in environment variables.' });
        }

        const command = `${process.env.GAMMU_COMMAND} sendsms TEXT ${destinationNumber} -text "${message}"`;

        exec(command, (err, stdout, stderr) => {
            if (err) {
                logger.error(`Execution Error: ${err.message}`);
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
    logger.info(`Server running on port ${PORT}`);
});
