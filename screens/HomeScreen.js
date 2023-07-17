import { Button, Text, View } from "react-native";
import React from "react";
import { useNavigation } from "@react-navigation/native";

const HomeScreen = () => {
  const navigation = useNavigation();

  return (
    <View>
      <Text>Home Screen</Text>
      <Button
        title="Go to Inbox"
        onPress={() => navigation.navigate("Inbox")}
      />
    </View>
  );
};

export default HomeScreen;
