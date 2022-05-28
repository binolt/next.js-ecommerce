import { MongoServerError, ObjectId } from "mongodb";
import { validateEmail, generateHash, toArray, generateEmailVerificationHash } from './helpers';
import { connectToDatabase, createDefaultCollection } from "../utils/mongodb";
import { base_url } from "./url";
import mail from "@sendgrid/mail";

export const createLocalUser = async(payload) => {
    const { db } = await connectToDatabase(); //establish database connection
    
    const collections = await toArray(db.listCollections()); //ensure a collection exists
    if(!collections.length) await createDefaultCollection(db, 'users');

    const isValid = validateLocalUserParameters(payload); //validate request payload

    const { password, ...payloadBody } = payload;

    let body = { active: true, created_at: new Date(), ...payloadBody }; //create request body

    let email_verification = false;

    if(password) {
        const { salt, hash } = generateHash(password); //generate hash & salt

        email_verification = true;
        
        body = { salt, hash, ...body, active: false }; //include salt and hash and ensure active is false
    }

    try {
        if(isValid) {
            const user = await db.collection('users').insertOne(body); //insert user into db
            if(email_verification) { 
                const { insertedId: user_id } = user;
                const hash = generateEmailVerificationHash();//generate email verification hash
                await db.collection('email_verification').insertOne({ hash, user_id, created_at: new Date()}); // store hash and relation to user

                const url = `${base_url}/verify/${user_id.toString()}/${hash}`;

                //send out email to user
                try {
                    if(!process.env.SENDGRID_API_KEY) {
                        throw new Error("Please define a sendgrid api key");
                    }
                    mail.setApiKey(process.env.SENDGRID_API_KEY);
                    mail.send({
                        to: payload.email_address,
                        from: "luongosteven@gmail.com",
                        subject: `Confirm your email address`,
                        text: "sending from sendgrid!!",
                        html: `
                        <div>
                            <h1> Hi ${payload.username}, </h1>
                            <p>Thank you for signing up with next.js ecommerce !</p>
                            <p>To further enjoy your account, please verify your email <a href=${url}>here</a> or click the link below: <p>
                            <a href=${url}>${url}</a>
                        </div>
                        `
                    })
                } catch (err) {
                    throw new Error(err)
                }
            }
            return { success: true, message: "User successfully created!" }
        } else {
            throw new Error("Something went wrong validating your account, please try again.");
        }
    } catch (err) {
        //schema validation error
        if (err instanceof MongoServerError && err.code === 121) {
            const err_response = err.errInfo.details.schemaRulesNotSatisfied[0].propertiesNotSatisfied[0];
            const result = { 
                property: err_response.propertyName,
                message: "Mongo Schema Validation Error",
                details: err_response.details[0],
            }
            return result;
        }
        //all other errors
        else throw new Error(err);
    }
}
                    
export const updateUser = async(_id, payload) => {
    if(!_id) throw new Error("Please provide a user _id"); //ensure id is provided
    const { db } = await connectToDatabase(); //establish database connection

    try {
        const target = { _id: new ObjectId(_id) };
        const { acknowledged, matchedCount, modifiedCount } = await db.collection("users").updateOne(target, {$set: payload}); //update user
        if(acknowledged && matchedCount >= 1 && modifiedCount >= 1) return { message: "User successfully updated!" }; //case user updated
        else if(acknowledged && matchedCount >= 1 && modifiedCount < 1) throw new Error("Nothing was updated.") //case user found but not updated
        else if(acknowledged && matchedCount < 1) throw new Error("Could not find a matching user with that _id"); //case no user found
        else throw new Error("something went wrong..."); //default case
    } catch (err) {
        throw new Error(err);
    }
}

export const removeUser = async(_id) => {
    if(!_id) throw new Error("Please provide a user _id"); //ensure id is provided
    const { db } = await connectToDatabase(); //establish database connection

    try {
        const result = await db.collection("users").deleteOne({_id: new ObjectId(_id)}); //remove user
        if(result.acknowledged && result.deletedCount > 0) return { message: "User successfully removed from the database." }; //case user removed
        else throw new Error("Could not find a matching user with that _id"); //default case no user
    } catch (err) {
        throw new Error(err);
    }
}

export const fetchUserByQuery = async(query) => {
    const { db } = await connectToDatabase(); //establish database connection

    try {
        const result = await db.collection("users").find({...query}).toArray();
        return result[0];
    } catch (err) {
        throw new Error(err);
    }
}


export const fetchUserById = async(identifier) => {
    const { db } = await connectToDatabase(); //establish database connection

    try {
        const result = await db.collection("users").find({_id: new ObjectId(identifier)}).toArray();
        return result[0];
    } catch (err) {
        throw new Error(err);
    }
}

const validateLocalUserParameters = ({ email_address }) => {
    //ensure valid email address
    if(email_address && !validateEmail(email_address)) throw new Error("Must be a valid email address.");

    return true;
}


export const fetchEmailVerificationHash = async(hash) => {
    if(!hash) throw new Error('Must provide a hash...');

    const { db } = await connectToDatabase(); //establish database connection

    try {
        const result = await db.collection("email_verification").find({ hash }).toArray();
        return result[0];
    } catch (err){ throw new Error(err) }
}

export const deleteEmailVerificationHash = async(hash) => {
    if(!hash) throw new Error('Must provide a hash...'); //ensure id is provided
    const { db } = await connectToDatabase(); //establish database connection

    try {
        const result = await db.collection("email_verification").deleteOne({ hash }); //remove hash
        if(result.acknowledged && result.deletedCount > 0) return { message: "Hash successfully removed from the database." }; //case user removed
        else throw new Error("Could not find a matching hash"); //default case no user
    } catch (err) {
        throw new Error(err);
    }
}