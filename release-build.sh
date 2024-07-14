#!/bin/bash

# Prompt the user for the version number
read -p "Enter the version number: " version

# Create a new folder with the version number
folder_name="dist-$version"
mkdir "$folder_name"

# Copy the contents of the "dist" folder to the new folder
cp -r client/dist/* "$folder_name"

# Push the new folder to the target repository
git clone https://github.com/KaifSayyad/chat-wave-client-build-files.git
cd chat-wave-client-build-files
cp -r ../"$folder_name" .
git add "$folder_name"
git commit -m "Add $folder_name"
git push origin main

# Delete the folder from the current repository
cd ..
rm -rf "$folder_name"
git add .
git commit -m "Delete $folder_name"
git push origin main

rm -rf chat-wave-client-build-files