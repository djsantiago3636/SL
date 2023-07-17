import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import { onSnapshot } from "firebase/compat/firestore";
import { firestore } from "../firebase";
import Header from "../navigation/Header";
import * as Location from "expo-location";
import * as Permissions from "expo-permissions";
import * as Contacts from "expo-contacts";
import * as SMS from "expo-sms";

const Tab = createMaterialTopTabNavigator();

const AttractionsTab = () => {
  const [matches, setMatches] = useState([]);
  const [userLatitude, setUserLatitude] = useState(null);
  const [userLongitude, setUserLongitude] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
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

        // Update the user's location in the "users" document
        const currentUser = firebase.auth().currentUser;
        const userRef = firestore.collection("users").doc(currentUser.uid);
        await userRef.update({
          latitude: latitude,
          longitude: longitude,
        });

        // Update the user's location in the attractionsSurvey document
        const attractionsSurveyRef = userRef.collection("attractionsSurvey");
        const attractionsSurveySnapshot = await attractionsSurveyRef.get();

        // Update latitude and longitude in each attractionsSurvey document
        attractionsSurveySnapshot.docs.forEach(async (doc) => {
          const surveyDocRef = attractionsSurveyRef.doc(doc.id);
          await surveyDocRef.update({
            latitude: latitude,
            longitude: longitude,
          });
        });

        // Update the user's location in the friendsSurvey document
        const friendsSurveyRef = userRef.collection("friendsSurvey");
        const friendsSurveySnapshot = await friendsSurveyRef.get();

        // Update latitude and longitude in each friendsSurvey document
        friendsSurveySnapshot.docs.forEach(async (doc) => {
          const surveyDocRef = friendsSurveyRef.doc(doc.id);
          await surveyDocRef.update({
            latitude: latitude,
            longitude: longitude,
          });
        });

        fetchMatches();
      } catch (error) {
        console.error("Error updating user location:", error);
      }
    };

    updateCurrentUserLocation();
  }, []);

  const fetchMatches = async () => {
    try {
      const currentUser = firebase.auth().currentUser;
      const currentUserDoc = await firestore
        .collection("users")
        .doc(currentUser.uid)
        .get();
      const currentUserData = currentUserDoc.data();

      const currentUserAttractionsSurveyRef =
        currentUserDoc.ref.collection("attractionsSurvey");
      const currentUserAttractionsSnapshot =
        await currentUserAttractionsSurveyRef.get();
      const currentUserAttractionsData =
        currentUserAttractionsSnapshot.docs.map((doc) => doc.data());

      console.log("Attractions Survey Data:", currentUserAttractionsData);

      const usersSnapshot = await firestore.collection("users").get();
      console.log("Users Snapshot size:", usersSnapshot.size);

      const promises = usersSnapshot.docs.map(async (userDoc) => {
        const userId = userDoc.id;
        if (userId !== currentUser.uid) {
          const attractionsRef = userDoc.ref.collection("attractionsSurvey");
          const attractionsSnapshot = await attractionsRef.get();

          const acceptedRequestsRef =
            userDoc.ref.collection("acceptedRequests");
          const acceptedRequestsSnapshot = await acceptedRequestsRef.get();
          const acceptedRequestsData = acceptedRequestsSnapshot.docs.map(
            (doc) => doc.data()
          );

          const deniedRequestsRef = userDoc.ref.collection("deniedRequests");
          const deniedRequestsSnapshot = await deniedRequestsRef.get();
          const deniedRequestsData = deniedRequestsSnapshot.docs.map((doc) =>
            doc.data()
          );

          const sentRequestsRef = currentUserDoc.ref.collection("sentRequests");
          const sentRequestsSnapshot = await sentRequestsRef.get();
          const sentRequestsData = sentRequestsSnapshot.docs.map((doc) =>
            doc.data()
          );

          const requestsRef = currentUserDoc.ref.collection("requests");
          const requestsSnapshot = await requestsRef.get();
          const requestsData = requestsSnapshot.docs.map((doc) => doc.data());

          console.log("Accepted Requests Data:", acceptedRequestsData);
          console.log("Denied Requests Data:", deniedRequestsData);
          console.log("Sent Requests", sentRequestsData);
          console.log("Requests", requestsData);

          const userDataArray = attractionsSnapshot.docs.map(
            (attractionsDoc) => {
              const userData = attractionsDoc.data();

              // Check if the user has been denied by the current user
              const denied = deniedRequestsData.some(
                (deniedRequest) => deniedRequest.senderId === userId
              );

              // Check if the current user has already sent a request to the user
              const sentRequest = sentRequestsData.some(
                (sentRequests) => sentRequests.receiverId === userId
              );

              // Check if the user has requested the current user
              const requests = requestsData.some(
                (requests) => requests.senderId === userId
              );

              // Check if the user is in the acceptedRequests of the current user
              const inAcceptedRequests = acceptedRequestsData.some(
                (acceptedRequest) => acceptedRequest.senderId === userId
              );

              // Calculate the distance between the current user and the matched user
              const distance = calculateDistance(
                currentUserData.latitude,
                currentUserData.longitude,
                userData.latitude,
                userData.longitude
              );

              // Apply filtering conditions based on gender, age, request status, distance, and sent request
              if (
                userData.gender === currentUserData.genderLookingFor &&
                userData.age >= currentUserData.minAgeLookingFor &&
                userData.age <= currentUserData.maxAgeLookingFor &&
                !requests &&
                !denied &&
                !sentRequest &&
                !inAcceptedRequests &&
                distance <= 100 // Distance in meters
              ) {
                return { id: attractionsDoc.id, data: userData };
              }

              return null;
            }
          );

          return userDataArray.filter(Boolean); // Remove null entries
        }
        return []; // Return an empty array for the current user
      });

      const userDataArrays = await Promise.all(promises);
      const mergedDataArray = [].concat(...userDataArrays);
      console.log("Attractions Matches:", mergedDataArray);
      setMatches(mergedDataArray);
    } catch (error) {
      console.error("Error fetching matches:", error);
    }
  };

  // Function to calculate the distance between two sets of latitude and longitude coordinates using the Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180; // φ, λ in radians
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c; // Distance in meters
    return distance;
  };

  const handleInviteFriends = async () => {
    const { status } = await Permissions.askAsync(Permissions.CONTACTS);
    if (status === "granted") {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
      });
      if (data.length > 0) {
        const phoneNumbers = data.map((contact) => {
          const phoneNumber = contact.phoneNumbers[0]?.number;
          return phoneNumber.replace(/[\s()-]/g, ""); // Remove spaces, parentheses, and hyphens from phone number
        });
        const message = "Check out this awesome app!";
        SMS.sendSMSAsync(phoneNumbers, message);
      }
    } else {
      Linking.openSettings();
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.profilesContainer}>
      {matches.map((userMatch) => {
        return (
          <View key={userMatch.id} style={styles.profileContainer}>
            <Image
              source={{ uri: userMatch.data.photoURL.uri }}
              style={styles.profileImage}
            />
            <TouchableOpacity
              style={styles.requestButton}
              onPress={() => {
                navigation.navigate("MatchRequest", {
                  match: userMatch.data,
                });
              }}
            >
              <Text style={styles.requestButtonText}>Request Chat</Text>
            </TouchableOpacity>
          </View>
        );
      })}
      <View style={styles.inviteFriendsButtonContainer}>
        <TouchableOpacity
          style={styles.inviteFriendsButton}
          onPress={handleInviteFriends}
        >
          <Text style={styles.inviteFriendsButtonText}>Invite Friends</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const FriendsTab = () => {
  const [matches, setMatches] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const currentUser = firebase.auth().currentUser;
        const usersSnapshot = await firestore.collection("users").get();
        console.log("Users Snapshot size:", usersSnapshot.size);

        const promises = usersSnapshot.docs.map(async (userDoc) => {
          const userId = userDoc.id;
          if (userId !== currentUser.uid) {
            const friendsRef = userDoc.ref.collection("friendsSurvey");
            const friendsSnapshot = await friendsRef.get();

            const userDataArray = friendsSnapshot.docs.map((friendsDoc) => {
              const userData = friendsDoc.data();
              return { id: friendsDoc.id, data: userData };
            });

            return userDataArray;
          }
          return []; // Return an empty array for the current user
        });

        const userDataArrays = await Promise.all(promises);
        const mergedDataArray = [].concat(...userDataArrays);
        console.log("Friends Matches:", mergedDataArray);
        setMatches(mergedDataArray);
      } catch (error) {
        console.error("Error fetching matches:", error);
      }
    };

    fetchMatches();
  }, []);

  console.log("Friends Matches:", matches);

  const handleInviteFriends = async () => {
    const { status } = await Permissions.askAsync(Permissions.CONTACTS);
    if (status === "granted") {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
      });
      if (data.length > 0) {
        const phoneNumbers = data.map((contact) => {
          const phoneNumber = contact.phoneNumbers[0]?.number;
          return phoneNumber.replace(/[\s()-]/g, ""); // Remove spaces, parentheses, and hyphens from phone number
        });
        const message = "Check out this awesome app!";
        SMS.sendSMSAsync(phoneNumbers, message);
      }
    } else {
      Linking.openSettings();
    }
  };

  // Rest of the code to display matches in FriendsTab

  return (
    <ScrollView contentContainerStyle={styles.profilesContainer}>
      {matches.map((userMatch) => {
        return (
          <View key={userMatch.id} style={styles.profileContainer}>
            <Image
              source={{ uri: userMatch.data.photoURL.uri }}
              style={styles.profileImage}
            />
            <TouchableOpacity
              style={styles.requestButton}
              onPress={() => {
                navigation.navigate("MatchRequest", {
                  match: userMatch.data,
                });
              }}
            >
              <Text style={styles.requestButtonText}>Request Chat</Text>
            </TouchableOpacity>
          </View>
        );
      })}
      <View style={styles.inviteFriendsButtonContainer}>
        <TouchableOpacity
          style={styles.inviteFriendsButton}
          onPress={handleInviteFriends}
        >
          <Text style={styles.inviteFriendsButtonText}>Invite Friends</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const MatchList = () => {
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

  const handleSetPictureOrVideoPress = () => {
    // Handle the logic to set the 24-hour picture or video to the user's "users" document
    // You can show a modal or navigate to another screen for this purpose
    navigation.navigate("Story");
  };

  return (
    <View style={styles.container}>
      <Header
        handleLeft={handleLeftButtonPress}
        handleMiddle={handleMiddleButtonPress}
        handleRight={handleRightButtonPress}
      />
      <View style={styles.setPictureOrVideoButtonContainer}>
        <TouchableOpacity
          style={styles.setPictureOrVideoButton}
          onPress={handleSetPictureOrVideoPress}
        >
          <Text style={styles.setPictureOrVideoButtonText}>Set Story</Text>
        </TouchableOpacity>
      </View>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarStyle: {
            backgroundColor: "black",
          },
          tabBarLabelStyle: {
            color: "lightblue",
          },
          tabBarIndicatorStyle: {
            backgroundColor: "lightblue",
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
  },
  profilesContainer: {
    flexGrow: 1,
    alignItems: "center",
    paddingBottom: 16,
    backgroundColor: "black",
  },
  profileContainer: {
    marginBottom: 16,
    alignItems: "center",
    backgroundColor: "black",
  },
  profileImage: {
    width: 300,
    height: 300,
    borderRadius: 50,
    marginBottom: 8,
  },
  requestButton: {
    backgroundColor: "black",
    padding: 12,
    alignItems: "center",
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
  requestButtonText: {
    color: "lightblue",
    fontSize: 16,
    fontWeight: "bold",
  },
  setPictureOrVideoButtonContainer: {
    width: 200,
    alignSelf: "center",
  },
  setPictureOrVideoButton: {
    backgroundColor: "black",
    padding: 12,
    alignItems: "center",
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
  setPictureOrVideoButtonText: {
    color: "lightblue",
    fontSize: 16,
    fontWeight: "bold",
  },
  inviteFriendsButton: {
    backgroundColor: "black",
    padding: 12,
    alignItems: "center",
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
  inviteFriendsButtonText: {
    color: "pink",
    fontSize: 30,
    fontWeight: "bold",
  },
});

export default MatchList;
