import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import firebase from "firebase/compat/app";

const ChatScreen = ({ route }) => {
  const { requestId, receiverId } = route.params;
  const user = firebase.auth().currentUser;
  const navigation = useNavigation();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [receiverName, setReceiverName] = useState("");

  useEffect(() => {
    const fetchChatData = async () => {
      try {
        const chatRef = firebase
          .firestore()
          .collection("matchAccepted")
          .doc(requestId);

        const chatDoc = await chatRef.get();

        if (chatDoc.exists) {
          const chatData = chatDoc.data();
          const messagesCollectionRef = chatRef.collection("messages");

          const unsubscribe = messagesCollectionRef
            .orderBy("timestamp", "asc")
            .onSnapshot((snapshot) => {
              const messageList = [];
              snapshot.forEach((doc) => {
                const message = doc.data();
                messageList.push(message);
              });
              setMessages(messageList.reverse()); // Reverse the order of messages
            });

          return () => {
            unsubscribe();
          };
        }
      } catch (error) {
        console.error("Error fetching chat data:", error);
        // Handle the error appropriately
      }
    };

    fetchChatData();
  }, [requestId]);

  useEffect(() => {
    const fetchReceiverData = async () => {
      try {
        const userRef = firebase
          .firestore()
          .collection("users")
          .doc(receiverId);
        const userDoc = await userRef.get();

        if (userDoc.exists) {
          const userData = userDoc.data();
          const receiverName = userData.name;
          setReceiverName(receiverName);
        }
      } catch (error) {
        console.error("Error fetching receiver data:", error);
        // Handle the error appropriately
      }
    };

    fetchReceiverData();
  }, [receiverId]);

  const handleSend = async () => {
    if (text.trim() === "") {
      return;
    }

    try {
      const chatRef = firebase
        .firestore()
        .collection("matchAccepted")
        .doc(requestId);

      await chatRef.collection("messages").add({
        senderId: user.uid,
        receiverId: receiverId,
        text: text.trim(),
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });

      setText("");
    } catch (error) {
      console.error("Error sending message:", error);
      // Handle the error appropriately
    }
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleReportUser = async () => {
    try {
      const reportData = {
        userIds: [user.uid, receiverId],
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      };

      await firebase.firestore().collection("unmatchedReport").add(reportData);

      // Handle successful reporting
      console.log("Users reported successfully");
    } catch (error) {
      console.error("Error reporting users:", error);
      // Handle the error appropriately
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="ios-arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerText}>{receiverName}</Text>
        <TouchableOpacity
          style={styles.reportButton}
          onPress={handleReportUser}
        >
          <Ionicons name="ios-flag" size={24} color="black" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={messages.reverse()}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageContainer,
              item.senderId === user.uid
                ? styles.sentMessageContainer
                : styles.receivedMessageContainer,
            ]}
          >
            <View style={styles.messageContent}>
              <Text style={styles.messageText}>{item.text}</Text>
            </View>
          </View>
        )}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.flatListContent}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : null}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            value={text}
            onChangeText={(value) => setText(value)}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "lightblue",
  },
  headerText: {
    color: "lightblue",
    fontSize: 18,
    fontWeight: "bold",
  },
  flatListContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 80,
    flexGrow: 1,
  },
  messageContainer: {
    marginBottom: 16,
    padding: 8,
    backgroundColor: "black",
    borderRadius: 8,
    maxWidth: "60%",
    alignSelf: "flex-start",
    shadowColor: "lightblue",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  messageContent: {
    alignItems: "flex-start", // Align message content to the start (left side)
  },
  messageText: {
    fontSize: 16,
    color: "lightblue",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "lightblue",
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: "lightblue",
    borderRadius: 8,
    paddingHorizontal: 8,
    color: "lightblue",
  },
  sendButton: {
    marginLeft: 16,
    backgroundColor: "lightblue",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  sendButtonText: {
    color: "black",
    fontSize: 16,
  },
  backButton: {
    backgroundColor: "lightblue",
    padding: 8,
    borderRadius: 8,
  },
  reportButton: {
    backgroundColor: "lightblue",
    padding: 8,
    borderRadius: 8,
  },
  sentMessageContainer: {
    alignSelf: "flex-end",
    backgroundColor: "black",
  },
  receivedMessageContainer: {
    alignSelf: "flex-start",
    backgroundColor: "black",
  },
});

export default ChatScreen;
