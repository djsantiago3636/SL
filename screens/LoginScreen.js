import {
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  Alert,
  ImageBackground,
  Image,
  Linking,
} from "react-native";
import React, { useEffect, useState } from "react";
import { TextInput } from "react-native-gesture-handler";
import { auth } from "../firebase";
import { useNavigation } from "@react-navigation/native";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [locationPermission, setLocationPermission] = useState(null);
  const [cameraRollPermission, setCameraRollPermission] = useState(null);
  const [cameraPermission, setCameraPermission] = useState(null);

  const navigation = useNavigation();

  useEffect(() => {
    getLocationPermission();
    getCameraRollPermission();
    getCameraPermission();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        navigation.navigate("Edit");
      }
    });
    return unsubscribe;
  }, []);

  const getLocationPermission = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    setLocationPermission(status === "granted");
  };

  const getCameraRollPermission = async () => {
    let { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    setCameraRollPermission(status === "granted");
  };

  const getCameraPermission = async () => {
    let { status } = await ImagePicker.requestCameraPermissionsAsync();
    setCameraPermission(status === "granted");
  };

  const handleSignUp = () => {
    auth
      .createUserWithEmailAndPassword(email, password)
      .then((userCredentials) => {
        const user = userCredentials.user;
        console.log("Registered in with", user.email);
        navigation.navigate("Edit");
      })
      .catch((error) => alert(error.message));
  };

  const handleLogin = () => {
    auth
      .signInWithEmailAndPassword(email, password)
      .then((userCredentials) => {
        const user = userCredentials.user;
        console.log("Logged in with", user.email);
        navigation.navigate("MatchList");
      })
      .catch((error) => alert(error.message));
  };

  const handleForgotPassword = () => {
    auth
      .sendPasswordResetEmail(email)
      .then(() => {
        console.log("Password reset email sent successfully.");
        // Show a success message or navigate to a password reset confirmation screen
      })
      .catch((error) => {
        console.log("Error sending password reset email:", error);
        // Show an error message to the user
      });
  };

  const handleChooseProfilePic = async () => {
    if (cameraPermission && cameraRollPermission) {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.cancelled) {
        console.log("image picked", result.uri);
        // Upload the image to a server or save it to the device
      }
    } else {
      Alert.alert(
        "Permission required",
        "Please enable camera and camera roll access in order to select a profile picture.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Settings",
            onPress: () =>
              Platform.OS === "ios"
                ? Linking.openURL("app-settings:")
                : Linking.openSettings(),
          },
        ]
      );
    }
  };

  if (locationPermission === null) {
    return (
      <View style={styles.container}>
        <Text>Please allow location permission to use this app.</Text>
        <TouchableOpacity onPress={getLocationPermission}>
          <Text style={styles.buttonText}>Allow Location</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (locationPermission === false) {
    return (
      <View style={styles.container}>
        <Text>You need to enable location services to use this app.</Text>
      </View>
    );
  }

  return (
    <ImageBackground
      source={require("../assets/IMG-5973.jpg")}
      style={styles.imageBackground}
    >
      <View style={styles.header}>
        <Image
          source={require("../assets/SNEAKY-LINK-Main-Logo-No-Circle.png")}
          style={styles.headerImage}
        />
      </View>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : null}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={(text) => setEmail(text)}
            style={styles.input}
            placeholderTextColor="lightblue"
          />
          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={(text) => setPassword(text)}
            style={styles.input}
            placeholderTextColor="lightblue"
            secureTextEntry
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={handleLogin} style={styles.button}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSignUp}
            style={[styles.button, styles.buttonOutline]}
          >
            <Text style={styles.buttonOutlineText}>Register</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleForgotPassword}>
          <Text style={styles.forgotPasswordLink}>Forgot Password?</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  imageBackground: {
    flex: 1,
    resizeMode: "cover",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    height: 200,
    marginTop: 120,
    marginBottom: 20,
    marginLeft: 40,
  },
  headerImage: {
    width: 900,
    height: 500,
    resizeMode: "contain",
  },
  container: {
    flex: 1,
    justifyContent: "flex-end", // changed to "flex-end"
    paddingHorizontal: 20,
    marginBottom: 110, // added marginBottom to give space for the inputs/buttons
  },
  inputContainer: {
    marginBottom: 40,
  },
  input: {
    backgroundColor: "black",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 5,
    marginBottom: 40,
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
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "black",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
    shadowColor: "lightblue",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: "lightblue",
    textAlign: "center",
  },
  buttonOutline: {
    backgroundColor: "black",
    borderWidth: 1,
    borderColor: "black",
  },
  buttonOutlineText: {
    color: "lightblue",
    textAlign: "center",
  },
  forgotPasswordLink: {
    color: "lightblue",
    textAlign: "center",
    marginTop: 20,
  },
});

export default LoginScreen;
