# Quick Setup Guide

## 🚀 Get Started in 3 Minutes

### 1. Install Dependencies
```bash
cd sagemind-frontend-ui
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Open Browser
Go to [http://localhost:3000](http://localhost:3000)

## ⚡ Immediate Next Steps

### Connect Your Backend
1. Open `src/app/page.tsx`
2. Find the `handleSubmit` function (around line 100)
3. Replace the mock API call with your endpoint:

```typescript
// Replace this:
const mockResponse = `I understand you said: "${currentInput}"...`;

// With this:
const response = await fetch('http://your-backend-url/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: currentInput,
    model: selectedModel
  }),
});
const data = await response.json();
const aiResponse = data.message; // Adjust based on your API response
```

### Customize Branding
1. **App Name**: Change "ChatBot UI" in `src/app/layout.tsx`
2. **Logo**: Replace `public/brain.svg` with your logo
3. **Colors**: Modify CSS variables in `src/app/globals.css`

## 📝 Backend API Format

Your backend should accept:
```json
{
  "message": "User's message",
  "model": "selected-model-name"
}
```

And return:
```json
{
  "message": "AI response message"
}
```

## 🎯 Ready to Deploy?

```bash
npm run build
npm start
```

---

That's it! You now have a beautiful chatbot frontend ready for your backend integration. 