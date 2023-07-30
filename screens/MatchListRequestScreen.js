import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  ScrollView,
} from "react-native";
import { firestore } from "../firebase";
import { auth } from "../firebase";
import MatchList from "./MatchListScreen";
import firebase from "firebase/compat/app";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const MatchListRequestScreen = ({ route }) => {
  const { match } = route.params;
  const user = firebase.auth().currentUser;
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [storyImage, setStoryImage] = useState("");

  useEffect(() => {
    const fetchStoryImage = async () => {
      try {
        const userStoriesRef = firestore.collection("users").doc(match.id);
        const storyDoc = await userStoriesRef.get();
        if (storyDoc.exists) {
          const storyData = storyDoc.data();
          setStoryImage(storyData.story);
          console.log("Fetched story image:", storyData.story);
        }
      } catch (error) {
        console.error("Error fetching story image:", error);
      }
    };

    fetchStoryImage();
  }, [match.id]);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleRequest = async (receiverId) => {
    try {
      // Get the Firestore document references for the recipient and the current user
      const recipientRef = firestore.collection("users").doc(match.id);
      const userRef = firestore.collection("users").doc(user.uid);

      // Get the user and match data
      const getUserData = userRef.get().then((userSnapshot) => {
        if (userSnapshot.exists) {
          const userData = userSnapshot.data();
          return userData;
        }
        return null;
      });

      const getMatchData = recipientRef.get().then((matchSnapshot) => {
        if (matchSnapshot.exists) {
          const matchData = matchSnapshot.data();
          return matchData;
        }
        return null;
      });

      // Wait for both promises to resolve
      const [userData, matchData] = await Promise.all([
        getUserData,
        getMatchData,
      ]);

      // Create chat request documents for the recipient and the user
      const recipientRequestDoc = await recipientRef
        .collection("requests")
        .add({
          senderId: user.uid,
          senderName: userData.name,
          status: "received",
          userData: userData, // Include all user data
        });

      const userRequestDoc = await userRef.collection("sentRequests").add({
        receiverId: match.id,
        receiverName: matchData.name,
        status: "pending",
        matchData: matchData, // Include all match data
      });

      console.log("Chat request sent!");

      navigation.navigate("MatchList");

      // You can also perform additional actions here, such as displaying a success message or updating the UI
    } catch (error) {
      console.error("Error sending chat request:", error);
      // Handle the error appropriately, such as displaying an error message
    }
  };

  const handleImagePress = (imageUri) => {
    setZoomedImage(imageUri);
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
  };

  return (
    <>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="ios-arrow-back" size={24} color="black" />
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
        <ScrollView horizontal contentContainerStyle={styles.imageContainer}>
          {match.photoURL[0] ? (
            <TouchableOpacity
              onPress={() => handleImagePress(match.photoURL[0])}
            >
              <Image
                source={{ uri: match.photoURL[0] }}
                style={styles.profileImage}
              />
            </TouchableOpacity>
          ) : null}
          {match.photoURL[1] ? (
            <TouchableOpacity
              onPress={() => handleImagePress(match.photoURL[1])}
            >
              <Image
                source={{ uri: match.photoURL[1] }}
                style={styles.profileImage}
              />
            </TouchableOpacity>
          ) : null}
          {match.photoURL[2] ? (
            <TouchableOpacity
              onPress={() => handleImagePress(match.photoURL[2])}
            >
              <Image
                source={{ uri: match.photoURL[2] }}
                style={styles.profileImage}
              />
            </TouchableOpacity>
          ) : null}
        </ScrollView>
        {storyImage ? (
          <View style={styles.storyContainer}>
            <TouchableOpacity onPress={() => handleImagePress(storyImage)}>
              <View style={styles.centeredContainer}>
                <Image source={{ uri: storyImage }} style={styles.storyImage} />
              </View>
            </TouchableOpacity>
          </View>
        ) : null}
        <TouchableOpacity style={styles.requestButton} onPress={handleRequest}>
          <Text style={styles.requestButtonText}>Send Request</Text>
        </TouchableOpacity>
        {/* Add other profile details here */}
      </View>
      <Modal
        animationType="fade"
        transparent
        visible={modalVisible}
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
    </>
  );
};

const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "black",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 16,
    paddingTop: 80,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "black",
    backgroundColor: "black",
  },
  backButton: {
    marginRight: 8,
    backgroundColor: "lightblue",
    padding: 8,
    borderRadius: 8,
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
  imageContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  storyContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  requestButton: {
    backgroundColor: "black",
    padding: 12,
    alignItems: "center",
    borderRadius: 8,
    paddingVertical: 16, // Increase the height by adjusting the padding
    paddingHorizontal: 60,
    marginBottom: 80,
    shadowColor: "lightblue",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  requestButtonText: {
    color: "lightblue",
    fontSize: 24,
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

export default MatchListRequestScreen;
