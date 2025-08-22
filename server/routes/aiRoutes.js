//here we create endpoints of all the ai api functions.
import express from "express";
import { generateArticle, generateBlogTitle, generateImage, removeImageBackground, removeImageObject, resumeReview } from "../controllers/aiController.js";
import {auth} from "../middlewares/auth.js";
import { upload } from "../configs/multer.js";

const aiRouter = express.Router(); // here we create a new router instance

aiRouter.post('/generate-article',auth, generateArticle) // this is the post method for the route mentioned , auth is the middleware and generate article is the function handling the request
aiRouter.post('/generate-blog-title',auth, generateBlogTitle) // this is the post method for the route mentioned , auth is the middleware and generate blog title is the function handling the request
aiRouter.post('/generate-image',auth, generateImage)
aiRouter.post('/remove-image-background',upload.single('image'), auth, removeImageBackground)
aiRouter.post('/remove-image-object',upload.single('image'), auth, removeImageObject)
aiRouter.post('/resume-review', upload.single('resume'),auth,resumeReview)


export default aiRouter;

//this is the ai router that serves as an api endpoint for the ai generation feature