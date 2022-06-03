import { useRouter } from "next/dist/client/router";
import { useEffect, useState } from "react";
import auth_service from "../../../services/auth_service";
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';

export default function EmailVerification() {
    const router = useRouter();
    const { id, hash } = router.query;
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        verifyEmail();
    }, [])

    const verifyEmail = async() => {
        try { 
            if(!id || !hash) router.push("/");
    
            const user_data = await auth_service.fetchUserById(id); //ensure valid user
    
            //if no user found
            if(!user_data.success) throw new Error("No user found with that id, please try again.")
    
            //if the users account is already verified
            if(user_data.user && user_data.user.active) router.push("/")
    
            await verifyHash(hash, id);
    
            await auth_service.updateUser(id, { active: true }); //update user to active

            await auth_service.deleteEmailVerificationHash(hash); //delete hash from database

            setLoading(false); //disable loading state
    
            //redirect user
            setTimeout(() => {
                router.push("/");
            }, 4000);

        } catch (e) {
            setError(e.message);
        }
    }

    if(error) {
        return (
            <p>{error}</p>
        )
    }

    if(loading) {
        return (
            <Box sx={{ width: '100%', mt: '5rem' }}>
              <LinearProgress />
            </Box>
          );
    }


    return (
        <div>
           Thank you for validating your email address ! We are redirecting you, please hold on just a second.
        </div>
    );
}

const isHashExpired = (date) => {
    date = new Date(date);
    const HOUR = 1000 * 60 * 60;
    const anHourAgo = Date.now() - HOUR;

    return date < anHourAgo;
}

const verifyHash = async(hash, _id) => {
    try {
        if(!hash) throw new Error('Must provide a hash...');
        if(!_id) throw new Error('Must provide an id...');
    
        const current_hash = await auth_service.fetchEmailVerificationHash(hash);
    
        const { user_id, created_at } = current_hash;
    
        if(!current_hash) throw new Error("This hash doesn't exist...");
        if(user_id != _id) throw new Error("Cannot verify hash...");
        if(isHashExpired(created_at)) throw new Error("This hash has expired, please generate a new one.");

        return { isValid: true }
    } catch (e) {
        throw new Error(e);
    }
}