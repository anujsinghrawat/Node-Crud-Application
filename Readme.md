# Backend Project

This project is a URL shortener service. It provides the following routes:

1. Create short URL - POST `/url`

   - Request body:
     ```json
     {
       "url": "url.com"
     }
     ```

2. Use the shortened URL - GET `/url/:url`

3. Get analytics for the URL - GET `/url/analytics/:url`

## Usage

To use this service, send HTTP requests to the appropriate routes as described above.

## Deployment

This project is currently deployed at [https://url-shortner-1-eur4.onrender.com](https://url-shortner-1-eur4.onrender.com).

## License

This project is licensed under the [MIT License](LICENSE).
