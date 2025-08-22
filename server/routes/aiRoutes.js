import express from "express";
import { generateArticle, generateBlogTitle, generateImage } from "../controllers/aiController.js";
import {auth} from "../middlewares/auth.js";

const aiRouter = express.Router(); // here we create a new router instance

aiRouter.post('/generate-article',auth, generateArticle) // this is the post method for the route mentioned , auth is the middleware and generate article is the function handling the request
aiRouter.post('/generate-blog-title',auth, generateBlogTitle) // this is the post method for the route mentioned , auth is the middleware and generate blog title is the function handling the request
aiRouter.post('/generate-image',auth, generateImage)


export default aiRouter;

//this is the ai router that serves as an api endpoint for the ai generation feature