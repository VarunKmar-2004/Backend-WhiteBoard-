import nodemailer from "nodemailer";
const transporter=nodemailer.createTransport({
    host:'smtp-relay.brevo.com',
    port:587,
    auth:{
        user:process.env.SMTP_USER || "822a25001@smtp-brevo.com",
        pass:process.env.SMTP_PASS || "J16LahGtgAqHcU2D"
    }
});
 export default transporter;