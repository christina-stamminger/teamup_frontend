import React, { useState, useCallback } from "react";
import { View, TextInput, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useFormik } from "formik";
import * as Yup from "yup";
import get from "lodash.get";
import { Eye, EyeOff } from "lucide-react-native";
import { Handshake } from "lucide-react-native";


// Validation Schema
// MVP: Validation Schema - nur 3 Felder
const validationSchema = Yup.object({
  username: Yup.string().required("Username is required."),
  email: Yup.string()
    .email("Please enter a valid email address.")
    .required("Email address is required."),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters.")
    .required("Password is required."),

  // MVP: Auskommentiert - werden später im Profil editiert
  /*
  address: Yup.object({
    streetNumber: Yup.string(),
    postalCode: Yup.string().length(4, "Postal Code must be exactly 4 characters long."),
    city: Yup.string(),
  }),
  firstName: Yup.string()
    .matches(
      /^[a-zA-Z\s'-]+$/,
      "First name can only contain letters, spaces, hyphens, and apostrophes."
    ),
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
  phone: Yup.string(),
  */
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
  const [showPassword, setShowPassword] = useState(false); // Password visibility

  // ✅ FIX: useCallback für toggle
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => {
      console.log('Toggle password from', prev, 'to', !prev); // DEBUG
      return !prev;
    });
  }, []);

  const formik = useFormik({
    initialValues: {
      username: "",
      email: "",
      password: "",

      // MVP: Auskommentiert
      /*
      address: {
        streetNumber: "",
        postalCode: "",
        city: "",
      },
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      phone: "",
      */
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      // MVP: Nur 3 Felder senden
      const userData = {
        username: values.username,
        email: values.email,
        password: values.password,
      };

      const { success, message } = await postNewUser(userData);
      if (success) {
        setIsSubmitted(true);
      } else {
        setRegistrationMessage(message);
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
      <ScrollView contentContainerStyle={styles.scrollViewContainer}

        keyboardShouldPersistTaps="handled" // ← THIS IS THE FIX
      >

        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.iconContainer}>
            <Handshake size={40} color="#fff" />
          </View>
          <Text style={styles.appName}>BringIt</Text>
        </View>

        <View style={styles.formWrapper}>
          <Text style={styles.title}>Register</Text>
          <View style={styles.form}>
            {/* MVP: Nur noch 3 Felder */}
            {[
              { name: "username", placeholder: "Username", type: "text" },
              { name: "email", placeholder: "Email", type: "email-address" },
              { name: "password", placeholder: "Password", type: "password" },

              // MVP: Auskommentiert - werden später im Profil editiert
              /*
              { name: "firstName", placeholder: "First Name (optional)", type: "text" },
              { name: "lastName", placeholder: "Last Name", type: "text" },
              { name: "dateOfBirth", placeholder: "Date of Birth", type: "date", hint: "Format: YYYY-MM-DD" },
              { name: "phone", placeholder: "Phone Number (optional)", type: "phone-pad" },
              { name: "address.streetNumber", placeholder: "Street & Number (optional)", type: "text" },
              { name: "address.postalCode", placeholder: "Postal Code (optional)", type: "numeric" },
              { name: "address.city", placeholder: "City (optional)", type: "text" },
              */
            ].map(({ name, placeholder, type, hint }) => {
              const fieldError = get(formik.errors, name);
              const fieldTouched = get(formik.touched, name);

              // 👉 Passwortfeld bekommt Icon
              if (name === "password") {
                return (
                  <View key={name} style={styles.inputContainer}>
                    <View style={styles.passwordContainer}>
                      <TextInput
                        style={styles.passwordInput}
                        name={name}
                        placeholder={placeholder}
                        value={get(formik.values, name)}
                        onChangeText={formik.handleChange(name)}
                        onFocus={() => console.log("PASSWORD got focus")}
                        onBlur={formik.handleBlur(name)}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none" // ← WICHTIG für Password!
                      />
                      <TouchableOpacity
                        onPress={togglePasswordVisibility}
                        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                        activeOpacity={0.7}
                        style={styles.eyeButton}
                      >
                        {showPassword ? (
                          <EyeOff size={22} color="#666" />
                        ) : (
                          <Eye size={22} color="#666" />
                        )}
                      </TouchableOpacity>
                    </View>
                    {fieldTouched && fieldError && (
                      <Text style={styles.error}>{fieldError}</Text>
                    )}
                  </View>
                );
              }

              // 👉 alle anderen Felder bleiben wie gehabt
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
                  {fieldTouched && fieldError && (
                    <Text style={styles.error}>{fieldError}</Text>
                  )}
                </View>
              );
            })}

            {registrationMessage && (
              <Text style={styles.error}>{registrationMessage}</Text>
            )}

            <TouchableOpacity style={styles.button} onPress={formik.handleSubmit}>
              <Text style={styles.buttonText}>Register</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.backButton} onPress={handleBackButton}>
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
    paddingBottom: 20,
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
    backgroundColor: "#fff",
    borderRadius: 8,
    height: 48,

  },
  input: {
    height: 48,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 10,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingRight: 10,
  },
  passwordInput: {
    flex: 1,
    height: 48,
    paddingLeft: 10,
  },
  eyeIconButton: {
    padding: 8, // ← größerer Touch-Bereich
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    backgroundColor: "#5FC9C9",
    padding: 10,
    marginVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
  backButton: {
    backgroundColor: "#e0e0e0",
    padding: 10,
    marginVertical: 10,
    borderRadius: 8,
    alignItems: "center",
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
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  iconContainer: {
    backgroundColor: "#5FC9C9",
    padding: 20,
    borderRadius: 50,
  },
});

export default RegisterScreen;
