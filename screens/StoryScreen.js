import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { Camera } from "expo-camera";
import { ImageManipulator } from "expo-image-manipulator";
import { useNavigation } from "@react-navigation/native";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import { firestore, auth, storage } from "../firebase";
import { Ionicons } from "@expo/vector-icons";
import "firebase/compat/firestore";
import "firebase/compat/storage";
import "firebase/compat/database";

const StoryScreen = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraType, setCameraType] = useState(Camera.Constants.Type.back);
  const [capturedMedia, setCapturedMedia] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [flashMode, setFlashMode] = useState(Camera.Constants.FlashMode.off);
  const cameraRef = useRef(null);
  const navigation = useNavigation();

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const handleCameraTypeToggle = () => {
    setCameraType(
      cameraType === Camera.Constants.Type.back
        ? Camera.Constants.Type.front
        : Camera.Constants.Type.back
    );
  };

  const handleToggleFlash = () => {
    setFlashMode((prevFlashMode) =>
      prevFlashMode === Camera.Constants.FlashMode.off
        ? Camera.Constants.FlashMode.on
        : Camera.Constants.FlashMode.off
    );
  };

  const handleCapturePhoto = async () => {
    if (cameraRef.current) {
      try {
        let photo = await cameraRef.current.takePictureAsync();

        // Check if the camera is using the front camera
        if (cameraType === Camera.Constants.Type.front) {
          // Apply horizontal flip to the captured photo
          photo = await ImageManipulator.manipulateAsync(
            photo.uri,
            [{ flip: ImageManipulator.FlipType.Horizontal }],
            { format: ImageManipulator.SaveFormat.JPEG, compress: 1 }
          );
        }

        setCapturedMedia(photo);
      } catch (error) {
        console.error("Error capturing photo:", error);
      }
    }
  };

  const handleBackButton = () => {
    navigation.goBack();
  };

  const handleCancel = () => {
    setCapturedMedia(null);
  };

  const handleSubmission = async () => {
    try {
      const currentUser = auth.currentUser;
      const userId = currentUser.uid;

      const expirationTime = Date.now() + 24 * 60 * 60 * 1000;

      // Generate a unique filename for the image
      const imageFileName = `${userId}_${Date.now()}.jpg`;

      // Create a storage reference for the image file
      const imageRef = storage.ref().child(imageFileName);

      // Convert the capturedMedia to a Blob object
      const response = await fetch(capturedMedia.uri);
      const blob = await response.blob();

      // Upload the image file to Firebase Storage
      await imageRef.put(blob);

      // Get the download URL of the uploaded image
      const downloadURL = await imageRef.getDownloadURL();

      const storyDocRef = firestore.collection("sharedStories").doc(userId);

      await storyDocRef.set({
        story: downloadURL,
        expirationTime: expirationTime,
      });

      setCapturedMedia(null);

      navigation.navigate("MatchList");
    } catch (error) {
      console.error("Error submitting the captured media:", error);
    }
  };

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      {capturedMedia ? (
        <>
          {/* Display captured media */}
          <View style={styles.previewContainer}>
            {capturedMedia?.uri && (
              <Image
                source={{ uri: capturedMedia.uri }}
                style={styles.previewImage}
              />
            )}
            {capturedMedia?.uri && (
              <TouchableOpacity
                style={styles.retakeButton}
                onPress={handleCancel}
              >
                <Text style={styles.buttonText}>Retake</Text>
              </TouchableOpacity>
            )}
            {capturedMedia?.uri && (
              <TouchableOpacity
                style={styles.button}
                onPress={handleSubmission}
              >
                <Text style={styles.buttonText}>Submit</Text>
              </TouchableOpacity>
            )}
          </View>
          {/* Back button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackButton}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
        </>
      ) : (
        <>
          {/* Render camera view */}
          <Camera
            style={styles.camera}
            type={cameraType}
            ref={cameraRef}
            flashMode={flashMode}
          >
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.flipButton}
                onPress={handleCameraTypeToggle}
              >
                <Text style={styles.buttonText}>Flip</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.captureButton}
                onPress={handleCapturePhoto}
              ></TouchableOpacity>
              <TouchableOpacity
                style={styles.flashButton}
                onPress={handleToggleFlash}
              >
                <Ionicons
                  name={
                    flashMode === Camera.Constants.FlashMode.off
                      ? "flash-off"
                      : "flash"
                  }
                  size={24}
                  color="white"
                />
              </TouchableOpacity>
            </View>
          </Camera>
          {/* Back button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackButton}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    backgroundColor: "transparent",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
  },
  flipButton: {
    backgroundColor: "black",
    position: "absolute",
    bottom: 50,
    left: 40,
    padding: 12, // Adjust this value to increase the button size
    borderRadius: 8,
    shadowColor: "lightblue",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  button: {
    position: "absolute",
    bottom: 80, // Adjust this value to bring the button up
    right: 40, // Adjust this value to move the button towards the right
    zIndex: 1,
    alignSelf: "flex-end",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "black",
    borderRadius: 8,
    shadowColor: "lightblue",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
    // ...
  },
  recordButton: {
    position: "absolute",
    bottom: 53, // Adjust this value to position the button vertically
    right: 60, // Adjust this value to move the button towards the right
    zIndex: 1,
    alignSelf: "flex-end",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "black",
    borderRadius: 8,
    shadowColor: "lightblue",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
    // ...
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#fff",
    position: "absolute",
    bottom: 40, // Adjust this value to position the button vertically
    left: "50%", // Center the button horizontally
    marginLeft: -35, // Adjust this value to offset the button's position horizontally
    borderWidth: 5,
    borderColor: "#ddd",
  },
  buttonText: {
    fontSize: 18,
    color: "#fff",
  },
  previewContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  retakeButton: {
    position: "absolute",
    top: 160,
    right: 40,
    zIndex: 1,
    alignSelf: "flex-end",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "black",
    borderRadius: 8,
    shadowColor: "lightblue",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    position: "absolute",
    top: 160,
    left: 40,
    zIndex: 1,
    alignSelf: "flex-start", // Align to the left
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "black",
    borderRadius: 8,
    shadowColor: "lightblue",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  flashButton: {
    position: "absolute",
    top: 160,
    left: "50%",
    zIndex: 1,
    fontSize: 24,
    padding: 10,
    backgroundColor: "black",
    borderRadius: 8,
    shadowColor: "lightblue",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default StoryScreen;
