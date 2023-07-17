import firebase from "firebase/compat/app";
import "firebase/compat/storage";
import * as ImagePicker from "expo-image-picker";

// Function to upload an image to Firebase Storage
export const uploadImage = async (uri, filename) => {
  const response = await fetch(uri);
  const blob = await response.blob();

  const storageRef = firebase.storage().ref();
  const imageRef = storageRef.child(`images/${filename}`);
  const snapshot = await imageRef.put(blob);

  const downloadUrl = await snapshot.ref.getDownloadURL();
  return downloadUrl;
};

// Function to open the device's image picker
export const pickImage = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    alert("Permission to access media library is required!");
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 1,
  });

  if (!result.canceled) {
    return result.uri;
  }
};

export const imageUtils = {
  uploadImage,
  pickImage,
};
