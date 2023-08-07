import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
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
  const [isTabActive, setIsTabActive] = useState(false);
  const [isLoading, setIsLoading] = useState(null); // New state variable
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

        const currentUser = firebase.auth().currentUser;
        const currentUserDocRef = firestore
          .collection("users")
          .doc(currentUser.uid);

        // Update the current user's location in their "users" document
        await currentUserDocRef.update({
          latitude: latitude,
          longitude: longitude,
        });

        // Update the current user's location in the "attractionsSurvey" documents
        const attractionsSurveyRef = firestore.collection("attractionsSurvey");
        const currentUserAttractionsSnapshot = await attractionsSurveyRef
          .doc(currentUser.uid)
          .get();
        if (currentUserAttractionsSnapshot.exists) {
          await currentUserAttractionsSnapshot.ref.update({
            latitude: latitude,
            longitude: longitude,
          });
        }

        // Update the current user's location in the "friendsSurvey" documents
        const friendsSurveyRef = firestore.collection("friendsSurvey");
        const currentUserFriendsSnapshot = await friendsSurveyRef
          .doc(currentUser.uid)
          .get();
        if (currentUserFriendsSnapshot.exists) {
          await currentUserFriendsSnapshot.ref.update({
            latitude: latitude,
            longitude: longitude,
          });
        }
      } catch (error) {
        console.error("Error updating user location:", error);
      }
    };

    updateCurrentUserLocation();
  }, []);

  useEffect(() => {
    if (userLatitude && userLongitude) {
      fetchMatches();
    }
  }, [isTabActive, userLatitude, userLongitude]);

  const fetchMatches = async () => {
    setIsLoading(true);
    const getDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371; // Radius of the Earth in kilometers
      const dLat = deg2rad(lat2 - lat1);
      const dLon = deg2rad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) *
          Math.cos(deg2rad(lat2)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c; // Distance in kilometers
      return distance * 1000; // Convert to meters
    };

    const deg2rad = (deg) => {
      return deg * (Math.PI / 180);
    };

    try {
      const currentUser = firebase.auth().currentUser;
      const currentUserAttractionsSnapshot = await firestore
        .collection("attractionsSurvey")
        .doc(currentUser.uid)
        .get();
      const currentUserAttractionsData = currentUserAttractionsSnapshot.data();

      console.log("Attractions Survey Data:", currentUserAttractionsData);

      const attractionsSnapshot = await firestore
        .collection("attractionsSurvey")
        .get();
      console.log("Attractions Snapshot size:", attractionsSnapshot.size);

      const attractionsDataArray = attractionsSnapshot.docs.map(
        (attractionsDoc) => {
          const userId = attractionsDoc.id;
          const userData = attractionsDoc.data();
          return {
            id: userId,
            data: { ...userData, age: parseInt(userData.age) },
          };
        }
      );

      const filteredAttractionsDataArray = attractionsDataArray.filter(
        (attractionsData) => attractionsData.id !== currentUser.uid
      );
      console.log(
        "Attractions Survey Data from User:",
        filteredAttractionsDataArray
      );

      const promises = filteredAttractionsDataArray.map(
        async (attractionsData) => {
          const userId = attractionsData.id;
          const userData = attractionsData.data;

          const currentUserDocRef = firestore
            .collection("users")
            .doc(currentUser.uid);
          const currentUserAcceptedRequestsRef =
            currentUserDocRef.collection("acceptedRequests");
          const currentUserAcceptedRequestsSnapshot =
            await currentUserAcceptedRequestsRef.get();
          const currentUserAcceptedRequestsData =
            currentUserAcceptedRequestsSnapshot.docs.map((doc) => doc.data());

          const currentUserDeniedRequestsRef =
            currentUserDocRef.collection("deniedRequests");
          const currentUserDeniedRequestsSnapshot =
            await currentUserDeniedRequestsRef.get();
          const currentUserDeniedRequestsData =
            currentUserDeniedRequestsSnapshot.docs.map((doc) => doc.data());

          const currentUserSentRequestsRef =
            currentUserDocRef.collection("sentRequests");
          const currentUserSentRequestsSnapshot =
            await currentUserSentRequestsRef.get();
          const currentUserSentRequestsData =
            currentUserSentRequestsSnapshot.docs.map((doc) => doc.data());

          const currentUserRequestsRef =
            currentUserDocRef.collection("requests");
          const currentUserRequestsSnapshot =
            await currentUserRequestsRef.get();
          const currentUserRequestsData = currentUserRequestsSnapshot.docs.map(
            (doc) => doc.data()
          );

          console.log(
            "Accepted Requests Data:",
            currentUserAcceptedRequestsData
          );
          console.log("Denied Requests Data:", currentUserDeniedRequestsData);
          console.log("Sent Requests", currentUserSentRequestsData);
          console.log("Requests", currentUserRequestsData);

          // Convert age values to numbers
          const minAgeLookingFor = currentUserAttractionsData.minAgeLookingFor;
          const maxAgeLookingFor = currentUserAttractionsData.maxAgeLookingFor;
          const userAge = userData.age;

          console.log("Min Age Looking For:", minAgeLookingFor);
          console.log("Max Age Looking For:", maxAgeLookingFor);
          console.log("User Age:", userAge);
          console.log(
            "Gender Looking For of Possible Match:",
            userData.genderLookingFor
          );
          console.log("Gender of Possible Match:", userData.gender);
          console.log(
            "Gender Looking For of Current User:",
            currentUserAttractionsData.genderLookingFor
          );
          console.log(
            "Gender of Current User:",
            currentUserAttractionsData.gender
          );

          // Check if the user has been denied by the current user
          const denied = currentUserDeniedRequestsData.some(
            (deniedRequest) => deniedRequest.senderId === userId
          );

          // Check if the current user has already sent a request to the user
          const sentRequest = currentUserSentRequestsData.some(
            (sentRequest) => sentRequest.receiverId === userId
          );

          // Check if the user has requested the current user
          const requests = currentUserRequestsData.some(
            (request) => request.senderId === userId
          );

          // Check if the user is in the acceptedRequests of the current user
          const inAcceptedRequests = currentUserAcceptedRequestsData.some(
            (acceptedRequest) => acceptedRequest.senderId === userId
          );

          console.log("Denied:", denied);
          console.log("Sent Request:", sentRequest);
          console.log("Requests:", requests);
          console.log("In Accepted Requests:", inAcceptedRequests);

          // Calculate the distance between the user and the potential match
          const distance = getDistance(
            userLatitude,
            userLongitude,
            userData.latitude,
            userData.longitude
          );

          console.log("Distance:", distance);

          // Apply filtering conditions based on gender, age, request status, and sent request
          // Apply filtering conditions based on gender, age, request status, and sent request
          const isMatch =
            // Check if both users have specific gender preferences that match each other
            ((currentUserAttractionsData.genderLookingFor !== "any" &&
              userData.gender === currentUserAttractionsData.genderLookingFor &&
              currentUserAttractionsData.gender ===
                userData.genderLookingFor) ||
              // Check if current user's gender preference is "any" and it matches userData's gender
              (currentUserAttractionsData.genderLookingFor === "any" &&
                (userData.genderLookingFor ===
                  currentUserAttractionsData.gender ||
                  userData.gender ===
                    currentUserAttractionsData.genderLookingFor)) ||
              // Check if userData's gender preference is "any" and it matches current user's gender
              (currentUserAttractionsData.genderLookingFor !== "any" &&
                (userData.gender === "any" ||
                  currentUserAttractionsData.genderLookingFor ===
                    userData.gender))) &&
            userAge >= minAgeLookingFor &&
            userAge <= maxAgeLookingFor &&
            !requests &&
            !denied &&
            !sentRequest &&
            !inAcceptedRequests &&
            distance <= 850; // Filter within 850 meters

          console.log("Is Match:", isMatch);

          if (isMatch) {
            return { id: userId, data: userData };
          }

          return null;
        }
      );

      const matchesDataArray = await Promise.all(promises);
      const filteredMatchesDataArray = matchesDataArray.filter(Boolean);
      console.log("Attractions Matches:", filteredMatchesDataArray);
      setMatches(filteredMatchesDataArray);
    } catch (error) {
      console.error("Error fetching matches:", error);
    } finally {
      setIsLoading(false);
    }
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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="lightblue" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.profilesContainer}>
      {matches.map((userMatch) => {
        return (
          <View key={userMatch.id} style={styles.profileContainer}>
            <Image
              source={{ uri: userMatch.data.photoURL[0] }}
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
  const [isTabActive, setIsTabActive] = useState(false);
  const [isLoading, setIsLoading] = useState(null); // New state variable
  const navigation = useNavigation();

  useEffect(() => {
    const fetchMatches = async () => {
      setIsLoading(true);
      const getDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Radius of the Earth in kilometers
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(deg2rad(lat1)) *
            Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // Distance in kilometers
        return distance * 1000; // Convert to meters
      };

      const deg2rad = (deg) => {
        return deg * (Math.PI / 180);
      };

      try {
        const currentUser = firebase.auth().currentUser;
        const currentUserFriendsSnapshot = await firestore
          .collection("friendsSurvey")
          .doc(currentUser.uid)
          .get();
        const currentUserFriendsData = currentUserFriendsSnapshot.data();

        console.log("Friends Survey Data:", currentUserFriendsData);

        const friendsSnapshot = await firestore
          .collection("friendsSurvey")
          .get();
        console.log("Friends Snapshot size:", friendsSnapshot.size);

        const friendsDataArray = friendsSnapshot.docs.map((friendsDoc) => {
          const userId = friendsDoc.id;
          const userData = friendsDoc.data();
          return {
            id: userId,
            data: { ...userData, age: parseInt(userData.age) },
          };
        });

        const filteredFriendsDataArray = friendsDataArray.filter(
          (friendsData) => friendsData.id !== currentUser.uid
        );
        console.log("Friends Survey Data from User:", filteredFriendsDataArray);

        const promises = filteredFriendsDataArray.map(async (friendsData) => {
          const userId = friendsData.id;
          const userData = friendsData.data;

          const currentUserDocRef = firestore
            .collection("users")
            .doc(currentUser.uid);
          const currentUserAcceptedRequestsRef =
            currentUserDocRef.collection("acceptedRequests");
          const currentUserAcceptedRequestsSnapshot =
            await currentUserAcceptedRequestsRef.get();
          const currentUserAcceptedRequestsData =
            currentUserAcceptedRequestsSnapshot.docs.map((doc) => doc.data());

          const currentUserDeniedRequestsRef =
            currentUserDocRef.collection("deniedRequests");
          const currentUserDeniedRequestsSnapshot =
            await currentUserDeniedRequestsRef.get();
          const currentUserDeniedRequestsData =
            currentUserDeniedRequestsSnapshot.docs.map((doc) => doc.data());

          const currentUserSentRequestsRef =
            currentUserDocRef.collection("sentRequests");
          const currentUserSentRequestsSnapshot =
            await currentUserSentRequestsRef.get();
          const currentUserSentRequestsData =
            currentUserSentRequestsSnapshot.docs.map((doc) => doc.data());

          const currentUserRequestsRef =
            currentUserDocRef.collection("requests");
          const currentUserRequestsSnapshot =
            await currentUserRequestsRef.get();
          const currentUserRequestsData = currentUserRequestsSnapshot.docs.map(
            (doc) => doc.data()
          );

          console.log(
            "Accepted Requests Data:",
            currentUserAcceptedRequestsData
          );
          console.log("Denied Requests Data:", currentUserDeniedRequestsData);
          console.log("Sent Requests", currentUserSentRequestsData);
          console.log("Requests", currentUserRequestsData);

          // Convert age values to numbers
          const minAgeLookingFor = currentUserFriendsData.minAgeLookingFor;
          const maxAgeLookingFor = currentUserFriendsData.maxAgeLookingFor;
          const userAge = userData.age;

          console.log("Min Age Looking For:", minAgeLookingFor);
          console.log("Max Age Looking For:", maxAgeLookingFor);
          console.log("User Age:", userAge);
          console.log(
            "Gender Looking For of Possible Match:",
            userData.genderLookingFor
          );
          console.log("Gender of Possible Match:", userData.gender);
          console.log(
            "Gender Looking For of Current User:",
            currentUserFriendsData.genderLookingFor
          );
          console.log("Gender of Current User:", currentUserFriendsData.gender);

          // Check if the user has been denied by the current user
          const denied = currentUserDeniedRequestsData.some(
            (deniedRequest) => deniedRequest.senderId === userId
          );

          // Check if the current user has already sent a request to the user
          const sentRequest = currentUserSentRequestsData.some(
            (sentRequest) => sentRequest.receiverId === userId
          );

          // Check if the user has requested the current user
          const requests = currentUserRequestsData.some(
            (request) => request.senderId === userId
          );

          // Check if the user is in the acceptedRequests of the current user
          const inAcceptedRequests = currentUserAcceptedRequestsData.some(
            (acceptedRequest) => acceptedRequest.senderId === userId
          );

          console.log("Denied:", denied);
          console.log("Sent Request:", sentRequest);
          console.log("Requests:", requests);
          console.log("In Accepted Requests:", inAcceptedRequests);

          // Get the latitude and longitude from the friendsSurvey collection
          const friendSurveySnapshot = await firestore
            .collection("friendsSurvey")
            .doc(userId)
            .get();
          const friendSurveyData = friendSurveySnapshot.data();
          const friendLatitude = friendSurveyData.latitude;
          const friendLongitude = friendSurveyData.longitude;

          // Calculate the distance between the user and the potential match
          const distance = getDistance(
            currentUserFriendsData.latitude,
            currentUserFriendsData.longitude,
            friendLatitude,
            friendLongitude
          );

          console.log("Distance:", distance);

          // Apply filtering conditions based on gender, age, request status, and sent request
          const isFriendMatch =
            // Check if both users have specific gender preferences that match each other
            ((currentUserFriendsData.genderLookingFor !== "any" &&
              userData.gender === currentUserFriendsData.genderLookingFor &&
              currentUserFriendsData.gender === userData.genderLookingFor) ||
              // Check if current user's gender preference is "any" and it matches userData's gender
              (currentUserFriendsData.genderLookingFor === "any" &&
                (userData.genderLookingFor === currentUserFriendsData.gender ||
                  userData.gender ===
                    currentUserFriendsData.genderLookingFor)) ||
              // Check if userData's gender preference is "any" and it matches current user's gender
              (currentUserFriendsData.genderLookingFor !== "any" &&
                (userData.gender === "any" ||
                  currentUserFriendsData.genderLookingFor ===
                    userData.gender))) &&
            userAge >= minAgeLookingFor &&
            userAge <= maxAgeLookingFor &&
            !requests &&
            !denied &&
            !sentRequest &&
            !inAcceptedRequests &&
            distance <= 850; // Filter within 850 meters

          console.log("Is FriendMatch:", isFriendMatch);

          if (isFriendMatch) {
            return { id: userId, data: userData };
          }

          return null;
        });

        const matchesDataArray = await Promise.all(promises);
        const filteredMatchesDataArray = matchesDataArray.filter(Boolean);
        console.log("Friends Matches:", filteredMatchesDataArray);
        setMatches(filteredMatchesDataArray);
      } catch (error) {
        console.error("Error fetching matches:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatches();
  }, [isTabActive]);

  console.log("Friends Matches:", matches);

  // Rest of the code to display matches in FriendsTab

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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="lightblue" />
      </View>
    );
  }

  // Rest of the code to display matches in FriendsTab

  return (
    <ScrollView contentContainerStyle={styles.profilesContainer}>
      {matches.map((userMatch) => {
        return (
          <View key={userMatch.id} style={styles.profileContainer}>
            <Image
              source={{ uri: userMatch.data.photoURL[0] }}
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
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
    shadowColor: "gold",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
    marginTop: 10,
    marginBottom: 10,
  },
  setPictureOrVideoButtonText: {
    color: "gold",
    fontSize: 16,
    fontWeight: "bold",
  },
  inviteFriendsButton: {
    backgroundColor: "black",
    padding: 12,
    alignItems: "center",
    borderRadius: 8,
    shadowColor: "pink",
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
