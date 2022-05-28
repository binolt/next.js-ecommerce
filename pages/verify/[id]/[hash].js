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

    useEffect(async() => {
        if(!id || !hash) router.push("/");

        const user_data = await auth_service.fetchUserById(id); //ensure valid user

        //if no user found
        if(!user_data.success) {
            setLoading(false);
            setError("No user found with that id, please try again.")
            return;
        }

        //if the users account is already verified
        if(user_data.user && user_data.user.active) {
            router.push("/");
        }

        const data = await auth_service.fetchEmailVerificationHash(hash);
        if(data.success && data.hash) {
            if(data.user_id === id) {
                if(lessThanOneHourAgo(new Date(data.created_at))) {
                    await auth_service.updateUser(id, { active: true }); //update user to active
                    await auth_service.deleteEmailVerificationHash(hash); //delete hash from database
                    setLoading(false); //disable loading state

                    //redirect user
                    setTimeout(() => {
                        router.push("/");
                    }, 4000);
                } else {
                    setLoading(false);
                    setError("This auth token has expired, please generate a new one.")
                    return;
                }
            } else {
                setLoading(false);
                setError("Something went wrong, please try again.")
                return;
            }
        } else {
            setLoading(false);
            setError("Something went wrong, please try again.")
            return;
        }
    }, [])

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

const lessThanOneHourAgo = (date) => {
    const HOUR = 1000 * 60 * 60;
    const anHourAgo = Date.now() - HOUR;

    return date > anHourAgo;
}