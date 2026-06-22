import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_FROM,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export async function sendMail(subject: string, html: string): Promise<void> {
  await transporter.sendMail({
    from: process.env.GMAIL_FROM,
    to: process.env.GMAIL_FROM,
    subject,
    html,
  })
}
