import passport from "passport";
import redirect from "micro-redirect";
import { googleStrategy } from "./strategies";

passport.use(googleStrategy);

// passport.serializeUser stores user object passed in the cb method above in req.session.passport
passport.serializeUser((user, cb) => {
  process.nextTick(function () {
    return cb(null, user);
  });
});

// passport.deserializeUser stores the user object in req.user
passport.deserializeUser(function (user, cb 
) {
  process.nextTick(function () {
    return cb(null, user);
  });
});

// export middleware to wrap api/auth handlers
export default fn => (req, res) => {
    if (!res.redirect) {
      res.redirect = (location) => redirect(res, 302, location)
    }

    passport.initialize()(req, res, () =>
    passport.session()(req, res, () =>
      // call wrapped api route as innermost handler
      fn(req, res)
    )
  )
}