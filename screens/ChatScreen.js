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
  Modal,
  Dimensions,
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
  const [userPhoto, setCurrentUserPhoto] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [isReportModalVisible, setReportModalVisible] = useState(false);
  const [isReportPressed, setReportPressed] = useState(false);
  const [isUnmatchPressed, setUnmatchPressed] = useState(false);
  const [receiverPhoto, setReceiverPhoto] = useState("");
  const [zoomedImage, setZoomedImage] = useState(null);
  const [isUserPhotoModalVisible, setUserPhotoModalVisible] = useState(false);
  const [isReceiverPhotoModalVisible, setReceiverPhotoModalVisible] =
    useState(false);

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
          console.log("userData:", userData);
          const receiverName = userData.name;
          setReceiverName(receiverName);
          const receiverPhoto = userData.photoURL[0];
          setReceiverPhoto(receiverPhoto);
          console.log("userPhoto", receiverPhoto);
        }
      } catch (error) {
        console.error("Error fetching receiver data:", error);
        // Handle the error appropriately
      }
    };

    fetchReceiverData();
    const fetchCurrentUserPhoto = async () => {
      try {
        const currentUserRef = firebase
          .firestore()
          .collection("users")
          .doc(user.uid);
        const currentUserDoc = await currentUserRef.get();

        if (currentUserDoc.exists) {
          const currentUserData = currentUserDoc.data();
          const userPhoto = currentUserData.photoURL[0];
          console.log("CurrentUserPhoto", userPhoto);
          setCurrentUserPhoto(userPhoto);
        }
      } catch (error) {
        console.error("Error fetching current user data:", error);
        // Handle the error appropriately
      }
    };

    fetchCurrentUserPhoto();
  }, [receiverId, user.uid]);

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

  const toggleReportModal = () => {
    setReportModalVisible((prevVisible) => !prevVisible);
    setReportPressed(true); // Set isReportPressed to true when the report modal is opened
  };

  const handleUnmatch = async () => {
    try {
      // Add "Unmatched" subdoc in the current user's "users" subcollection
      await firebase
        .firestore()
        .collection("users")
        .doc(user.uid)
        .collection("Unmatched")
        .doc(receiverId)
        .set(
          {
            [receiverId]: true,
          },
          { merge: true }
        );

      // Add "Unmatched" subdoc in the receiver's "users" subcollection
      await firebase
        .firestore()
        .collection("users")
        .doc(receiverId)
        .collection("Unmatched")
        .doc(user.uid)
        .set(
          {
            [user.uid]: true,
          },
          { merge: true }
        );

      // Handle successful unmatch
      console.log("Unmatched successfully");

      // Navigate back to the inbox or any other relevant screen
      navigation.navigate("Inbox");
    } catch (error) {
      console.error("Error unmatching:", error);
      // Handle the error appropriately
    }
  };

  const handleReportUser = async () => {
    try {
      const reportData = {
        userIds: [user.uid, receiverId],
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      };

      // Add the reportData to the current user's "Reports" subcollection
      await firebase
        .firestore()
        .collection("users")
        .doc(user.uid)
        .collection("Reports")
        .add(reportData);

      // Add the reportData to the receiver's "Reports" subcollection
      await firebase
        .firestore()
        .collection("users")
        .doc(receiverId)
        .collection("Reports")
        .add(reportData);

      // Add the reportData to the new "Reports" collection
      await firebase.firestore().collection("Reports").add(reportData);

      // Handle successful reporting
      console.log("Users reported successfully");

      navigation.navigate("Inbox");
    } catch (error) {
      console.error("Error reporting users:", error);
      // Handle the error appropriately
    }
  };

  const handleCancelReport = () => {
    toggleReportModal();
  };

  const handleOpenUserPhotoModal = () => {
    setZoomedImage(userPhoto);
    setUserPhotoModalVisible(true);
  };

  const handleCloseUserPhotoModal = () => {
    setUserPhotoModalVisible(false);
  };

  const handleOpenReceiverPhotoModal = () => {
    setZoomedImage(receiverPhoto);
    setReceiverPhotoModalVisible(true);
  };

  const handleCloseReceiverPhotoModal = () => {
    setReceiverPhotoModalVisible(false);
  };

  const reversedMessages = messages.slice().reverse();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="ios-arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerText}>{receiverName}</Text>
        <TouchableOpacity
          style={styles.reportButton}
          onPress={toggleReportModal}
        >
          <Ionicons name="ios-flag" size={24} color="black" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={reversedMessages}
        renderItem={({ item }) => (
          <View
            style={
              item.senderId === user.uid
                ? styles.sentMessageItemContainer
                : styles.receivedMessageItemContainer
            }
          >
            {item.senderId !== user.uid && (
              <TouchableOpacity
                onPress={() => handleOpenReceiverPhotoModal(receiverPhoto)}
                style={styles.profileImageContainer}
              >
                <Image
                  source={{ uri: receiverPhoto }}
                  style={styles.smallCircleImage}
                />
              </TouchableOpacity>
            )}
            <View
              style={[
                styles.messageContainer,
                item.senderId === user.uid
                  ? styles.sentMessageContainer
                  : styles.receivedMessageContainer,
              ]}
            >
              <Text style={styles.messageText}>{item.text}</Text>
            </View>
            {item.senderId === user.uid && (
              <TouchableOpacity
                onPress={() => handleOpenUserPhotoModal(userPhoto)}
                style={[
                  styles.profileImageContainer,
                  styles.sentProfileImageContainer,
                ]}
              >
                <Image
                  source={{ uri: userPhoto }}
                  style={styles.smallCircleImage}
                />
              </TouchableOpacity>
            )}
          </View>
        )}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.flatListContent}
      />
      <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={64}>
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
      {/* Report Modal */}
      <Modal visible={isReportModalVisible} transparent>
        <View style={styles.modalContainer}>
          {isReportPressed && (
            <>
              <TouchableOpacity
                style={styles.reportOptionButton}
                onPress={() => {
                  handleUnmatch();
                  toggleReportModal();
                }}
              >
                <Text style={styles.reportOptionText}>Unmatch</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.reportOptionButton}
                onPress={() => {
                  handleReportUser();
                  toggleReportModal();
                }}
              >
                <Text style={styles.reportOptionText}>Report</Text>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity
            style={styles.reportOptionButton}
            onPress={handleCancelReport}
          >
            <Text style={styles.reportOptionText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
      {/* User Photo Modal */}
      <Modal visible={isUserPhotoModalVisible} transparent>
        <TouchableOpacity
          style={styles.modalContainer}
          onPress={handleCloseUserPhotoModal}
        >
          {zoomedImage && (
            <Image source={{ uri: zoomedImage }} style={styles.zoomedImage} />
          )}
        </TouchableOpacity>
      </Modal>
      {/* Receiver Photo Modal */}
      <Modal visible={isReceiverPhotoModalVisible} transparent>
        <TouchableOpacity
          style={styles.modalContainer}
          onPress={handleCloseReceiverPhotoModal}
        >
          {zoomedImage && (
            <Image source={{ uri: zoomedImage }} style={styles.zoomedImage} />
          )}
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;

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
    fontSize: 30,
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
    justifyContent: "flex-end",
    backgroundColor: "black",
  },
  receivedMessageContainer: {
    justifyContent: "flex-start",
    backgroundColor: "black",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  reportOptionButton: {
    backgroundColor: "lightblue",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  reportOptionText: {
    color: "black",
    fontSize: 16,
  },
  smallCircleImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  messageItemContainer: {
    flexDirection: "row",
    justifyContent: "flex-start", // Align messages to the bottom for both sides
    marginBottom: 16,
    alignSelf: "flex-start", // Align messages to the bottom for both sides
  },
  receivedMessageItemContainer: {
    flexDirection: "row",
    justifyContent: "flex-start", // Received messages will be on the left
    marginBottom: 16,
    alignSelf: "flex-start", // Align messages to the bottom for both sides
  },
  sentMessageItemContainer: {
    flexDirection: "row",
    justifyContent: "flex-end", // Sent messages will be on the right
    marginBottom: 16,
    alignSelf: "flex-end", // Align messages to the bottom for both sides
  },
  profileImageContainer: {
    marginRight: 8,
  },
  receivedProfileImageContainer: {
    marginLeft: 8,
  },
  sentProfileImageContainer: {
    marginRight: 8,
    marginLeft: 14,
  },
  modalImageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: {
    width: "80%",
    height: "80%",
    borderRadius: 8,
  },
  zoomedImage: {
    width: windowWidth * 0.8,
    height: windowHeight * 0.8,
    resizeMode: "contain",
  },
});

export default ChatScreen;
