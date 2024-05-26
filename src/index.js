import express from "express";
import connectDB from "./db/index.js";
import dotenv from "dotenv";
import { app } from "./app.js";

dotenv.config(
    {
        path: ".env",
    }

)


connectDB().
    then(() => {
        console.log("Connected to the database");
        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT} and the started running on the link http://localhost:${process.env.PORT}`);
        });
    })
    .catch((error) =>{
        console.log("Error connecting to the database", error);
        process.exit(1);
    });








/*


;(async () => {try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    app.on("error",(error) => console.log("Error connecting to the database", error));

    app.listen(process.env.PORT, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    });
    
} catch (error) {
    console.log(Error, error);
    throw new Error("Error while connecting to the database");
    process.exit(1);
}}
)();
*/