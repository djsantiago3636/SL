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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { firestore } from "../firebase";

const generateId = (userId1, userId2) => {
  // Combine the two user IDs in a specific format
  return `${userId1}_${userId2}`;
};

const RequestDetailScreen = ({ route }) => {
  const { requestId, sentRequestId } = route.params;
  const user = firebase.auth().currentUser;
  const navigation = useNavigation();
  const [userPhotoURL, setUserPhotoURL] = useState(null);
  const [matchPhotoURL, setMatchPhotoURL] = useState(null);

  const handleAccept = async () => {
    try {
      const requestSnapshot = await firestore
        .collection("users")
        .doc(user.uid)
        .collection("requests")
        .doc(requestId)
        .get();

      if (requestSnapshot.exists) {
        const requestData = requestSnapshot.data();
        const senderId = requestData.senderId;
        const senderName = requestData.senderName;
        const userPhotoURL = requestData.userPhotoURL;

        if (senderId === user.uid) {
          console.error("You cannot accept your own request");
          return;
        }

        const userAcceptedRef = firestore
          .collection("users")
          .doc(user.uid)
          .collection("acceptedRequests")
          .doc(requestId);

        // Ensure userPhotoURL is defined before setting it in the document
        const acceptedUserPhotoURL = userPhotoURL || "";

        // Create the accepted request document for the receiver
        await userAcceptedRef.set({
          requestId: requestId,
          senderId: senderId,
          senderName: senderName,
          userPhotoURL: acceptedUserPhotoURL,
          acceptedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });

        const matchId = generateId(user.uid, senderId);

        const matchAcceptedRef = firestore
          .collection("matchAccepted")
          .doc(matchId);

        // Create the accepted request document for the match
        await matchAcceptedRef.set({
          requestId: requestId,
          senderId: senderId,
          senderName: senderName,
          userPhotoURL: acceptedUserPhotoURL,
          receiverId: user.uid,
          receiverName: user.displayName,
          matchPhotoURL: null,
          acceptedAt: firebase.firestore.FieldValue.serverTimestamp(),
          usersMatched: [user.uid, senderId], // Include the usersMatched field with both users' IDs
          userData: requestData, // Include all user data
        });

        // Delete the accepted request document from the receiver's requests collection
        await firestore
          .collection("users")
          .doc(user.uid)
          .collection("requests")
          .doc(requestId)
          .delete();
      } else {
        console.error("Request snapshot does not exist");
        // Handle the case where the request snapshot is missing
      }

      // Handle the success, such as displaying a success message or updating the UI
    } catch (error) {
      console.error("Error accepting request:", error);
      // Handle the error appropriately, such as displaying an error message
    }
  };

  const handleDeny = async () => {
    try {
      const requestSnapshot = await firestore
        .collection("users")
        .doc(user.uid)
        .collection("requests")
        .doc(requestId)
        .get();

      if (requestSnapshot.exists) {
        const requestData = requestSnapshot.data();
        const senderId = requestData.senderId;

        if (senderId === user.uid) {
          console.error("You cannot deny your own request");
          return;
        }

        const userDeniedRef = firestore
          .collection("users")
          .doc(user.uid)
          .collection("deniedRequests")
          .doc(requestId);

        // Ensure userPhotoURL is defined before setting it in the document
        const deniedUserPhotoURL = requestData.userPhotoURL || "";

        // Create the denied request document for the user
        await userDeniedRef.set({
          requestId: requestId,
          senderId: senderId,
          deniedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });

        const matchId = generateId(user.uid, senderId);

        const matchDeniedRef = firestore.collection("matchDenied").doc(matchId);

        // Create the denied request document for the match
        await matchDeniedRef.set({
          requestId: requestId,
          senderId: senderId,
          senderName: requestData.senderName,
          userPhotoURL: deniedUserPhotoURL,
          receiverId: user.uid,
          receiverName: user.displayName,
          deniedAt: firebase.firestore.FieldValue.serverTimestamp(),
          usersMatched: [user.uid, senderId], // Include the usersMatched field with both users' IDs
          userData: requestData, // Include all user data
        });

        // Delete the denied request document from the receiver's requests collection
        await firestore
          .collection("users")
          .doc(user.uid)
          .collection("requests")
          .doc(requestId)
          .delete();
      } else {
        console.error("Request snapshot does not exist");
        // Handle the case where the request snapshot is missing
      }

      // Handle the success, such as displaying a success message or updating the UI
    } catch (error) {
      console.error("Error denying request:", error);
      // Handle the error appropriately, such as displaying an error message
    }
  };

  useEffect(() => {
    const fetchRequestData = async () => {
      try {
        // Get the Firestore document references for the request and sentRequest
        const requestRef = firestore
          .collection("users")
          .doc(user.uid)
          .collection("requests")
          .doc(requestId);
        const sentRequestRef = firestore
          .collection("users")
          .doc(user.uid)
          .collection("sentRequests")
          .doc(sentRequestId);

        // Fetch the user's photoURL from the request document
        const requestSnapshot = await requestRef.get();
        if (requestSnapshot.exists) {
          const requestData = requestSnapshot.data();
          const senderId = requestData.senderId;

          const userRef = firestore.collection("users").doc(senderId);
          const userSnapshot = await userRef.get();

          if (userSnapshot.exists) {
            const userData = userSnapshot.data();
            const userPhotoURL = userData.photoURL;
            setUserPhotoURL(userPhotoURL);
          }
        }

        // Fetch the match's photoURL from the sentRequest document
        const sentRequestSnapshot = await sentRequestRef.get();
        if (sentRequestSnapshot.exists) {
          const sentRequestData = sentRequestSnapshot.data();
          const matchPhotoURL = sentRequestData.matchPhotoURL;
          setMatchPhotoURL(matchPhotoURL);
        }
      } catch (error) {
        console.error("Error fetching request data:", error);
        // Handle the error appropriately
      }
    };

    fetchRequestData();
  }, [requestId, sentRequestId, user]);

  return (
    <View style={styles.container}>
      <Image
        source={userPhotoURL ? { uri: userPhotoURL.uri } : null}
        style={styles.profileImage}
      />
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => {
            handleAccept();
            navigation.navigate("Inbox");
          }}
        >
          <Text style={styles.buttonText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.denyButton}
          onPress={() => {
            handleDeny();
            navigation.navigate("Inbox");
          }}
        >
          <Text style={styles.buttonText}>Deny</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "black",
  },
  profileImage: {
    width: 300,
    height: 300,
    borderRadius: 100,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "80%",
  },
  acceptButton: {
    backgroundColor: "green",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  denyButton: {
    backgroundColor: "red",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default RequestDetailScreen;
