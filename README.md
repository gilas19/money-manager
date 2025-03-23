# Money Manager

A mobile-friendly web application for managing personal finances and household expenses.

## Features

- **Home Dashboard**: View total expenses for the month, expenses per category, and recent transactions.
- **Transaction Flow**: View and filter all expenses and incomes.
- **Categories Management**: Create, edit, and delete expense categories with emoji support.
- **Household Management**: Create a household and invite members to share expenses.
- **Profile Management**: Update currency preferences and manage account settings.
- **Google Authentication**: Sign in with your Google account.

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **State Management**: Zustand
- **Authentication**: Firebase Authentication
- **Database**: Firestore
- **Forms**: React Hook Form
- **Icons**: React Icons
- **Date Handling**: date-fns
- **Emoji Picker**: emoji-picker-react

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/gilas19/money-manager.git
   cd money-manager
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a Firebase project:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Authentication with Google provider
   - Create a Firestore database

4. Set up environment variables:
   - Copy `.env.local.example` to `.env.local`
   - Fill in your Firebase configuration values

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

The app can be deployed to Vercel:

1. Push your code to a GitHub repository
2. Connect your repository to Vercel
3. Configure environment variables in Vercel
4. Deploy

## Project Structure

- `/src/app`: Next.js app router pages
- `/src/components`: React components
- `/src/context`: React context providers
- `/src/lib`: Firebase configuration
- `/src/store`: Zustand stores
- `/src/types`: TypeScript type definitions
- `/src/utils`: Utility functions

## License

This project is licensed under the MIT License.
