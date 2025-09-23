# Firebase Functions Configuration Commands

Run these commands in your terminal to configure Firebase Functions with your API keys:

## 1. Navigate to your project directory
```bash
cd "c:\Users\HARSH\Documents\Sports-Arena-main"
```

## 2. Login to Firebase (if not already logged in)
```bash
firebase login
```

## 3. Set your Firebase project
```bash
firebase use matcharena-app-e3d24
```

## 4. Configure API keys in Firebase Functions
```bash
firebase functions:config:set cric.api_key="bdc46755-7e68-459e-a2ab-b79ad1d50554"
firebase functions:config:set sports.api_key="d11dca33082525388b3b094a8f4b31ae"
firebase functions:config:set admin.allowed_emails="csds22137@glbitm.ac.in"
```

## 5. Deploy Functions (after configuration)
```bash
cd functions
npm install
firebase deploy --only functions
```

## 6. Set up Database Rules
```bash
firebase deploy --only database
```

## 7. Verify configuration
```bash
firebase functions:config:get
```

## 8. Run health check
```bash
cd ..
npm run health:check
```
