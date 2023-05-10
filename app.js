const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');

const app = express();

app.use(bodyParser.json());

app.post('/send_sms', (req, res) => {
    const destinationNumber = req.body.destination_number;
    const message = req.body.message;

    if (!destinationNumber || !message) {
        return res.status(400).json({
            error: 'Destination number and message are required'
        });
    }

    //const command = `gammu sendsms TEXT ${destinationNumber} -text "${message}"`;
    const command = `/opt/gammu-1.42.0/build-configure/smsd/gammu-smsd-inject TEXT ${destinationNumber} -text "${message}"`;

    exec(command, (err, stdout, stderr) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.json({
            success: true,
            message: 'SMS sent successfully'
        });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});