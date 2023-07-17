import React, { useState, useEffect } from "react";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/storage";
import "firebase/compat/database";
import {
  Alert,
  TouchableOpacity,
  Text,
  TextInput,
  View,
  ScrollView,
  Image,
  StyleSheet,
  Modal,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { firestore } from "../firebase";
import Header from "../navigation/Header";

const ProfileView = () => {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [image, setImage] = useState("");
  const [storyImage, setStoryImage] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);

  // Get the navigation prop from the stack navigator that wraps the ProfileView screen
  const navigation = useNavigation();

  useEffect(() => {
    const user = firebase.auth().currentUser;
    const profileRef = firestore.collection("users").doc(user.uid);

    const handleData = (snapshot) => {
      const data = snapshot.data();
      setName(data.name);
      setAge(data.age);
      setImage(data.photoURL.uri);
      setStoryImage(data.story);
    };

    profileRef
      .get()
      .then(handleData)
      .catch((error) => console.log(error));

    return () => {
      // Clean up the listener
      profileRef.onSnapshot(() => {});
    };
  }, []);

  // Navigate to MatchList screen when Matches button is pressed
  const handleEditButtonPress = () => {
    navigation.navigate("Edit");
  };

  const handleLeftButtonPress = () => {
    navigation.navigate("Edit");
  };

  const handleMiddleButtonPress = () => {
    navigation.navigate("MatchList");
  };

  const handleRightButtonPress = () => {
    navigation.navigate("Inbox");
  };

  const handleImagePress = (imageUri) => {
    setZoomedImage(imageUri);
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Header
        handleLeft={handleLeftButtonPress}
        handleMiddle={handleMiddleButtonPress}
        handleRight={handleRightButtonPress}
      />
      <View style={styles.profile}>
        {image ? (
          <TouchableOpacity onPress={() => handleImagePress(image)}>
            <Image source={{ uri: image }} style={styles.profileImage} />
          </TouchableOpacity>
        ) : null}
        {storyImage ? (
          <TouchableOpacity onPress={() => handleImagePress(storyImage)}>
            <Image source={{ uri: storyImage }} style={styles.storyImage} />
          </TouchableOpacity>
        ) : null}
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.age}>{age} years old</Text>
      </View>
      <TouchableOpacity
        style={styles.matchesButton}
        onPress={handleEditButtonPress}
      >
        <Text style={styles.matchesButtonText}>Edit Profile</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        onRequestClose={handleModalClose}
      >
        <TouchableOpacity
          style={styles.modalContainer}
          onPress={handleModalClose}
        >
          {zoomedImage && (
            <Image source={{ uri: zoomedImage }} style={styles.zoomedImage} />
          )}
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
};

const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "black",
  },
  profile: {
    alignItems: "center",
    marginBottom: 16,
  },
  profileImage: {
    width: 300,
    height: 300,
    borderRadius: 50,
    marginBottom: 8,
  },
  storyImage: {
    width: 300,
    height: 300,
    borderRadius: 40,
    marginBottom: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
    color: "white",
  },
  age: {
    fontSize: 18,
    color: "gray",
    color: "white",
  },
  matchesButton: {
    backgroundColor: "blue",
    padding: 16,
    alignItems: "center",
    borderRadius: 8,
    marginBottom: 32,
  },
  matchesButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.9)",
  },
  zoomedImage: {
    width: windowWidth * 0.8,
    height: windowHeight * 0.8,
    resizeMode: "contain",
  },
});

export default ProfileView;
