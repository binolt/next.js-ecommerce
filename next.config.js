module.exports = {
  env: {
    'MONGODB_URI': process.env.MONGODB_URI,
    'DB_NAME' : process.env.DB_NAME,
    'TOKEN_SECRET': process.env.TOKEN_SECRET,
    "PROD_URL": process.env.PROD_URL,
    "GOOGLE_CLIENT_ID" : process.env.GOOGLE_CLIENT_ID,
    "GOOGLE_CLIENT_SECRET" : process.env.GOOGLE_CLIENT_SECRET,
    "GOOGLE_CALLBACK_URL" : process.env.GOOGLE_CALLBACK_URL
  }
}