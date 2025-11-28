# Sinter Scramble

A simple puzzle minigame webapp.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open the link shown in the terminal (usually http://localhost:5173).

## Customization

To use your own photo:
1. Place your image file (e.g., `my-photo.jpg`) in the `src/assets/` folder.
2. Open `src/main.js`.
3. Import the image at the top:
   ```javascript
   import myImage from './assets/my-photo.jpg';
   ```
4. Update the `IMAGE_URL` constant:
   ```javascript
   const IMAGE_URL = myImage;
   ```
