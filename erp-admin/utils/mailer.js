const nodemailer = require('nodemailer');

// If SMTP_HOST is not configured we use jsonTransport, which does not send anything
// but lets us print the email in the console - handy while developing / in the viva.
const transporter = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    })
  : nodemailer.createTransport({ jsonTransport: true });

async function sendWelcomeEmail(employee, plainPassword) {
  const mail = {
    from: process.env.MAIL_FROM || 'ERP Admin <no-reply@erp.local>',
    to: employee.email,
    subject: 'Welcome to the company - your login details',
    text:
      `Hello ${employee.name},\n\n` +
      `Your employee account has been created.\n\n` +
      `Employee ID : ${employee.empid}\n` +
      `Password    : ${plainPassword}\n\n` +
      `Please log in to the employee site and change your password.\n\nRegards,\nERP Admin`
  };
  const info = await transporter.sendMail(mail);
  if (!process.env.SMTP_HOST) {
    console.log('[mail - SMTP not configured, not actually sent]\n' + mail.text);
  }
  return info;
}

module.exports = { sendWelcomeEmail };
