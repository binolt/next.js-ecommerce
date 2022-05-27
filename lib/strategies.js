import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { fetchUserByQuery, createLocalUser } from "./user";
import { validatePassword } from "./helpers";


export const localStrategy = new LocalStrategy(
  async (username, password, cb) => {
      try {
          const user = await fetchUserByQuery({ username });
          if(user && validatePassword(user, password)) {
              const {username, _id, email_address, created_at} = user;
              cb(null, {username, _id, email_address, created_at});
          } 
          else cb(new Error("Invalid username and password combination"));
      } catch(err) { cb(err) }
  }
)

export const googleStrategy = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL, // this is the endpoint you registered on google while creating your app. This endpoint would exist on your application for verifying the authentication
  },
  async (_accessToken, _refreshToken, profile, cb) => {
    try {
      const { name: username, sub: google_id, email: email_address } = profile._json;
      //look for existing user
      const existingUser = await fetchUserByQuery({ google_id });
      if(existingUser) return cb(null, existingUser);

      const payload = { username, google_id, email_address };
      const { success, message } = await createLocalUser(payload);

      if(!success) throw new Error(message); //handle errors

      const user = await fetchUserByQuery({ google_id }); //fetch user
      cb(null, user);
    } catch (e) {
      throw new Error(e);
    }
  }
);