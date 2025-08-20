// In Node.js, 'import' is the modern ES6 syntax for bringing in modules (libraries or your own files)
// to use their functionality.

// We're importing the OpenAI library. Even though we're using Google's Gemini,
// this library provides a convenient and standard way to interact with AI models
// that follow the OpenAI API structure.
import OpenAI from "openai";


// We're importing our database configuration. The `sql` object is likely a "tagged template"
// function from a library like 'postgres.js'. This allows us to write clean, safe SQL queries
// directly in our JavaScript code, and it helps prevent SQL injection attacks.
import sql from "../configs/db.js";

// We are creating a new instance of the AI client.
const AI = new OpenAI({
    // An API key is like a password for our application to use a service.
    // We store it in environment variables (`process.env`) so it's not hardcoded in the source code,
    // which is a major security best practice.
    apiKey: process.env.GEMINI_API_KEY,

    // This is a key part. Although we're using the 'OpenAI' library, we are pointing it
    // to Google's Generative Language API endpoint. This works because Google provides an
    // endpoint that is compatible with the OpenAI API's structure.
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});

// 'export' makes this function available to be imported and used in other files,
// typically in our routes file (e.g., `aiRoutes.js`) to connect it to a URL endpoint.
// This is an 'async' function because interacting with APIs and databases are operations
// that take time. 'async/await' lets us write this asynchronous code as if it were synchronous,
// making it much easier to read and reason about.
export const generateArticle = async (req, res) => {
    // A 'try...catch' block is fundamental for error handling. If anything goes wrong
    // inside the 'try' block (like the AI API being down), the code execution jumps
    // to the 'catch' block, preventing the server from crashing.
    try {
        // 'req' (request) and 'res' (response) are the core objects in Express.js.
        // 'req' contains all information about the incoming request, like headers, body, and user data.
        // 'res' is what we use to send a response back to the client.

        // This implies we have an authentication middleware running before this controller.
        // The middleware verifies the user's identity and attaches their info to the request object.
        const { userId } = req.auth();
        const { prompt, length } = req.body;
        const plan = req.plan;
        const free_usage = req.free_usage;

        // Here, we implement business logic for a tiered-access system (freemium model).
        // If the user is not on a 'premium' plan and has used up their free quota,
        // we stop execution and send a specific message.
        if (plan !== 'premium' && free_usage >= 10) {
            return res.json({ success: false, message: 'Free usage limit reached. Upgrade to premium for more requests.' })
        }

        const response = await AI.chat.completions.create({
            model: "gemini-2.0-flash",
            messages: [
                // The 'messages' array structures the conversation for the AI.
                // 'role: "user"' indicates that the following content is from the end-user.
                {
                    role: "user",
                    content: prompt,
                },

            ],

            // 'temperature' controls the creativity of the AI. A lower value (e.g., 0.2) makes it more
            // deterministic and focused, while a higher value (like 0.7 here) makes it more creative.
            temperature: 0.7,
            // 'max_tokens' sets a limit on the length of the generated response to control costs and response size.
            max_tokens: length,
        });

        // The AI's response is nested inside the response object. We extract the actual text content.
        const content = response.choices[0].message.content;

        // Here we interact with our database. The 'await' keyword pauses the function
        // until the database query is complete. We're inserting a record of this creation
        // for logging, history, or analytics purposes.
        await sql`INSERT INTO creations (user_id, prompt, content, type) 
        VALUES (${userId}, ${prompt}, ${content}, 'article') ` ;

        // If the user is on a free plan, we need to update their usage count.
        if(plan !== 'premium'){
            // NOTE: `clerkClient` is used here but not imported at the top of the file.
            // This would cause a runtime error. You should add `import { clerkClient } from "@clerk/clerk-sdk-node";`
            // or a similar import at the top of the file.
            await clerkClient.users.updateMetadata(userId, {
                privateMetadata: {
                    free_usage: free_usage + 1
                }
            })
        }

        // Finally, we send a successful response back to the client.
        // We send a JSON object containing a success flag and the generated content.
        res.json({success : true, content})

    } catch (error) {
        // If any error occurred in the 'try' block, we catch it here.
        // It's good practice to log the error on the server for debugging purposes.
        console.log(error.message);
        // We also send a generic error message back to the client so they know something went wrong.
        res.json({ success: false, message: error.message });
    }
}

// this is like creating a api for the ai generation feature , the endpoint for which is aiRoutes file.