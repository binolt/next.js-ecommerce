import nextConnect from "next-connect";
import { generateEmailVerificationHash } from "../../../../lib/helpers";
import { deleteEmailVerificationHash, fetchUserByQuery, updateUser, verifyHash } from "../../../../lib/user";
import { connectToDatabase } from "../../../../utils/mongodb";
import mail from "@sendgrid/mail";
import { base_url } from "../../../../lib/url";
import csrf from "../../../../utils/csrf";

const handler = nextConnect();

handler.post(async(req, res) => {

    try {
        const { email_address } = req.body;
        if(!email_address) throw new Error("Please enter an email address");
        
        const user = await fetchUserByQuery(req.body);
        if(!user) {
            //this user doesn't exist in the system
            res.status(200).json({success: false, message: "This user does not exist in the system."});
            return;
        }
        
        const { _id: user_id } = user;
        
        const hash = generateEmailVerificationHash();
        
        const { db } = await connectToDatabase();
        
        await db.collection('email_verification').insertOne({ hash, user_id, created_at: new Date()}); // store hash and relation to user

        const url = `${base_url}/reset/${user_id.toString()}/${hash}`; //generate email url

        if(!process.env.SENDGRID_API_KEY) { //ensure api key
            throw new Error("Please define a sendgrid api key");
        }

        mail.setApiKey(process.env.SENDGRID_API_KEY); 
        mail.send({
            to: email_address,
            from: "luongosteven@gmail.com",
            subject: `Reset your password`,
            text: "sending from sendgrid!!",
            html: `
            <div>
            <p>Click <a href=${url}>here</a> to reset your password.</p>
            <p>If you didn't request a password reset, please ignore this email. </p>
            </div>
            `
        })
        
        res.status(201).json({ success: true, message: "Please check your email for instructions to reset your password."})
    } catch (err) {
        res.status(500).json({ success: false, message: err.message })
    }
});


//update password

handler.put(async(req, res) => {
    try {
        await csrf(req, res);
        const { id, password, hash } = req.body;
        await verifyHash(hash, id);
        await updateUser(id, { password });
        await deleteEmailVerificationHash(hash);
        res.status(201).json({ success: true, message: "User successfully updated!"})
    } catch (e) {
        res.status(500).json({ success: false, message: e.message })
    }
})

export default handler;
