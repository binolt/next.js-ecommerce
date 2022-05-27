import passport from "passport";
import nextConnect from "next-connect";
import withPassport from "../../../../../lib/withPassport";

const scope = {
  scope: ["profile", "email"],
}

const handler = nextConnect();

handler.use(passport.initialize())
  .get(async(req, res) => {
    const { strategy } = req.query;
    try {
      passport.authenticate(strategy, scope)(req, res, (...args) => {})
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

export default withPassport(handler);