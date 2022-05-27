import nextConnect from "next-connect";
import passport from "passport";
import { setLoginSession } from "../../../../../lib/session";
import withPassport from "../../../../../lib/withPassport";

const handler = nextConnect();

handler.use(passport.initialize()).get(async(req, res) => {
    try {
        const { strategy } = req.query;
        passport.authenticate(strategy)(req, res, async(...args) => {
            const cookie = await setLoginSession(res, req.user);
            res.setHeader("Set-cookie", cookie);
            res.redirect("/");
        })
    } catch (err) {
        res.status(500).json({success: false, message: err.message});
    }
});

export default withPassport(handler);