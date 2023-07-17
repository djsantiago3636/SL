import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const Header = () => {
  const navigation = useNavigation();

  const handleLeftButtonPress = () => {
    navigation.navigate("Profile");
  };

  const handleMiddleButtonPress = () => {
    navigation.navigate("MatchList");
  };

  const handleRightButtonPress = () => {
    navigation.navigate("Inbox");
  };
  return (
    <View style={styles.header}>
      {/* Left button */}
      <TouchableOpacity
        style={styles.headerButton}
        onPress={handleLeftButtonPress}
      >
        <Ionicons name="ios-person" size={20} color="lightblue" />
      </TouchableOpacity>

      {/* Middle button */}
      <TouchableOpacity
        style={styles.headerButton}
        onPress={handleMiddleButtonPress}
      >
        <Image
          source={require("../assets/IMG-5973.jpg")}
          style={styles.middleButtonImage}
        />
      </TouchableOpacity>

      {/* Right button */}
      <TouchableOpacity
        style={styles.headerButton}
        onPress={handleRightButtonPress}
      >
        <Ionicons name="ios-chatbubbles" color="lightblue" size={30} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 60,
    backgroundColor: "black",
    marginTop: 70,
    width: "100%",
  },
  headerButton: {
    padding: 8,
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  middleButtonImage: {
    width: 90,
    height: 90,
  },
});

export default Header;
