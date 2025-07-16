# WhatsApp Chat Analyzer

> AI-powered WhatsApp chat export analyzer with smart chunking and interactive dashboard

## 🚀 Features

- **AI-Powered Analysis**: Uses Google Gemini 2.5 Pro for comprehensive chat analysis
- **Smart Chunking**: Intelligently breaks down large chat files for optimal processing
- **Interactive Dashboard**: Beautiful visualizations with Chart.js and Tailwind CSS
- **45-Second Delay**: Automatically waits 45 seconds between chunk processing for optimal API usage
- **Real-time Progress**: Live progress tracking during analysis
- **Privacy-First**: No data storage, processing happens in memory and results are temporary
- **Responsive Design**: Works perfectly on desktop and mobile devices

## 📋 Requirements

- Node.js 18+ and npm
- Google Gemini 2.5 Pro API key
- Modern web browser

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/whatsapp-chat-analyzer.git
   cd whatsapp-chat-analyzer/chat-analyzer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Edit `.env.local` with your configuration:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   NEXTJS_URL=http://localhost:3000
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Visit [http://localhost:3000](http://localhost:3000)

## 📱 Usage

### 1. Export Your WhatsApp Chat

1. Open WhatsApp on your phone
2. Go to the chat you want to analyze
3. Tap the three dots menu → More → Export chat
4. Choose "Without Media" (faster processing)
5. Share the .txt file to your computer

### 2. Upload and Analyze

1. Visit the application in your browser
2. Drag and drop or select your chat export file
3. Wait for the analysis to complete (varies based on file size)
4. If multiple chunks are created, the system automatically waits 45 seconds between each chunk for optimal API usage
5. Explore your results in the interactive dashboard

### 3. View Results

- **Interactive Dashboard**: View comprehensive analysis results with charts and insights
- **Real-time Updates**: Watch progress as your chat is being processed
- **Detailed Analytics**: Get insights into sentiment, topics, and participant behavior

## 🏗️ Project Structure

```
whatsapp-chat-analyzer/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── charts/           # Chart components
│   ├── dashboard/        # Dashboard components
│   ├── ui/               # UI components
│   └── upload/           # Upload components
├── lib/                   # Core libraries
│   ├── ai/               # AI integration
│   ├── i18n/             # Internationalization
│   ├── parsers/          # Chat parsers
│   ├── processing/       # Data processing
│   └── utils/            # Utility functions
├── public/               # Static assets
└── docs/                 # Documentation
```

## ⚙️ Technical Features

### Smart Chunking Algorithm
- **Automatic File Splitting**: Large files are automatically divided into optimal chunks
- **Conversation-Aware**: Breaks at natural conversation boundaries (4+ hour gaps)
- **Size Optimization**: Maintains chunks between 2.5MB and 3MB for optimal API performance
- **45-Second Delay**: Automatically waits 45 seconds between chunk processing to respect API limits

### Processing Pipeline
1. **File Upload & Validation**: Validates file format and size
2. **Chat Parsing**: Extracts messages, timestamps, and participant information
3. **Smart Chunking**: Intelligently divides large files
4. **AI Analysis**: Each chunk is analyzed by Google Gemini 2.5 Pro
5. **Result Aggregation**: Combines all chunk results into final analysis
6. **Dashboard Display**: Interactive visualization of results

## 🔒 Security & Privacy

- **No Data Storage**: Chat data is processed in memory and immediately deleted
- **Temporary Processing**: Analysis results are stored temporarily with auto-cleanup
- **Secure Processing**: All data processing happens server-side with encryption
- **Privacy-First**: No personal data is logged or stored permanently
- **API Rate Limiting**: 45-second delays between chunks respect API limits and prevent overload

## 📊 Analytics Features

### Sentiment Analysis
- Overall conversation sentiment
- Individual participant sentiment
- Sentiment trends over time
- Confidence scoring

### Communication Patterns
- Response time analysis
- Message frequency patterns
- Peak activity hours and days
- Conversation flow analysis

### Topic Analysis
- Automatic topic extraction
- Keyword frequency analysis
- Topic sentiment mapping
- Trending discussions

### Participant Insights
- Message and word counts
- Communication styles
- Engagement levels
- Activity patterns

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository to Vercel**
2. **Add environment variables** in Vercel dashboard
3. **Deploy** - Vercel will automatically build and deploy

### Docker

```bash
# Build the Docker image
docker build -t whatsapp-chat-analyzer .

# Run the container
docker run -p 3000:3000 \
  -e GEMINI_API_KEY=your_api_key \
  whatsapp-chat-analyzer
```

### Manual Deployment

```bash
# Build the application
npm run build

# Start the production server
npm start
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint

# Run type checking
npm run type-check
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix linting issues
- `npm run type-check` - Run TypeScript type checking
- `npm run test` - Run tests

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key | Yes |
| `NEXTJS_URL` | Application URL | No |
| `LOG_LEVEL` | Logging level (error, warn, info, debug) | No |
| `NODE_ENV` | Environment (development, production) | No |

## 📈 Performance

- **Smart Chunking**: Optimizes large files for efficient processing with 45-second delays
- **Lazy Loading**: Components load only when needed
- **Memory Efficient**: No persistent data storage, all processing in memory
- **Bundle Optimization**: Code splitting and tree shaking
- **Image Optimization**: Automatic image compression and format selection
- **API Rate Limiting**: Intelligent delays prevent API overload

## 🐛 Troubleshooting

### Common Issues

1. **API Key Issues**
   - Verify your Gemini API key is valid
   - Check API quotas and limits
   - Ensure proper permissions

2. **File Upload Issues**

3. **File Upload Issues**
   - Check file size (max 100MB)
   - Ensure .txt format
   - Verify file contains valid WhatsApp export

3. **Processing Issues**
   - Large files may take longer due to 45-second delays between chunks
   - Monitor the progress bar for real-time updates
   - If processing fails, try with a smaller file first

4. **Analysis Failures**
   - Check console for error messages
   - Verify API key permissions
   - Try with a smaller file first

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Google Gemini](https://ai.google.dev/) for AI analysis capabilities
- [Vercel](https://vercel.com/) for hosting and deployment
- [Next.js](https://nextjs.org/) for the React framework
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Chart.js](https://www.chartjs.org/) for data visualization

---

Made with ❤️ for analyzing WhatsApp conversations