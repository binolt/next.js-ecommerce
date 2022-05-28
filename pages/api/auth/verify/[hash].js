import nextConnect from "next-connect";
import { fetchEmailVerificationHash, deleteEmailVerificationHash } from "../../../../lib/user";


const handler = nextConnect();

handler.get(async(req, res) => {
    const { hash } = req.query;

    try {
        const response = await fetchEmailVerificationHash(hash);
        res.status(201).json({ success: true, ...response });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});


handler.delete(async(req, res) => {
    const { hash } = req.query;

    try {
        const response = await deleteEmailVerificationHash(hash);
        res.status(201).json({ success: true, ...response });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
})


export default handler;
