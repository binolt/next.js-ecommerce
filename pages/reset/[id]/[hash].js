import { useRouter } from "next/dist/client/router";
import { useEffect, useState } from "react";
import auth_service from "../../../services/auth_service";
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import csrf from "../../../utils/csrf";

export default function Reset({ csrf_token }) {
    const router = useRouter();
    const { id, hash } = router.query;
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [feedback, setFeedback] = useState(null);

    useEffect(async() => {
        try {
            if(!id || !hash) router.push("/");
    
            const current_user = await auth_service.fetchUserById(id); //ensure valid user
            if(!current_user) throw new Error("Please generate a new token.")
            
            await verifyHash(hash, id); //verify the provided hash

            setLoading(false);
        } catch (e) {
            setError(e.message);
        }
    }, [])

    const handleSubmit = async(e) => {
        e.preventDefault();
        try {
            const password = e.target.password.value;
            const confirm_password = e.target.confirmPassword.value;

            if(!password || !confirm_password) throw new Error("Must fill in all blanks.");
            if(password !== confirm_password) throw new Error("Passwords must be equal!");

            const { success, message } = await auth_service.passwordResetUpdate(csrf_token, { id, password, hash });

            if(!success) throw new Error(message);

            setFeedback({ success, message }); //display success message

            setTimeout(() => {
                router.push("/");//redirect user to home
            }, 2500);
        } catch (e) {
            setFeedback({ success: false, message: e.message }); //display errors
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
            Reset password
            <form onSubmit={handleSubmit}>
                <input name="password" type="password" placeholder="Password"/>
                <input name="confirmPassword" type="password" placeholder="Confirm Password"/>
                <input type="submit"/>
            </form>
            {feedback && <p>{feedback.message}</p>}
        </div>
    );
}

const isHashExpired = (date) => {
    date = new Date(date);
    const HOUR = 1000 * 60 * 60;
    const anHourAgo = Date.now() - HOUR;

    return date < anHourAgo;
}


export async function getServerSideProps(context) {
    const { req, res } = context
    await csrf(req, res);
    return {
        props: { csrf_token: req.csrfToken() },
    }
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