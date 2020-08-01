const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

// create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
    host: process.env.NM_HOST,
    port: process.env.NM_PORT,
    secure: true, // true for 465, false for other ports
    auth: {
        user: process.env.NM_USER,
        pass: process.env.NM_PASS,
    },
    tls: {
        rejectUnauthorized: false,
    },
});

exports.sendRegistrationEmail = async (user) => {
    // console.log(user);

    // create JWT token and send email confirmation
    jwt.sign({ id: user._id }, process.env.SECRET, { expiresIn: '1d', algorithm: 'HS256' }, async (err, token) => {
        const url = process.env.BASE_URL + token;

        // email text
        const output = `
        <h2 style="text-align:center;">Welcome to damwidi.com</h2>
        <p>${user.firstName},</p> 
        <p>Thank you for registering on <b>damwidi.com</b>. Please follow the link below to complete the registration process. This link will expire in 1 day.</p>
        <p>Please click here to confirm your email: <a href="${url}">${url}</a></p>`;

        let info = await transporter.sendMail({
            from: 'DAMWIDI Registrtion <test@damwidi.com>',
            to: 'erol@yurtkuran.net',
            subject: 'Confirm Email',
            html: output,
        });

        // console.log('Message sent: %s', info.messageId);
    });
};
