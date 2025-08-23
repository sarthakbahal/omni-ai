import sql from "../configs/db.js";

// this is function is to get all the user creations
export const getUserCreations = async (req,res) => {
    try {
        const {userId} = req.auth()

        // Fetch all creations for the specific user, ordered by the most recent.
        const creations = await sql`SELECT * FROM creations WHERE user_id = ${userId} ORDER BY created_at DESC`;

        res.json({success: true, creations});

    } catch (error) {
        res.json({success: false , message: error.message})
    }
}


// this function is to get all the published creations of the user.
export const getPublishedCreations = async (req,res) => {
    try {

        // Fetch all published creations for the specific user, ordered by the most recent.
        const creations = await sql`SELECT * FROM creations WHERE publish = true ORDER BY created_at DESC`;

        res.json({success: true, creations});

    } catch (error) {
        res.json({success: false , message: error.message})
    }
}

//this function is to toggle like and dislike on a creation
export const toggleLikeCreation = async (req,res) => {
    try {
        const {userId} = req.auth() //this gets the user ID
        const {id} = req.body //this gets the creation ID

        const [creation] = await sql`SELECT * FROM creations WHERE id = ${id}` // get every detail of the creation through its ID

        if(!creation){      // this checks if the creation exists or not
            return res.json({success: false, message: "Creation not found"})
        }

        const currentLikes = creation.likes;    // we make 2 variables so as to get the likes on the creation
        const userIdStr = userId.toString();    // we convert the user ID to a string

        let updatedLikes;
        let message;

        // This checks if the user has already liked the creation.
        if(currentLikes.includes(userIdStr)){     
            // If already liked, remove the user's ID to dislike the creation.
            updatedLikes = currentLikes.filter((user) => user !== userIdStr);
            message = "Creation disliked";
        }
        else{
            // If not liked, add the user's ID to like the creation.
            updatedLikes = [...currentLikes, userIdStr];
            message = "Creation liked";
        }

        // Format the array for the SQL text[] type before updating.
        const formattedArray = `{${updatedLikes.join(',')}}`

        // Update the database with the new likes array.
        await sql`UPDATE creations SET likes = ${formattedArray}::text[] WHERE id = ${id}`

        // Send a success response with the appropriate message.
        res.json({success: true, message});

    } catch (error) {
        res.json({success: false , message: error.message})
    }
}