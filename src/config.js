// OpenAI API key loaded from environment variable
// For local development: create a .env file with VITE_OPENAI_API_KEY=your_key
// For Render deployment: add VITE_OPENAI_API_KEY in the Environment settings
export const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || ''
