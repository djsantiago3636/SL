import * as React from "react";
import { View, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";

import CreateProfile from "../screens/CreateProfileScreen";
import ProfileView from "../screens/ProfileViewScreen";
import LoginScreen from "../screens/LoginScreen";
import InboxScreen from "../screens/InboxScreen";
import MatchListRequestScreen from "../screens/MatchListRequestScreen";
import MatchList from "../screens/MatchListScreen";
import RequestDetailScreen from "../screens/RequestDetailScreen";
import ChatScreen from "../screens/ChatScreen";
import StoryScreen from "../screens/StoryScreen";

const homeName = "Home";
const profileName = "Profile";
const loginName = "Login";
const editProfileName = "Edit";
const inboxName = "Inbox";
const matchListName = "MatchList";
const matchListRequestName = "MatchRequest";
const requestDetailName = "RequestDetail";
const chatScreenName = "Chat";
const storyName = "Story";

const Stack = createStackNavigator();

export default function MainContainer() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={loginName}
        screenOptions={({ route }) => ({
          headerShown: false,
          gestureEnabled: true,
          gestureDirection: "horizontal",
          transitionSpec: {
            open: {
              animation: "timing",
              config: { duration: 400 },
            },
            close: {
              animation: "timing",
              config: { duration: 400 },
            },
          },
        })}
      >
        <Stack.Screen name={loginName} component={LoginScreen} />
        <Stack.Screen name={profileName} component={ProfileView} />
        <Stack.Screen name={inboxName} component={InboxScreen} />
        <Stack.Screen name={editProfileName} component={CreateProfile} />
        <Stack.Screen name={matchListName} component={MatchList} />
        <Stack.Screen
          name={matchListRequestName}
          component={MatchListRequestScreen}
        />
        <Stack.Screen
          name={requestDetailName}
          component={RequestDetailScreen}
        />
        <Stack.Screen name={chatScreenName} component={ChatScreen} />
        <Stack.Screen name={storyName} component={StoryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
