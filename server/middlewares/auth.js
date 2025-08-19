import { clerkClient } from "@clerk/express";

export const auth = async (req, res, next) => {
    // This is the authentication middleware. It's a function that intercepts incoming requests
    // to verify the user's identity and permissions before proceeding to the actual route handler.
    // `req`: The request object (contains info about the incoming request).
    // `res`: The response object (used to send data back to the client).
    // `next`: A function to pass control to the next middleware in the stack.
    try {
        // `req.auth()`: This asynchronous function (likely provided by the Clerk middleware) handles user authentication.
        // It verifies the user's session and provides access to user-related information.
        const { userId, has } = await req.auth(); // Get userId and has function from auth middleware to authenticate the user
        const hasPremiumPlan = await has({ plan: 'premium' }) // Check if user has premium plan using the has function
        // `clerkClient.users.getUser(userId)`:  Here, we're using the Clerk SDK to fetch the complete user object
        // from Clerk's backend, using the `userId` obtained during authentication.  This allows us to access
        // the user's metadata, profile information, etc.
        const user = await clerkClient.users.getUser(userId); // get the user's metadata
        if (!hasPremiumPlan && user.privateMetadata.free_usage) { // if the user doesn't have a premium plan and has free usage ,
            req.free_usage = user.privateMetadata.free_usage;   // then we add the free usage metadata to the request
        } else {
            await clerkClient.users.updateUserMetadata(userId, {     //now we set the free_usage to 0
                privateMetadata: {
                    free_usage: 0
                }
            })
            req.free_usage = 0;
        }
        req.plan = hasPremiumPlan ? 'premium' : 'free'; // here we put the user's plan to req.plan i.e. 'premium' or 'free' as according to their metadata
        next();
    } catch (error) {
        res.json({success : false, error: error.message})
    }
}
