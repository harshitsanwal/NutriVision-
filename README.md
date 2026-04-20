# 🥗 NutriVision AI: Project Deep-Dive
NutriVision AI is a smart nutritional assistant that bridges the gap between visual data (photos of food) and actionable health metrics. Instead of manually searching for calorie counts, users simply "show" the app their meal.

## Core Functionality Breakdown
Visual Recognition: The app utilizes the Gemini 1.5 Pro/Flash model's multimodal capabilities to identify food items, estimate portion sizes, and retrieve nutritional data from an image.

Interactive Quantities: It doesn't just guess; it asks for user input (e.g., "I ate half" or "I had 2 servings") to refine the calorie calculation.

Biometric Integration: By taking user height and weight, it calculates BMI (Body Mass Index).

Personalized Logistics: It uses the Harris-Benedict Equation (or similar algorithms) to recommend a daily caloric ceiling based on the user's BMI and health goals.

## 💻 The Technical Stack (Languages & Frameworks)
Based on your previous work and the nature of a Google AI Studio project, your app likely uses a modern Python-centric web stack.

###  1. Python (The Engine)
Python is the "glue" of this project.

Role: It handles the backend logic, processes the API calls to Google AI Studio, and performs the mathematical calculations for BMI and calorie targets.

Key Libraries: * google-generativeai: To communicate with the Gemini API.

PIL (Pillow): For image processing before sending data to the AI.

Streamlit or Flask: Likely used to host the app interface.

### 2. JavaScript (The Interactivity)
If you built a custom web front-end, JavaScript is what makes the app feel "alive."

Role: It manages the camera access (Webcam API) so you can take a photo of your food directly in the browser. It also handles the asynchronous updates—like showing a loading spinner while the AI "thinks" about your pizza's calories.

### 3. HTML5 & CSS3 (The Structure & Style)
HTML5: Used for the semantic structure—the file upload buttons, the result cards, and the input fields for your weight and height.

CSS3: This is what makes the app look professional. You likely used Flexbox or Grid to ensure the app looks good on both a PC and a mobile phone (since you'll be taking photos of food on the go).

### 4. JSON (The Data Language)
Role: When Google AI Studio looks at your food, it sends back data in JSON (JavaScript Object Notation) format. Your code then "parses" this data to extract specific numbers like calories, protein, and fats.

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/77957742-db29-474f-ae14-68622626734b

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
