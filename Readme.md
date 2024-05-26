# Node.js CRUD Application

## Overview
This project is a Node.js-based CRUD application with comprehensive user management features, including registration, login, profile updates, password management, and user activity tracking. The application employs JWT authentication for secure user sessions, handles file uploads with Cloudinary, and uses middleware for various functionalities, including authentication and file handling.

## Features
- User Registration and Authentication (Login/Logout)
- Secure Password Management
- Profile Management (Update Avatar and Cover Image)
- User Activity Tracking (Watch History)
- JWT Authentication for Secure Sessions
- File Uploading with Multer and Cloudinary

## Routes

- **POST /register**: Register a new user with an avatar and cover image.
- **POST /login**: Log in an existing user.
- **POST /logout**: Log out the current user.
- **POST /refresh-token**: Refresh the access token.
- **POST /change-password**: Change the current user's password.
- **GET /current-user**: Get details of the currently logged-in user.
- **PATCH /update-account**: Update account details (full name, email).
- **PATCH /avatar**: Update user avatar.
- **PATCH /cover-image**: Update user cover image.
- **GET /c/:username**: Get a user's channel profile.
- **GET /history**: Get the watch history of the current user.

## Tech Stack
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JWT
- **File Upload**: Multer, Cloudinary
- **Security**: Bcrypt
- **Utilities**: Async Handler, API Error Handling

## Installation

1. Clone the repository:
   ```bash
   git clone <repository_url>
   cd Node-Crud-Application
   ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Create a .env file in the root directory and add      your environment variables:

    ```bash
    PORT=3000
    MONGO_URI=<your_mongodb_uri>
    ACCESS_TOKEN_SECRET=<your_access_token_secret>
    REFRESH_TOKEN_SECRET=<your_refresh_token_secret>
    CLOUDINARY_CLOUD_NAME=<your_cloudinary_cloud_name>
    CLOUDINARY_API_KEY=<your_cloudinary_api_key>
    CLOUDINARY_API_SECRET=<your_cloudinary_api_secret>
    ```

4. Start the server
    ```bash
    npm run dev
    ```
    