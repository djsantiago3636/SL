import React, { useState, useEffect } from "react";
import firebase from "firebase/compat/app";
import { auth, firestore, storage } from "../firebase";
import "firebase/compat/firestore";
import "firebase/compat/storage";
import "firebase/compat/database";
import { useNavigation } from "@react-navigation/native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import {
  Alert,
  TouchableOpacity,
  Text,
  TextInput,
  View,
  ScrollView,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  SafeAreaView,
} from "react-native";
import * as Location from "expo-location";
import * as FileSystem from "expo-file-system";
import { v4 as uuidv4 } from "uuid";
import * as ImagePicker from "expo-image-picker";
import { doc, setDoc } from "@firebase/firestore";
import { database } from "../firebase";
import Header from "../navigation/Header";
import { Picker } from "@react-native-picker/picker";
import "react-native-get-random-values";

const Tab = createMaterialTopTabNavigator();

const AttractionsTab = () => {
  const navigation = useNavigation();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [genderLookingFor, setGenderLookingFor] = useState("");
  const [minAgeLookingFor, setMinAgeLookingFor] = useState("");
  const [maxAgeLookingFor, setMaxAgeLookingFor] = useState("");
  const [image, setImage] = useState(null);
  const [image2, setImage2] = useState(null);
  const [image3, setImage3] = useState(null);
  const [textColor, setTextColor] = useState("");
  const [uploading, setUploading] = useState(false);
  const [userLatitude, setUserLatitude] = useState(null);
  const [userLongitude, setUserLongitude] = useState(null);
  const [attractionsDocumentCreated, setAttractionsDocumentCreated] =
    useState(false); // Flag to track if the users document has been created

  useEffect(() => {
    updateCurrentUserLocation();
  }, []);

  const updateCurrentUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        console.log("Permission to access location was denied.");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      setUserLatitude(latitude);
      setUserLongitude(longitude);
    } catch (error) {
      console.error("Error updating user location:", error);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      // Use the "assets" array to access the selected image(s)
      const { assets } = result;
      const selectedImage = assets.length > 0 ? assets[0].uri : null;

      const source = selectedImage ? { uri: selectedImage } : null;
      console.log(source);
      setImage(source);
    }
  };

  const pickImage2 = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      // Use the "assets" array to access the selected image(s)
      const { assets } = result;
      const selectedImage = assets.length > 0 ? assets[0].uri : null;

      const source = selectedImage ? { uri: selectedImage } : null;
      setImage2(source);
    }
  };

  const pickImage3 = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      // Use the "assets" array to access the selected image(s)
      const { assets } = result;
      const selectedImage = assets.length > 0 ? assets[0].uri : null;

      const source = selectedImage ? { uri: selectedImage } : null;
      setImage3(source);
    }
  };

  const handleCreateProfile = async () => {
    console.log("handleCreateProfile");
    const user = firebase.auth().currentUser;
    const userRef = firestore.collection("users").doc(user.uid);
    const attractionsSurveyRef = userRef.collection("attractionsSurvey");
    const attractionsSurveySeparateRef = firestore
      .collection("attractionsSurvey")
      .doc(user.uid);

    try {
      // Set uploading flag to true
      setUploading(true);

      const uploadImage = async (image) => {
        if (!image) return null;

        // Generate a unique filename for the image
        const imageFileName = `${uuidv4()}.jpg`;

        // Create a storage reference for the image file
        const imageRef = storage.ref().child(imageFileName);

        // Upload the image file to Firebase Storage
        const response = await fetch(image.uri);
        const blob = await response.blob();
        await imageRef.put(blob);

        // Get the download URL of the uploaded image
        return imageRef.getDownloadURL();
      };

      // Upload all three images and get their download URLs
      const [downloadURL, downloadURL2, downloadURL3] = await Promise.all([
        uploadImage(image),
        uploadImage(image2),
        uploadImage(image3),
      ]);

      // Combine the download URLs into an array
      const photoURLs = [downloadURL, downloadURL2, downloadURL3].filter(
        (url) => url !== null
      );

      if (!attractionsDocumentCreated) {
        // Update the data in the users document only if it doesn't exist
        await userRef.set(
          {
            id: user.uid,
            name: name,
            age: age,
            gender: gender,
            genderLookingFor: genderLookingFor,
            minAgeLookingFor: minAgeLookingFor,
            maxAgeLookingFor: maxAgeLookingFor,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            photoURL: photoURLs,
          },
          { merge: false } // Do not merge the new data with the existing document
        );

        setAttractionsDocumentCreated(true); // Set the flag to true after creating the users document
      }

      // Check if attractions survey document already exists in the "users" collection
      const attractionsSurveySnapshot = await attractionsSurveyRef
        .limit(1)
        .get();

      if (!attractionsSurveySnapshot.empty) {
        // Update the existing attractions survey document in the "users" collection
        const attractionsSurveyDoc = attractionsSurveySnapshot.docs[0];
        await attractionsSurveyDoc.ref.update({
          name: name,
          age: age,
          gender: gender,
          genderLookingFor: genderLookingFor,
          minAgeLookingFor: minAgeLookingFor,
          maxAgeLookingFor: maxAgeLookingFor,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          photoURL: photoURLs,
          matches: [],
        });
      } else {
        // Create a new attractions survey document in the "users" collection
        await attractionsSurveyRef.doc(user.uid).set({
          id: user.uid,
          name: name,
          age: age,
          gender: gender,
          genderLookingFor: genderLookingFor,
          minAgeLookingFor: minAgeLookingFor,
          maxAgeLookingFor: maxAgeLookingFor,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          photoURL: photoURLs,
          matches: [],
        });
      }

      // Check if attractions survey document already exists in the separate "attractionsSurvey" collection
      const attractionsSurveySeparateSnapshot =
        await attractionsSurveySeparateRef.get();

      if (attractionsSurveySeparateSnapshot.exists) {
        // Update the existing attractions survey document in the separate "attractionsSurvey" collection
        await attractionsSurveySeparateRef.update({
          name: name,
          age: age,
          gender: gender,
          genderLookingFor: genderLookingFor,
          minAgeLookingFor: minAgeLookingFor,
          maxAgeLookingFor: maxAgeLookingFor,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          photoURL: photoURLs,
          matches: [],
        });
      } else {
        // Create a new attractions survey document in the separate "attractionsSurvey" collection
        await attractionsSurveySeparateRef.set({
          id: user.uid,
          name: name,
          age: age,
          gender: gender,
          genderLookingFor: genderLookingFor,
          minAgeLookingFor: minAgeLookingFor,
          maxAgeLookingFor: maxAgeLookingFor,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          photoURL: photoURLs,
          matches: [],
        });
      }

      console.log("Data has been stored to Firestore!");
    } catch (error) {
      console.error("Error creating profile:", error);
      Alert.alert("Error", "Failed to create profile. Please try again.");
    } finally {
      // Set uploading flag to false after everything is done
      setUploading(false);
    }

    navigation.navigate("MatchList");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : null}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <ScrollView
        contentContainerStyle={[
          styles.contentContainer,
          { backgroundColor: "black" },
        ]}
      >
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Name"
            placeholderTextColor="lightblue"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />
          <TextInput
            placeholder="Age"
            placeholderTextColor="lightblue"
            value={age}
            onChangeText={setAge}
            style={styles.input}
            keyboardType="numeric"
            maxLength={2}
          />
          <Picker
            selectedValue={gender}
            onValueChange={(itemValue) => setGender(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Select Gender" value="" />
            <Picker.Item label="Male" value="male" />
            <Picker.Item label="Female" value="female" />
            <Picker.Item label="Other" value="other" />
          </Picker>
          <Picker
            selectedValue={genderLookingFor}
            onValueChange={(itemValue) => setGenderLookingFor(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Select Gender Looking For" value="" />
            <Picker.Item label="Male" value="male" />
            <Picker.Item label="Female" value="female" />
            <Picker.Item label="Other" value="other" />
            <Picker.Item label="Any" value="any" />
          </Picker>
          <TextInput
            placeholder="Minimum Age Looking For"
            placeholderTextColor="lightblue"
            value={minAgeLookingFor}
            onChangeText={setMinAgeLookingFor}
            style={styles.input}
            keyboardType="numeric"
            maxLength={2}
          />
          <TextInput
            placeholder="Maximum Age Looking For"
            placeholderTextColor="lightblue"
            value={maxAgeLookingFor}
            onChangeText={setMaxAgeLookingFor}
            style={styles.input}
            keyboardType="numeric"
            maxLength={2}
          />
          <View style={styles.fileContainer}>
            <TouchableOpacity onPress={pickImage}>
              <Text style={styles.buttonText}>Main Profile Pic</Text>
            </TouchableOpacity>
            {image ? (
              <Image source={{ uri: image.uri }} style={styles.profileImage} />
            ) : null}
          </View>
          <View style={styles.fileContainer}>
            <TouchableOpacity onPress={pickImage2}>
              <Text style={styles.buttonText}>Profile Pic 2</Text>
            </TouchableOpacity>
            {image2 ? (
              <Image source={{ uri: image2.uri }} style={styles.profileImage} />
            ) : null}
          </View>
          <View style={styles.fileContainer}>
            <TouchableOpacity onPress={pickImage3}>
              <Text style={styles.buttonText}>Profile Pic 3</Text>
            </TouchableOpacity>
            {image3 ? (
              <Image source={{ uri: image3.uri }} style={styles.profileImage} />
            ) : null}
          </View>
        </View>
        <TouchableOpacity
          style={styles.createProfileButton}
          onPress={handleCreateProfile}
          disabled={uploading}
        >
          {uploading ? (
            <Text style={styles.createProfileButtonText}>Uploading...</Text>
          ) : (
            <Text style={styles.createProfileButtonText}>Update Profile</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const FriendsTab = () => {
  const navigation = useNavigation();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [genderLookingFor, setGenderLookingFor] = useState("");
  const [minAgeLookingFor, setMinAgeLookingFor] = useState("");
  const [maxAgeLookingFor, setMaxAgeLookingFor] = useState("");
  const [image4, setImage4] = useState(null);
  const [image5, setImage5] = useState(null);
  const [image6, setImage6] = useState(null);
  const [textColor, setTextColor] = useState("");
  const [uploading, setUploading] = useState(false);
  const [friendsDocumentCreated, setFriendsDocumentCreated] = useState(false); // Flag to track if the users document has been created

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      // Use the "assets" array to access the selected image(s)
      const { assets } = result;
      const selectedImage = assets.length > 0 ? assets[0].uri : null;

      const source = selectedImage ? { uri: selectedImage } : null;
      console.log(source);
      setImage4(source);
    }
  };

  const pickImage2 = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      // Use the "assets" array to access the selected image(s)
      const { assets } = result;
      const selectedImage = assets.length > 0 ? assets[0].uri : null;

      const source = selectedImage ? { uri: selectedImage } : null;
      setImage5(source);
    }
  };

  const pickImage3 = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      // Use the "assets" array to access the selected image(s)
      const { assets } = result;
      const selectedImage = assets.length > 0 ? assets[0].uri : null;

      const source = selectedImage ? { uri: selectedImage } : null;
      setImage6(source);
    }
  };

  const handleCreateFriendProfile = async () => {
    console.log("handleCreateFriendProfile");
    const user = firebase.auth().currentUser;
    const userRef = firestore.collection("users").doc(user.uid);
    const friendsSurveyRef = userRef.collection("friendsSurvey");
    const friendsSurveySeparateRef = firestore
      .collection("friendsSurvey")
      .doc(user.uid);

    // Generate a unique filename for the image
    const imageFileName = `${uuidv4()}.jpg`;

    // Create a storage reference for the image file
    const imageRef = storage.ref().child(imageFileName);

    try {
      // Set uploading flag to true
      setUploading(true);

      const uploadImage = async (image) => {
        if (!image) return null;

        // Generate a unique filename for the image
        const imageFileName = `${uuidv4()}.jpg`;

        // Create a storage reference for the image file
        const imageRef = storage.ref().child(imageFileName);

        // Upload the image file to Firebase Storage
        const response = await fetch(image.uri);
        const blob = await response.blob();
        await imageRef.put(blob);

        // Get the download URL of the uploaded image
        return imageRef.getDownloadURL();
      };

      // Upload all three images and get their download URLs
      const [downloadURL, downloadURL2, downloadURL3] = await Promise.all([
        uploadImage(image4),
        uploadImage(image5),
        uploadImage(image6),
      ]);

      // Combine the download URLs into an array
      const photoURLs = [downloadURL, downloadURL2, downloadURL3].filter(
        (url) => url !== null
      );

      if (!friendsDocumentCreated) {
        // Update the data in the users document only if it doesn't exist
        await userRef.set(
          {
            id: user.uid,
            name: name,
            age: age,
            gender: gender,
            genderLookingFor: genderLookingFor,
            minAgeLookingFor: minAgeLookingFor,
            maxAgeLookingFor: maxAgeLookingFor,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            photoURL: photoURLs,
          },
          { merge: false } // Do not merge the new data with the existing document
        );

        setFriendsDocumentCreated(true); // Set the flag to true after creating the users document
      }

      // Check if friends survey document already exists
      const friendsSurveySnapshot = await friendsSurveyRef.limit(1).get();

      if (!friendsSurveySnapshot.empty) {
        // Update the existing friends survey document
        const friendsSurveyDoc = friendsSurveySnapshot.docs[0];
        await friendsSurveyDoc.ref.update({
          name: name,
          age: age,
          gender: gender,
          genderLookingFor: genderLookingFor,
          minAgeLookingFor: minAgeLookingFor,
          maxAgeLookingFor: maxAgeLookingFor,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          photoURL: photoURLs,
          matches: [],
        });
      } else {
        // Create a new friends survey document
        await friendsSurveyRef.doc(user.uid).set({
          id: user.uid,
          name: name,
          age: age,
          gender: gender,
          genderLookingFor: genderLookingFor,
          minAgeLookingFor: minAgeLookingFor,
          maxAgeLookingFor: maxAgeLookingFor,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          photoURL: photoURLs,
          matches: [],
        });
      }

      const friendsSurveySeparateSnapshot =
        await friendsSurveySeparateRef.get();

      if (friendsSurveySeparateSnapshot.exists) {
        // Update the existing attractions survey document in the separate "attractionsSurvey" collection
        await friendsSurveySeparateRef.update({
          name: name,
          age: age,
          gender: gender,
          genderLookingFor: genderLookingFor,
          minAgeLookingFor: minAgeLookingFor,
          maxAgeLookingFor: maxAgeLookingFor,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          photoURL: photoURLs,
          matches: [],
        });
      } else {
        // Create a new attractions survey document in the separate "attractionsSurvey" collection
        await friendsSurveySeparateRef.set({
          id: user.uid,
          name: name,
          age: age,
          gender: gender,
          genderLookingFor: genderLookingFor,
          minAgeLookingFor: minAgeLookingFor,
          maxAgeLookingFor: maxAgeLookingFor,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          photoURL: photoURLs,
          matches: [],
        });
      }

      console.log("Data has been stored to Firestore!");
    } catch (error) {
      console.error("Error creating profile:", error);
      Alert.alert("Error", "Failed to create profile. Please try again.");
    } finally {
      setUploading(false);
    }

    navigation.navigate("MatchList");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : null}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <ScrollView
        contentContainerStyle={[
          styles.contentContainer,
          { backgroundColor: "black" },
        ]}
      >
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Name"
            placeholderTextColor="lightblue"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />
          <TextInput
            placeholder="Age"
            placeholderTextColor="lightblue"
            value={age}
            onChangeText={setAge}
            style={styles.input}
            keyboardType="numeric"
            maxLength={2}
          />
          <Picker
            selectedValue={gender}
            onValueChange={(itemValue) => setGender(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Select Gender" value="" />
            <Picker.Item label="Male" value="male" />
            <Picker.Item label="Female" value="female" />
            <Picker.Item label="Other" value="other" />
          </Picker>
          <Picker
            selectedValue={genderLookingFor}
            onValueChange={(itemValue) => setGenderLookingFor(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Select Gender Looking For" value="" />
            <Picker.Item label="Male" value="male" />
            <Picker.Item label="Female" value="female" />
            <Picker.Item label="Other" value="other" />
            <Picker.Item label="Any" value="any" />
          </Picker>
          <TextInput
            placeholder="Minimum Age Looking For"
            placeholderTextColor="lightblue"
            value={minAgeLookingFor}
            onChangeText={setMinAgeLookingFor}
            style={styles.input}
            keyboardType="numeric"
            maxLength={2}
          />
          <TextInput
            placeholder="Maximum Age Looking For"
            placeholderTextColor="lightblue"
            value={maxAgeLookingFor}
            onChangeText={setMaxAgeLookingFor}
            style={styles.input}
            keyboardType="numeric"
            maxLength={2}
          />
          <View style={styles.fileContainer}>
            <TouchableOpacity onPress={pickImage}>
              <Text style={styles.buttonText}>Main Profile Pic</Text>
            </TouchableOpacity>
            {image4 ? (
              <Image source={{ uri: image4.uri }} style={styles.profileImage} />
            ) : null}
          </View>
          <View style={styles.fileContainer}>
            <TouchableOpacity onPress={pickImage2}>
              <Text style={styles.buttonText}>Profile Pic 2</Text>
            </TouchableOpacity>
            {image5 ? (
              <Image source={{ uri: image5.uri }} style={styles.profileImage} />
            ) : null}
          </View>
          <View style={styles.fileContainer}>
            <TouchableOpacity onPress={pickImage3}>
              <Text style={styles.buttonText}>Profile Pic 3</Text>
            </TouchableOpacity>
            {image6 ? (
              <Image source={{ uri: image6.uri }} style={styles.profileImage} />
            ) : null}
          </View>
        </View>
        <TouchableOpacity
          style={styles.createProfileButton}
          onPress={handleCreateFriendProfile}
          disabled={uploading}
        >
          {uploading ? (
            <Text style={styles.createProfileButtonText}>Uploading...</Text>
          ) : (
            <Text style={styles.createProfileButtonText}>Update Profile</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const CreateProfile = () => {
  const navigation = useNavigation();

  const handleLeftButtonPress = () => {
    navigation.navigate("Edit");
  };

  const handleMiddleButtonPress = () => {
    navigation.navigate("MatchList");
  };

  const handleRightButtonPress = () => {
    navigation.navigate("Inbox");
  };

  return (
    <View style={styles.container}>
      <Header
        handleLeft={handleLeftButtonPress}
        handleMiddle={handleMiddleButtonPress}
        handleRight={handleRightButtonPress}
      />
      <View style={{ flex: 1, backgroundColor: "black" }}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarStyle: {
              backgroundColor: "black",
            },
            tabBarLabelStyle: {
              color: "lightblue",
            },
          })}
        >
          <Tab.Screen name="Attractions" component={AttractionsTab} />
          <Tab.Screen name="Friends" component={FriendsTab} />
        </Tab.Navigator>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "black",
    paddingHorizontal: 28,
  },
  contentContainer: {
    flexGrow: 1,
    paddingVertical: 16,
    backgroundColor: "black",
  },
  inputContainer: {
    paddingHorizontal: 28,
    marginBottom: 12,
    backgroundColor: "black",
  },
  input: {
    backgroundColor: "black",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    color: "lightblue",
    shadowColor: "lightblue",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  picker: {
    backgroundColor: "lightblue",
    borderRadius: 8,
    marginBottom: 12,
    color: "black",
    height: 154,
  },
  fileContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "lightblue",
    fontSize: 16,
    fontWeight: "bold",
  },
  createProfileButton: {
    backgroundColor: "black",
    padding: 30,
    alignItems: "center",
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: "gold",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  createProfileButtonText: {
    color: "gold",
    fontSize: 16,
    fontWeight: "bold",
  },
  profileImage: {
    width: 200,
    height: 200,
    marginTop: 20,
    borderColor: "lightblue",
    borderWidth: 2,
    alignSelf: "center",
  },
});

export default CreateProfile;
