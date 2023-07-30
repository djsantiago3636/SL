import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/storage";
import "firebase/compat/database";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../firebase";
import { firestore } from "../firebase";
import Header from "../navigation/Header";
import { useNavigation } from "@react-navigation/native";
import { Image } from "react-native";
import ChatList from "./ChatList";

const Tab = createMaterialTopTabNavigator();

const InboxScreen = ({ navigation }) => {
  const [requestThreads, setRequestThreads] = useState([]);
  const [acceptedThreads, setAcceptedThreads] = useState([]);
  const [textColor, setTextColor] = useState("white");

  useEffect(() => {
    const currentUser = auth.currentUser;
    const unsubscribeRequests = firestore
      .collection("users")
      .doc(currentUser.uid)
      .collection("requests")
      .onSnapshot((querySnapshot) => {
        const requestThreadsData = [];
        querySnapshot.forEach((doc) => {
          const request = { id: doc.id, ...doc.data() };
          requestThreadsData.push(request);
        });
        setRequestThreads(requestThreadsData);
      });

    const unsubscribeAcceptedRequests = firestore
      .collection("users")
      .doc(currentUser.uid)
      .collection("acceptedRequests")
      .onSnapshot((querySnapshot) => {
        const acceptedThreadsData = [];
        querySnapshot.forEach((doc) => {
          const acceptedRequest = { id: doc.id, ...doc.data() };
          acceptedThreadsData.push(acceptedRequest);
        });
        setAcceptedThreads(acceptedThreadsData);
      });

    return () => {
      unsubscribeRequests();
      unsubscribeAcceptedRequests();
    };
  }, []);

  const handleLeftButtonPress = () => {
    navigation.navigate("Edit");
  };

  const handleMiddleButtonPress = () => {
    navigation.navigate("MatchList");
  };

  const handleRightButtonPress = () => {
    navigation.navigate("Inbox");
  };

  const handleRequestPress = (requestId) => {
    navigation.navigate("RequestDetail", { requestId });
  };

  const renderRequestThreadItem = ({ item }) => {
    return (
      <TouchableOpacity onPress={() => handleRequestPress(item.id)}>
        <View style={styles.listItem}>
          <View style={styles.userInfoContainer}>
            <Image
              style={styles.avatar}
              source={{ uri: item.userData.photoURL[0] }}
            />
            <Text style={styles.requestText}>REQUEST</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderAcceptedThreadItem = ({ item }) => {
    const requestText = item.senderName;
    const handleAcceptedRequestPress = () => {
      navigation.navigate("Chat", { requestId: item.requestId });
    };
    return (
      <TouchableOpacity onPress={handleAcceptedRequestPress}>
        <View style={styles.listItem}>
          <Text style={styles.requestText}>{requestText}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { marginTop: 0 }]}>
      <Header
        handleLeft={handleLeftButtonPress}
        handleMiddle={handleMiddleButtonPress}
        handleRight={handleRightButtonPress}
      />
      <View style={styles.tabNavigatorContainer}>
        <Tab.Navigator
          screenOptions={{
            labelStyle: styles.tabBarLabel,
            style: styles.tabBarStyle,
            indicatorStyle: styles.tabBarIndicator,
          }}
        >
          <Tab.Screen
            name="Requests"
            options={{
              tabBarLabel: "Requests",
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="ios-notifications" color="white" size={20} />
              ),
            }}
          >
            {() => (
              // Conditional rendering for request threads
              <FlatList
                data={requestThreads}
                renderItem={renderRequestThreadItem}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={() => (
                  <View>
                    <Text style={styles.emptyText}>No data available</Text>
                  </View>
                )}
              />
            )}
          </Tab.Screen>

          <Tab.Screen
            name="Accepted"
            options={{
              tabBarLabel: "Accepted",
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="ios-chatbubbles" color="white" size={10} />
              ),
            }}
          >
            {() => (
              <ChatList /> // Render the ChatList component here
            )}
          </Tab.Screen>
        </Tab.Navigator>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  tabNavigatorContainer: {
    flex: 1,
    // adjust the paddingTop value to bring down the top bar navigator
  },
  tabBarLabel: {
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "capitalize",
    backgroundColor: "black",
  },
  tabBarStyle: {
    backgroundColor: "lightblue",
    height: 40,
  },
  tabBarIndicator: {
    backgroundColor: "white",
    height: 2,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
  requestText: {
    fontSize: 26,
    fontWeight: "bold",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 25,
    marginRight: 10,
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
});

export default InboxScreen;
