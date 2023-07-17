import React, { useState, useEffect } from "react";
import firebase from "firebase/compat/app";
import { auth, firestore } from "../firebase";
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
} from "react-native";
import * as Location from "expo-location";
import * as FileSystem from "expo-file-system";
import { v4 as uuidv4 } from "uuid";
import * as ImagePicker from "expo-image-picker";
import { doc, setDoc } from "@firebase/firestore";
import { database } from "../firebase";
import Header from "../navigation/Header";
import { Picker } from "@react-native-picker/picker";

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
  const [textColor, setTextColor] = useState("");
  const [uploading, setUploading] = useState(false);
  const [userLatitude, setUserLatitude] = useState(null);
  const [userLongitude, setUserLongitude] = useState(null);

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

    if (!result.cancelled) {
      // Use the "assets" array to access the selected image(s)
      const { assets } = result;
      const selectedImage = assets.length > 0 ? assets[0].uri : null;

      const source = selectedImage ? { uri: selectedImage } : null;
      console.log(source);
      setImage(source);
    }
  };

  const handleCreateProfile = async () => {
    console.log("handleCreateProfile");
    const user = firebase.auth().currentUser;
    const userRef = firestore.collection("users").doc(user.uid);
    const attractionsSurveyRef = userRef.collection("attractionsSurvey");

    // Update the data in the users document
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
        photoURL: image,
      },
      { merge: true } // Merge the new data with the existing document
    );

    // Check if attractions survey document already exists
    const attractionsSurveySnapshot = await attractionsSurveyRef.limit(1).get();
    if (!attractionsSurveySnapshot.empty) {
      // Update the existing attractions survey document
      const attractionsSurveyDoc = attractionsSurveySnapshot.docs[0];
      await attractionsSurveyDoc.ref.update({
        name: name,
        age: age,
        gender: gender,
        genderLookingFor: genderLookingFor,
        minAgeLookingFor: minAgeLookingFor,
        maxAgeLookingFor: maxAgeLookingFor,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        photoURL: image,
        matches: [],
      });
    } else {
      // Create a new attractions survey document
      await attractionsSurveyRef.doc(user.uid).set({
        id: user.uid,
        name: name,
        age: age,
        gender: gender,
        genderLookingFor: genderLookingFor,
        minAgeLookingFor: minAgeLookingFor,
        maxAgeLookingFor: maxAgeLookingFor,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        photoURL: image,
        matches: [],
      });
    }

    console.log("Data has been stored to Firestore!");

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
              <Text style={styles.buttonText}>Select Profile Picture</Text>
            </TouchableOpacity>
            {image ? (
              <Image
                source={{ uri: image.uri }}
                style={{
                  width: 200,
                  height: 200,
                  marginTop: 20,
                  borderColor: "lightblue",
                  borderWidth: 2,
                  alignSelf: "center",
                }}
              />
            ) : null}
          </View>
        </View>
        <TouchableOpacity
          style={styles.createProfileButton}
          onPress={handleCreateProfile}
        >
          <Text style={styles.createProfileButtonText}>Update Profile</Text>
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
  const [image, setImage] = useState(null);
  const [textColor, setTextColor] = useState("");
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.cancelled) {
      // Use the "assets" array to access the selected image(s)
      const { assets } = result;
      const selectedImage = assets.length > 0 ? assets[0].uri : null;

      const source = selectedImage ? { uri: selectedImage } : null;
      console.log(source);
      setImage(source);
    }
  };

  const handleCreateFriendProfile = async () => {
    console.log("handleCreateFriendProfile");
    const user = firebase.auth().currentUser;
    const userRef = firestore.collection("users").doc(user.uid);
    const friendsSurveyRef = userRef.collection("friendsSurvey");

    // Update the data in the users document
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
        photoURL: image,
      },
      { merge: true } // Merge the new data with the existing document
    );

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
        photoURL: image,
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
        photoURL: image,
        matches: [],
      });
    }

    console.log("Data has been stored to Firestore!");

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
              <Text style={styles.buttonText}>Select Profile Picture</Text>
            </TouchableOpacity>
            {image ? (
              <Image
                source={{ uri: image.uri }}
                style={{
                  width: 200,
                  height: 200,
                  marginTop: 20,
                  borderColor: "lightblue",
                  borderWidth: 2,
                  alignSelf: "center",
                }}
              />
            ) : null}
          </View>
        </View>
        <TouchableOpacity
          style={styles.createProfileButton}
          onPress={handleCreateFriendProfile}
        >
          <Text style={styles.createProfileButtonText}>Update Profile</Text>
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    paddingHorizontal: 28,
  },
  contentContainer: {
    flexGrow: 1,
    paddingVertical: 16,
  },
  inputContainer: {
    paddingHorizontal: 28,
    marginBottom: 28,
  },
  input: {
    backgroundColor: "black",
    borderRadius: 8,
    padding: 12,
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
    height: 180,
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
    padding: 12,
    alignItems: "center",
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: "lightblue",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  createProfileButtonText: {
    color: "lightblue",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default CreateProfile;