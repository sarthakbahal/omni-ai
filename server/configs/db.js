import {neon} from '@neondatabase/serverless'

const sql = neon(`${process.env.DATABASE_URL}`); //we initialize the sql client neon which provides the postgress db

export default sql; // Export the sql instance for use in other parts of the application