import React, { useState } from "react";
import { View, TextInput, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useFormik } from "formik";
import * as Yup from "yup";
import get from "lodash.get";

// Validation Schema
const validationSchema = Yup.object({
  address: Yup.object({
    streetNumber: Yup.string().required("Street number is required."),
    postalCode: Yup.string()
      .length(4, "Postal Code must be exactly 4 characters long.")
      .required("Postal Code is required."),
    city: Yup.string().required("City is required."),
  }),
  username: Yup.string().required("Username is required."),
  password: Yup.string().required("Password is required."),
  firstName: Yup.string()
    .matches(
      /^[a-zA-Z\s'-]+$/,
      "First name can only contain letters, spaces, hyphens, and apostrophes."
    )
    .required("First name is required."),
  lastName: Yup.string()
    .matches(
      /^[a-zA-Z\s'-]+$/,
      "Last name can only contain letters, spaces, hyphens, and apostrophes."
    )
    .required("Last name is required."),
  dateOfBirth: Yup.date()
    .required("Date of Birth is required.")
    .test("age", "You must be at least 12 years old", function (value) {
      return value && new Date().getFullYear() - value.getFullYear() >= 12;
    }),
  email: Yup.string()
    .email("Please enter a valid email address.")
    .required("Email address is required."),
  phone: Yup.string().required("Phone number is required."),
});

// API request for new user registration
const postNewUser = async (userData) => {
  try {
    const response = await fetch("http://192.168.50.116:8082/api/user/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    if (response.status === 409) {
      return { success: false, message: "Username already exists." };
    } else if (response.ok) {
      return { success: true };
    } else {
      const data = await response.json();
      return {
        success: false,
        message: data.message || "Error registering user. Please try again.",
      };
    }
  } catch (error) {
    console.error("Error registering user:", error);
    return {
      success: false,
      message: "Error registering user. Please try again.",
    };
  }
};

const RegisterScreen = ({ navigation }) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState("");

  const formik = useFormik({
    initialValues: {
      address: {
        streetNumber: "",
        postalCode: "",
        city: "",
      },
      username: "",
      password: "",
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      email: "",
      phone: "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      const { success, message } = await postNewUser(values);
      if (success) {
        setIsSubmitted(true);
      } else {
        setRegistrationMessage(message); // Set registration error message
      }
    },
  });

  const handleBackButton = () => {
    navigation.goBack();
  };

  if (isSubmitted) {
    return (
      <View style={styles.registrationSaved}>
        <Text>Account created successfully!</Text>
        <Text>Please login now.</Text>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => {
            setIsSubmitted(false);
            setRegistrationMessage("");
            navigation.navigate("Login"); // Navigate back to login screen
            formik.resetForm();
          }}
        >
          <Text style={styles.closeButtonText}>X</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"} // Adjust for iOS and Android
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollViewContainer}>
        <View style={styles.formWrapper}>
          <Text style={styles.title}>Register</Text>
          <View style={styles.form}>
            {[
              { name: "username", placeholder: "Username", type: "text" },
              { name: "password", placeholder: "Password", type: "password" },
              { name: "email", placeholder: "Email", type: "email-address" },
              { name: "firstName", placeholder: "First Name", type: "text" },
              { name: "lastName", placeholder: "Last Name", type: "text" },
              { name: "dateOfBirth", placeholder: "Date of Birth", type: "date", hint: "Format: YYYY-MM-DD" },
              { name: "phone", placeholder: "Phone Number", type: "phone-pad" },
              { name: "address.streetNumber", placeholder: "Street & Number", type: "text" },
              { name: "address.postalCode", placeholder: "Postal Code", type: "numeric" },
              { name: "address.city", placeholder: "City", type: "text" },
            ].map(({ name, placeholder, type, hint }) => {
              const fieldError = get(formik.errors, name);
              const fieldTouched = get(formik.touched, name);

              return (
                <View key={name} style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    name={name}
                    placeholder={placeholder}
                    value={get(formik.values, name)}
                    onChangeText={formik.handleChange(name)}
                    onBlur={formik.handleBlur(name)}
                    keyboardType={type === "numeric" ? "numeric" : "default"}
                    secureTextEntry={type === "password"}
                  />
                  {hint && <Text style={styles.hint}>{hint}</Text>}
                  {fieldTouched && fieldError && <Text style={styles.error}>{fieldError}</Text>}
                </View>
              );
            })}
            {registrationMessage && <Text style={styles.error}>{registrationMessage}</Text>}

            <TouchableOpacity style={styles.button} onPress={formik.handleSubmit}>
              <Text style={styles.buttonText}>Register</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={handleBackButton}>
              <Text style={styles.buttonText}>Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  scrollViewContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingBottom: 20, // padding to allow scrolling when the keyboard is visible
  },
  formWrapper: {
    alignItems: "center",
    width: "100%",
  },
  form: {
    width: "100%",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 15,
  },
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingLeft: 10,
  },
  button: {
    backgroundColor: "#5FC9C9",
    padding: 10,
    marginVertical: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
  error: {
    color: "red",
    fontSize: 12,
  },
  registrationSaved: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: "#5FC9C9",
    padding: 10,
    borderRadius: 5,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 18,
  },
  hint: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  }
  
});

export default RegisterScreen;
