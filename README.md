# Food Waste Reducer 🍽️

An AI-powered web application that helps restaurants and cafeterias track and reduce food waste by analyzing photos of wasted food using Google's Gemini Vision API.

## Features

- 📸 **Photo Upload**: Capture or upload photos of food waste using mobile devices
- 🤖 **AI Analysis**: Automatically identifies wasted food items using Gemini Vision
- 📊 **Analytics Dashboard**: Visualize waste trends, top wasted items, and category breakdowns
- 💡 **AI Suggestions**: Receive actionable recommendations for portion adjustments and menu changes
- 📋 **Waste History**: Track all waste entries with detailed item information
- 💰 **Value Tracking**: Estimate the monetary value of wasted food

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: JSON file-based storage
- **AI**: Google Gemini 1.5 Flash Vision API
- **Charts**: Chart.js + react-chartjs-2

## Setup Instructions

1. **Install dependencies**:
   ```bash
   npm run install-all
   ```

2. **Set up environment variables**:
   - Create a `.env` file in the root directory
   - Add your Gemini API key:
     ```
     GEMINI_API_KEY=your_gemini_api_key_here
     PORT=3001
     ```
   - Get your API key at https://aistudio.google.com/app/apikey (free)

3. **Start the development servers**:
   ```bash
   npm run dev
   ```
   
   This will start:
   - Frontend on http://localhost:3000
   - Backend on http://localhost:3001

## Usage

1. **Upload a waste photo**: Click "📸 Upload Waste" tab and either:
   - Take a photo using your phone's camera (works best on mobile)
   - Upload an existing image file

2. **View analysis**: The AI will identify all food items, estimate quantities, and calculate waste value

3. **Check analytics**: View trends and statistics in the Analytics dashboard

4. **Get suggestions**: Review AI-powered recommendations for reducing waste

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API service functions
│   │   └── App.jsx
│   └── package.json
├── server/                # Node.js backend
│   ├── ai/               # AI vision analysis
│   ├── database/         # Database operations
│   └── index.js          # Express server
├── data/                 # JSON database (auto-created)
├── uploads/              # Uploaded images (auto-created)
└── package.json
```

## API Endpoints

- `POST /api/analyze-waste` - Upload and analyze a waste image
- `GET /api/waste-history` - Get waste entry history
- `GET /api/waste-stats` - Get waste statistics
- `GET /api/suggestions` - Get AI-powered suggestions

## Notes

- Get a free Gemini API key at https://aistudio.google.com/app/apikey
- Free tier: 60 requests per minute
- The app automatically creates necessary directories (data/, uploads/)
- Images are stored locally in the uploads/ directory
- All waste data is stored in JSON database (data/waste.json)

## Future Enhancements

- User authentication for multiple restaurants
- Export data to CSV/PDF
- Integration with inventory management systems
- Customizable waste categories
- Batch image processing
- Mobile app version


yo gurt
gurt yo


