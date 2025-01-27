# WebSocket Signaling Server

This **Electron** app takes the devices available screens and cameras to send their feed to **Vue** via **WebRTC** so they can be displayed and controlled remotely with **Robotjs**

## Table of Contents

- [Used Technologies](#used-technologies)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Running the Application](#-running-the-application)

---

## Used Technologies

- 🟣 [Vuetify](https://vuetifyjs.com/) for styling.
- 🟢 [Vue](https://vuejs.org/) for frontend framework.
- 🔵 [Electron](https://www.electronjs.org/) for getting devices screen and camera.
- 🟡 [WebRTC](https://webrtc.org/) for real-time stream of screen and camera.
- 🟠 [Robotjs](https://www.npmjs.com/package/robotjs) for remote screen control.

## 📌 Prerequisites

Before setting up the project, ensure you have the following tools installed on your machine:

- [Node.js (v16 or higher)](https://nodejs.org/)
- npm (comes with Node.js) or Yarn
- [Git](https://git-scm.com/)


To verify the installation, run the following commands:

```bash
node -v
npm -v
git --version
```

Ensure you see version numbers for each.

**My Versions**:

- Node.js v22.12.0
- npm 10.9.2
- Git 2.46.0.windows.1

## 💿 Installation

To set up the project, follow these steps:

- **Clone the Repository**: 

```bash
git clone https://github.com/MrChaylak/electron-screen-app.git
cd electron-screen-app
```

- **Install Dependencies**: 

```bash
npm install
```

This command installs all required dependencies listed in package.json.

## 💡 Running the Application

To run the application use the following command:

```bash
npm start
```

This will start the Electron app.

Note: This command starts only the **Electron** app, for remote screen display and control you will have to clone and run **Vue** and **Server** repositories which you can find the links to here:
- [Vue](https://github.com/MrChaylak/vue-screen-app.git) - The frontend framework used to display and control the remote devices available screens and cameras. Navigate to '/screen-share'.
- [Server](https://github.com/MrChaylak/server-screen-app.git) - The signaling server for WebRTC communication between Vue and Electron.
