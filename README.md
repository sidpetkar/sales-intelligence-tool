# ChatBot Frontend UI

A beautiful, responsive chatbot interface built with Next.js, ready for integration with any backend API. This is a clean, frontend-only version extracted from a larger project, designed to be easily customizable and integrated with your preferred backend service.

## ✨ Features

- **Modern UI Design**: Clean, responsive interface with beautiful message bubbles
- **Dark/Light Theme**: Built-in theme toggle with system preference detection
- **File Upload Support**: Drag & drop file upload with image preview
- **Audio Recording**: Built-in voice recording capabilities
- **Markdown Support**: Rich text rendering with syntax highlighting
- **Loading States**: Smooth loading animations and states
- **Mobile Responsive**: Optimized for all screen sizes
- **Model Selection**: Dropdown for switching between different AI models
- **Chat History**: Modal interface for managing conversation history
- **TypeScript**: Fully typed for better development experience

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone or copy this frontend folder to your project**

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Backend Integration

The UI currently uses mock functionality. To integrate with your backend:

### 1. Replace Mock API Call

In `src/app/page.tsx`, find the `handleSubmit` function and replace the mock implementation:

```typescript
// Replace this mock section:
await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
const mockResponse = `I understand you said: "${currentInput}"...`;

// With your actual API call:
const response = await fetch('/api/your-endpoint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: currentInput,
    model: selectedModel,
    // Add other parameters as needed
  }),
});

const data = await response.json();
const aiResponse = data.message; // Adjust based on your API response
```

### 2. Handle Streaming Responses (Optional)

If your backend supports streaming, you can implement real-time message updates:

```typescript
const reader = response.body?.getReader();
const decoder = new TextDecoder();
let accumulatedText = "";

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value, { stream: true });
  accumulatedText += chunk;
  
  // Update the last AI message with accumulated text
  setMessages(prev => [
    ...prev.slice(0, prev.length - 1),
    { role: 'ai', content: accumulatedText }
  ]);
}
```

### 3. File Upload Integration

For file uploads, modify the file handling in `handleFileChange` and `handleSubmit`:

```typescript
// In handleSubmit, add file handling:
if (selectedFile) {
  const formData = new FormData();
  formData.append('file', selectedFile);
  formData.append('message', currentInput);
  
  const response = await fetch('/api/your-upload-endpoint', {
    method: 'POST',
    body: formData,
  });
}
```

## 🎨 Customization

### Theme Colors

Modify theme colors in `src/app/globals.css`:

```css
:root {
  --bg-primary: #f9fafb;      /* Main background */
  --bubble-user: #e5e7eb;     /* User message bubble */
  --button-bg: #000000;       /* Send button background */
  /* ... other variables */
}
```

### Model Options

Update the model dropdown in `src/app/page.tsx`:

```typescript
const modelOptions = [
  { value: 'your-model-1', label: 'Your Model 1' },
  { value: 'your-model-2', label: 'Your Model 2' },
  // Add your models here
];
```

### Branding

1. **App Name**: Update in `src/app/layout.tsx`
2. **Logo**: Replace `public/brain.svg` with your logo
3. **Manifest**: Update `public/manifest.json` with your app details

## 📁 Project Structure

```
sagemind-frontend-ui/
├── public/
│   ├── brain.svg           # App icon
│   ├── three-dot.json     # Loading animation
│   └── manifest.json      # PWA manifest
├── src/
│   ├── app/
│   │   ├── globals.css    # Global styles and theme
│   │   ├── layout.tsx     # Root layout
│   │   ├── page.tsx       # Main chat interface
│   │   └── providers.tsx  # Context providers
│   └── contexts/
│       └── ThemeContext.tsx # Theme management
├── package.json
├── next.config.ts
├── tailwind.config.mjs
└── README.md
```

## 🔌 API Integration Examples

### Simple REST API

```typescript
const sendMessage = async (message: string, model: string) => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, model }),
  });
  
  const data = await response.json();
  return data.response;
};
```

### With Authentication

```typescript
const sendMessage = async (message: string, model: string) => {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ message, model }),
  });
  
  return response.json();
};
```

### WebSocket Integration

```typescript
const connectWebSocket = () => {
  const ws = new WebSocket('ws://your-backend/chat');
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    // Update messages state with real-time response
    setMessages(prev => [...prev, { role: 'ai', content: data.message }]);
  };
  
  return ws;
};
```

## 🎯 Features to Implement

The UI provides placeholders for these features that you can connect to your backend:

- **Chat History**: Save/load conversations
- **User Authentication**: Login/logout functionality  
- **File Processing**: Handle image and audio uploads
- **Voice Recording**: Process audio input
- **Message Search**: Search through chat history
- **Export Conversations**: Download chat logs
- **Custom Commands**: Handle special input commands

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Key Components

- **ChatPage** (`page.tsx`): Main chat interface
- **ThemeProvider** (`ThemeContext.tsx`): Theme management
- **LoadingAnimation**: Typing indicator component

## 📱 Mobile Optimization

The interface is fully responsive and includes:

- Touch-friendly buttons and inputs
- Optimized message bubbles for mobile
- Swipe gestures support (can be extended)
- Mobile-first CSS approach

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect to Vercel
3. Deploy automatically

### Other Platforms

The app is a standard Next.js application and can be deployed to:

- Netlify
- Railway
- Digital Ocean
- AWS
- Any Node.js hosting service

## 🤝 Contributing

This is a frontend template. Customize it according to your needs:

1. Fork the project
2. Make your modifications
3. Update this README with your changes
4. Share with others if useful!

## 📄 License

This frontend UI is provided as-is for integration with your projects. Modify freely according to your needs.

## 🆘 Support

For issues with the frontend:

1. Check the browser console for errors
2. Ensure all dependencies are installed
3. Verify your API endpoints match the integration code
4. Test with mock data first before integrating with your backend

---

**Happy coding!** 🎉

This frontend provides a solid foundation for any chatbot application. Focus on building your backend logic while this UI handles the user experience. 