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
import axios from "axios";
// We import the Clerk client to interact with the Clerk API for user management,
// specifically for updating user metadata.

import { clerkClient } from "@clerk/clerk-sdk-node";
import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';
import pdf from "pdf-parse/lib/pdf-parse.js"

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
        VALUES (${userId}, ${prompt}, ${content}, 'article') `;

        // If the user is on a free plan, we need to update their usage count.
        if (plan !== 'premium') {
            // NOTE: `clerkClient` is used here but not imported at the top of the file.
            // This would cause a runtime error. You should add `import { clerkClient } from "@clerk/clerk-sdk-node";`
            // or a similar import at the top of the file.
            await clerkClient.users.updateUserMetadata(userId, {
                privateMetadata: {
                    free_usage: free_usage + 1
                }
            })
        }

        // Finally, we send a successful response back to the client.
        // We send a JSON object containing a success flag and the generated content.
        res.json({ success: true, content })

    } catch (error) {
        // If any error occurred in the 'try' block, we catch it here.
        // It's good practice to log the error on the server for debugging purposes.
        console.log(error.message);
        // We also send a generic error message back to the client so they know something went wrong.
        res.json({ success: false, message: error.message });
    }
}

// This controller function is responsible for generating just the title for a blog post.
// It's another 'async' function because it also communicates with an external API and our database.
// It follows a very similar pattern to `generateArticle`, demonstrating how you can create
// specialized controller actions for different features.
export const generateBlogTitle = async (req, res) => {

    // We wrap our logic in a try...catch block for robust error handling.
    try {

        const { userId } = req.auth();
        const { prompt } = req.body;
        const plan = req.plan;
        const free_usage = req.free_usage;


        // The same usage limit logic as in the previous function. Reusing logic like this
        // is common, and for larger applications, you might move this check into a separate
        // middleware to avoid repetition (this is known as the DRY principle - Don't Repeat Yourself).
        if (plan !== 'premium' && free_usage >= 10) {
            return res.json({ success: false, message: 'Free usage limit reached. Upgrade to premium for more requests.' })
        }

        // We call the Gemini AI, but notice the prompt is specifically tailored to generate a title.
        const response = await AI.chat.completions.create({
            model: "gemini-2.0-flash",
            messages: [

                {
                    role: "user",
                    content: prompt,
                },

            ],


            // We might use different parameters for different tasks. Here, the temperature is the same,
            // but the `max_tokens` is much lower because a title is short.
            temperature: 0.7,

            max_tokens: 100,
        });


        // Extract the generated title from the AI's response.
        const content = response.choices[0].message.content; // this is the response from the AI


        // We store this creation in our database. Notice the `type` is 'blog-title'.
        // This allows us to easily filter and find different types of content the user has created.
        await sql`INSERT INTO creations (user_id, prompt, content, type) 
        VALUES (${userId}, ${prompt}, ${content}, 'blog-title') `;


        // If the user is on a free plan, we increment their usage count in Clerk's metadata.
        if (plan !== 'premium') {

            // Again, ensure `clerkClient` is imported at the top of the file.
            await clerkClient.users.updateUserMetadata(userId, {
                privateMetadata: {
                    free_usage: free_usage + 1
                }
            })
        }


        // Send the successful response with the generated title back to the client.
        res.json({ success: true, content })

    } catch (error) {

        // Log and return any errors that occur.
        console.log(error.message);

        res.json({ success: false, message: error.message });
    }
}

// This controller handles image generation, which introduces more complex interactions.
export const generateImage = async (req, res) => {

    try {

        // Standard setup: get user info and request body.
        const { userId } = req.auth();
        const { prompt, publish } = req.body;
        const plan = req.plan;



        // This is a premium-only feature. We check the user's plan and return an error
        // if they are not a premium user. This is a form of authorization.
        if (plan !== 'premium') {
            return res.json({ success: false, message: 'This feature is only available for premium users.' })
        }

        // To send data to the ClipDrop API (which is likely a 'multipart/form-data' endpoint),
        // we use the FormData object. This is the standard way to send files or key-value data
        // in a format that mimics a web form submission.
        const formData = new FormData()
        formData.append('prompt', prompt)
        
        // We're using 'axios', a popular library for making HTTP requests from Node.js.
        // We are making a POST request to the ClipDrop text-to-image API endpoint.
        const {data} = await axios.post("https://clipdrop-api.co/text-to-image/v1", formData , {
            // We must provide our API key in the request headers for authentication.
            // This tells ClipDrop that we are authorized to use their service.
            headers : {
                 'x-api-key': process.env.CLIPDROP_API_KEY , 
            },
            // This is a critical option. It tells axios to expect the response as raw binary data
            // (an 'arraybuffer') rather than trying to parse it as JSON text. An image is binary data.
            responseType: "arraybuffer",
        } )

        // The `data` we receive is a Node.js Buffer containing the raw image bytes.
        // To use this data easily (e.g., store it, display it), we convert it to a Base64 string.
        // A "Data URL" is a URI scheme that provides a way to include data in-line.
        // `data:image/png;base64,` tells the browser that the following string is a Base64-encoded PNG image.
        const base64Image = `data:image/png;base64,${Buffer.from(data, 'binary').
            toString('base64')
        }`;

        // We now upload the generated image to Cloudinary. Cloudinary is a cloud service for
        // image and video management. We upload it there to get a permanent, public URL.
        // We upload the Base64 Data URL directly. Cloudinary is smart enough to handle it.
        const { secure_url } =  await cloudinary.uploader.upload(base64Image)


        // In our database, we don't store the image itself. That would be very inefficient.
        // Instead, we store the `secure_url` provided by Cloudinary. This is the standard practice.
        // We also store the `publish` status, which might be used for a public gallery feature.
        await sql`INSERT INTO creations (user_id, prompt, content, type, publish) 
        VALUES (${userId}, ${prompt}, ${secure_url}, 'image', ${publish ?? false}) `;


        // We send the public URL of the image back to the client. The frontend can now
        // use this URL in an `<img>` tag to display the generated image.
        res.json({ success: true, content: secure_url })

    } catch (error) {

        console.log(error.message);

        res.json({ success: false, message: error.message });
    }
}

export const removeImageBackground = async (req, res) => {

    try {

        // Standard setup: get user info and request body.
        const { userId } = req.auth();
        const image = req.file;
        const plan = req.plan;



        // This is a premium-only feature. We check the user's plan and return an error
        // if they are not a premium user. This is a form of authorization.
        if (plan !== 'premium') {
            return res.json({ success: false, message: 'This feature is only available for premium users.' })
        }

        
        // we use cloudinary's own function to remove the background 
        // using transformation provided by the cloudinary DB we can easily remove the background from images

        const { secure_url } =  await cloudinary.uploader.upload(image.path, {
            transformation : [
                {
                    effect: 'background_removal',
                    background_removal: 'remove_the_background'
                }
            ]
        })


        
        await sql`INSERT INTO creations (user_id, prompt, content, type) 
        VALUES (${userId}, 'Remove background from image', ${secure_url}, 'image') `;


        // We send the public URL of the image back to the client. The frontend can now
        // use this URL in an `<img>` tag to display the generated image.
        res.json({ success: true, content: secure_url })

    } catch (error) {

        console.log(error.message);

        res.json({ success: false, message: error.message });
    }
} 

export const removeImageObject = async (req, res) => {

    try {

        // Standard setup: get user info and request body.
        const { userId } = req.auth();
        const { object } = req.body; //we get the object that the user has input from the body 
        const image = req.file; // we get the image from the user uploaded file and we input it here  
        const plan = req.plan;



        // This is a premium-only feature. We check the user's plan and return an error
        // if they are not a premium user. This is a form of authorization.
        if (plan !== 'premium') {
            return res.json({ success: false, message: 'This feature is only available for premium users.' })
        }

        
        // we use cloudinary's own function to remove the background 
        // using transformation provided by the cloudinary DB we can easily remove the background from images

        const { public_id } =  await cloudinary.uploader.upload(image.path)
        // here we upload the image on cloudinary and get its id


        //using cloudinary's URL function we transform the image by removing the specified object
        const imageUrl = cloudinary.url(public_id,{
            transformation:[{effect: `gen_remove:${object}`}],
            resource_type: 'image'
        })


        
        await sql`INSERT INTO creations (user_id, prompt, content, type) 
        VALUES (${userId}, ${`Removed ${object} from image`}, ${imageUrl}, 'image') `;


        // We send the public URL of the image back to the client. The frontend can now
        // use this URL in an `<img>` tag to display the generated image.
        res.json({ success: true, content: imageUrl })

    } catch (error) {

        console.log(error.message);

        res.json({ success: false, message: error.message });
    }
} 

export const resumeReview = async (req, res) => {

    try {

        // Standard setup: get user info and request body.
        const { userId } = req.auth();
        const resume = req.file;
        const plan = req.plan;
        const free_usage = req.free_usage;


        if (plan !== 'premium' && free_usage >= 10) {
            return res.json({ success: false, message: 'This feature is only available for premium users.' })
        }

        if(resume.size > 5 * 1024 * 1024){ // here we check the file size to see if it exceeds 5MB then return false
            return res.json({ success: false, message: 'Resume file size exceeds 5MB limit.' });
        }

        const databuffer = fs.readFileSync(resume.path); // we create a databuffer to process the resume 

        const pdfData = await pdf(databuffer); // we use the pdf-parse library to extract text from the pdf file

        const prompt = `Review the following resume and provide super constructive and critical feedback on its strengths, weakness, and areas for improvement. Resume Content:\n\n${pdfData.text}`
        // we send the pdf data to the AI model for analysis as text by attaching it to the prompt

        const response = await AI.chat.completions.create({
            model: "gemini-2.0-flash",
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
            temperature: 0.7,
            max_tokens: 1000,
        });

        const content = response.choices[0].message.content;


        await sql`INSERT INTO creations (user_id, prompt, content, type) 
        VALUES (${userId},'Review the uploaded resume', ${content}, 'resume-review') `;

        if (plan !== 'premium') {
            // NOTE: `clerkClient` is used here but not imported at the top of the file.
            // This would cause a runtime error. You should add `import { clerkClient } from "@clerk/clerk-sdk-node";`
            // or a similar import at the top of the file.
            await clerkClient.users.updateUserMetadata(userId, {
                privateMetadata: {
                    free_usage: free_usage + 3
                }
            })
        }

        res.json({ success: true, content: content })


    } catch (error) {

        console.log(error.message);

        res.json({ success: false, message: error.message });
    }
} 