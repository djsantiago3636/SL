import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import firebase from "firebase/compat/app";
import { useNavigation } from "@react-navigation/native";

const ChatList = () => {
  const navigation = useNavigation();
  const [chatList, setChatList] = useState([]);

  useEffect(() => {
    const fetchChatList = async () => {
      try {
        const currentUser = firebase.auth().currentUser;

        // Fetch the current user's "Reports" subcollection
        const reportsSnapshot = await firebase
          .firestore()
          .collection("users")
          .doc(currentUser.uid)
          .collection("Reports")
          .get();

        // Get an array of user IDs present in the "Reports" subcollection
        const reportedUserIds = reportsSnapshot.docs.map((doc) => {
          const userIds = doc.data().userIds;
          return userIds.find((userId) => userId !== currentUser.uid);
        });

        console.log("Reported Users:", reportedUserIds);

        // Fetch the current user's "Unmatched" subcollection
        const unmatchedSnapshot = await firebase
          .firestore()
          .collection("users")
          .doc(currentUser.uid)
          .collection("Unmatched")
          .get();

        // Get an array of user IDs present in the "Unmatched" subcollection
        const unmatchedUserIds = unmatchedSnapshot.docs.map((doc) => doc.id);

        console.log("Unmatched Users:", unmatchedUserIds);

        // Query the "matchAccepted" collection
        const querySnapshot = await firebase
          .firestore()
          .collection("matchAccepted")
          .where("usersMatched", "array-contains", currentUser.uid)
          .get();

        const chats = [];

        // Iterate over the query snapshot and extract the other user's IDs
        querySnapshot.forEach(async (doc) => {
          const matchData = doc.data();
          const usersMatched = matchData.usersMatched;

          // Find the other user's IDs
          const otherUserIds = usersMatched.filter(
            (userId) => userId !== currentUser.uid
          );

          // Check if any of the other user's IDs are in the "Reports" subcollection
          // and not in the "Unmatched" subcollection
          const shouldIncludeChat = otherUserIds.every(
            (userId) =>
              !reportedUserIds.includes(userId) &&
              !unmatchedUserIds.includes(userId)
          );

          if (shouldIncludeChat) {
            // Get the other users' documents from the "users" collection
            const otherUserDocs = await Promise.all(
              otherUserIds.map((userId) =>
                firebase.firestore().collection("users").doc(userId).get()
              )
            );

            const chatUsers = otherUserDocs.map((otherUserDoc) => {
              if (otherUserDoc.exists) {
                const otherUserData = otherUserDoc.data();
                const otherUserName = otherUserData.name;
                const otherUserPhotoURL = otherUserData.photoURL;

                // Create a user object with ID, name, and photoURL
                return {
                  userId: otherUserDoc.id,
                  userName: otherUserName,
                  userPhotoURL: otherUserPhotoURL,
                };
              }
              return null;
            });

            // Filter out null values (in case a user document was not found)
            const validChatUsers = chatUsers.filter((user) => user !== null);

            // Create a chat object with the chat ID and users
            const chat = {
              chatId: doc.id,
              otherUserId: otherUserIds[0],
              users: validChatUsers,
            };

            chats.push(chat);
          }
        });

        setChatList(chats);
      } catch (error) {
        console.error("Error fetching chat list:", error);
        // Handle the error appropriately
      }
    };

    fetchChatList();
  }, []);

  const handleChatPress = (chatId, otherUserId) => {
    console.log("ChatID:", chatId);
    console.log("RecieverId:", otherUserId);

    navigation.navigate("Chat", {
      requestId: chatId,
      receiverId: otherUserId,
    });
  };

  const renderChatItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => handleChatPress(item.chatId, item.otherUserId)}
    >
      <View style={styles.chatItem}>
        {item.users.map((user) => (
          <View key={user.userId} style={styles.userInfoContainer}>
            <Image
              style={styles.avatar}
              source={{ uri: user.userPhotoURL[0] }}
            />
            <Text style={styles.username}>{user.userName}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );

  return (
    <View>
      <FlatList
        data={chatList}
        keyExtractor={(item) => item.chatId}
        renderItem={renderChatItem}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    height: 100,
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
  username: {
    fontSize: 26,
    fontWeight: "bold",
  },
});

export default ChatList;
