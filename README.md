# ChatWave Client
This is a chat-app which connect you to random users across the word. It uses socket.io for low latency connections with the underlying technology of WebSockets.

## Getting Started

You can clone this repository and contribute to the frontend. Follow the steps below publish your own version of frontend:

### Prerequisites

Ensure you have the following installed on your machine:
- [Git](https://git-scm.com/downloads)
- [Nodejs](https://nodejs.org/en/download/package-manager)
- [Docker](https://www.docker.com/products/docker-desktop)

### Installation

1. **Clone the repository:**

    ```sh
    git clone https://github.com/KaifSayyad/chat-wave-client.git
    ```

2. **Navigate to the ChatWave-client folder:**

    ```sh
    cd chat-wave-client/client
    ```

3. **Create a .env file**
   ```sh
   touch .env
   ```

4. **Paste the below config in .env file**

   ```sh
    VITE_SERVER_URL = "http://localhost:9999"

    VITE_FIREBASE_API_KEY = ""
    VITE_FIREBASE_AUTH_DOMAIN = ""
    VITE_FIREBASE_PROJECT_ID = ""
    VITE_FIREBASE_STORAGE_BUCKET = ""
    VITE_FIREBASE_MESSAGING_SENDER_ID = ""
    VITE_FIREBASE_APP_ID = ""
    VITE_FIREBASE_MEASUREMENT_ID = ""
    ```

    Also you'll need to set up Firebase auth. 
    If you want to use mine mail me at [kaifalisayyad](mailto:kaifalisayyad@gmail.com?subject=[GitHub]%20ENV%20KEYS%20FOR%20CHAT%20WAVE)

NOTE : Here Port Number (default is 9999) should be same as "NGINX_PORT" in ./chat-wave-server/.env file

5. **Go back to previous directory**
    ```sh
    cd ..
    ```

6. **Run "release-build.sh" file and enter the version number you want to give to your frontend file (Please go through [build-files](https://github.com/KaifSayyad/chat-wave-client-build-files) repository to make sure you do not enter the version which is already present).**

    **For Mac and Linux Users** <br>
        To give permission to run "release-build.sh" file
    ```sh
    chmod u+x release-build.sh
    ```

    ```sh
    ./release-build.sh
    ```

   **For Windows Users** <br>
    Open git bash terminal in current directory and Run
    ```sh
    sh release-build.sh
    ```

7. **Go to [ChatWave-server](https://github.com/KaifSayyad/chat-wave-server)!**

