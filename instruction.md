
before building check required  softwares or dependcies in my system.
right no i have installed
node.
and tell me other requirements.

Build a complete production-ready mobile application later we would able to turn it for ios and andoird for but for now its should be for android first. app  called Tripa

Goal:
Create a very simple platform that connects travellers with local taxi drivers. This is NOT an Uber/Ola clone. There is no booking system, no payments, no ride tracking, and no user accounts initially.

Tech Stack:

React Native with Expo
TypeScript
Supabase (free tier)
NativeWind/Tailwind for styling
React Navigation
Axios for API calls
Environment variables for configuration

Core Principle:
Keep everything extremely simple and lightweight. The app should be usable by drivers and travellers with minimal technical knowledge.

DATABASE

for now we  can use json file only and main data that admin needs to see that well use google sheet. 

APP FLOW

There are only 2 main screens. user will find by his contact . means contact number will be unique 

Publish Ride Screen
Find Ride Screen

Bottom Tab Navigation:

Publish Ride
Find Ride
SCREEN 1 - PUBLISH RIDE

Fields:

Driver Name
Phone Number
Vehicle Number
From Location
To Location
Travel Date
Price (Optional)
Notes (Optional)

booking need(select box) every day , today only or every spefic date. 

Button:
Publish Ride

above form looks big form so we can break it also 

Validation:

Driver Name required
Phone Number required
Vehicle Number required
From Location required
To Location required
Travel Date required

On submit:

Insert record into Supabase.

Show success message:

"Ride published successfully"

Reset form after successful submission.

SCREEN 2 - FIND RIDE

Search filters:

From Location
To Location

Search Button

Display matching rides as cards.

Card should show:

Driver Name
Vehicle Number
Travel Date
Price
Phone Number

Buttons:

Call Driver
Copy Phone Number

for calling driver collect user mobile number too

Call Driver should open native dialer.

Use Linking.openURL('tel').

UI REQUIREMENTS

Design should be clean and modern.

Use:

White background
Simple cards
Large touch targets
Mobile-first layout
Good spacing
Rounded corners

Do not use complicated animations.

NO FEATURES

Do NOT build:

Login
Registration
OTP
Authentication
Chat
Notifications
Payments
Maps
GPS Tracking
Driver verification
Admin dashboard
Booking workflow
Passenger profiles

Keep Version 1 extremely small.

PROJECT STRUCTURE

Generate complete folder structure.

Example:

src/
screens/
components/
services/
hooks/
navigation/
utils/
types/

Include:

TypeScript types
Supabase configuration
Environment setup
Navigation setup
Reusable components
Form validation
Loading states
Error handling
CODE QUALITY

Follow senior-level engineering standards.

Requirements:

Reusable components
Strong TypeScript typing
Clean architecture
Separation of concerns
No duplicated code
Production-ready structure
DELIVERABLES

Generate:

Full folder structure
Database schema
Supabase setup
Environment variables
React Native screens
Navigation code
Components
Services
Types
Installation commands
Run commands
Build commands for Android APK

Output complete source code file-by-file.