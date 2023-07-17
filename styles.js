import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black", // set background color to black
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderColor: "white",
  },
  inputContainer: {
    width: "100%",
    maxWidth: 400,
    borderWidth: 2,
    borderColor: "lightblue", // set border color to lightblue
    padding: 20,
    marginBottom: 20,
    borderRadius: 10,
    color: "white",
    marginTop: 100,
  },
  input: {
    height: 40,
    borderColor: "lightblue", // set border color to lightblue
    borderWidth: 2,
    paddingHorizontal: 10,
    marginBottom: 10,
    color: "white", // set text color to white
    fontSize: 18, // set font size to 18
  },
  fileContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "white", // set text color to white
    fontSize: 18, // set font size to 18
    marginBottom: 10,
  },
  createProfileButton: {
    backgroundColor: "lightblue", // set button background color to lightblue
    padding: 10,
    borderRadius: 10,
  },
  createProfileButtonText: {
    color: "black", // set text color to black
    fontSize: 18, // set font size to 18
    fontWeight: "bold",
    textAlign: "center",
  },
  profile: {
    alignItems: "center",
    marginTop: 20,
  },
  profileImage: {
    width: 300,
    height: 300,
    marginTop: 20,
    borderWidth: 2,
    borderColor: "lightblue",
    alignSelf: "center",
  },
  profileText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  name: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  age: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  emptyText: {
    fontSize: 18,
    color: "white",
    alignSelf: "center",
    marginVertical: 20,
  },
  listItem: {
    borderWidth: 1,
    borderColor: "gray",
    backgroundColor: "lightblue",
    borderRadius: 5,
    padding: 10,
    marginVertical: 5,
    marginHorizontal: 10,
  },
});

export default styles;
