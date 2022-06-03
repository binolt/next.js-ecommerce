import { useState } from "react";
import auth_service from "../services/auth_service";

export default function Forgot() {
    const [feedback, setFeedback] = useState(null);

    const handleSubmit = async(e) => {
        e.preventDefault();
        
        try {
            const email_address = e.target.email.value;
            if(!email_address) throw new Error("Please fill in all blanks.");

            const { success, message } = await auth_service.sendPasswordResetEmail({ email_address });

            if(!success) throw new Error(message);

            e.target.email.value = ""; //reset input

            setFeedback({ success, message }); 
        } catch(e) {
            setFeedback({ success: false, message: e.message });
        }
    }
    return (
        <div>
            <p>Reset your password</p>
            <form onSubmit={handleSubmit}>
                <input name="email" type="text" placeholder="Email Address"/>
                <input type="submit"/>
            </form>
            {feedback && <p>{feedback.message}</p>}
        </div>
    );
}