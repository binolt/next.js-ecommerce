import { fetchUserById } from "../../../lib/user";
import { getLoginSession } from "../../../lib/session";

export default async(req, res) => {
    try {
        const session = await getLoginSession(req)
        const user = session ? await fetchUserById(session._id) : null;
        if(!user) {
            res.status(403).json({user: null});
            return;
        }
        const { _id, username, active } = user
        res.status(200).json({ user: { username, _id, active }})
    } catch (err) {
        res.status(500).end('Authentication token is invalid, please log in')
    }
}