import React from "react";
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";

// Validation Schema
const validationSchema = Yup.object().shape({
  username: Yup.string().required("Username is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string().min(8, "Password must be at least 8 characters").required("Password is required"),
  firstName: Yup.string().required("First name is required"),
  lastName: Yup.string().required("Last name is required"),
  street: Yup.string().required("Street address is required"),
  postalCode: Yup.string().matches(/^[0-9]+$/, "Invalid postal code").required("Postal code is required"),
  city: Yup.string().required("City is required"),
  //dob: Yup.string().required("Date of birth is required"), // Using string for simplicity
  //dob: Yup.date().required('Date of birth is required').nullable(),
  dob: Yup.date()
  .required("Date of birth is required")
  .nullable()
  .max(new Date(new Date().setFullYear(new Date().getFullYear() - 12)), "You must be at least 12 years old"),

});

export default function RegisterForm({ navigation }) {
  const handleRegister = (values) => {
    Alert.alert(
      "Account Created Successfully",
      "You have registered successfully. Please log in now.",
      [{ text: "OK", onPress: () => navigation.replace("Login") }]
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 50} // Adjusts layout for keyboard
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView 
          contentContainerStyle={styles.container} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Formik
            initialValues={{
              username: "",
              email: "",
              password: "",
              firstName: "",
              lastName: "",
              street: "",
              postalCode: "",
              city: "",
              dob: "",
            }}
            validationSchema={validationSchema}
            onSubmit={handleRegister}
          >
            {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
              <View style={styles.form}>
                {/* Username */}
                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  value={values.username}
                  onChangeText={handleChange("username")}
                  onBlur={handleBlur("username")}
                />
                {touched.username && errors.username && <Text style={styles.errorText}>{errors.username}</Text>}

                {/* Email */}
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  value={values.email}
                  onChangeText={handleChange("email")}
                  onBlur={handleBlur("email")}
                  keyboardType="email-address"
                />
                {touched.email && errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

                {/* Password */}
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  value={values.password}
                  onChangeText={handleChange("password")}
                  onBlur={handleBlur("password")}
                  secureTextEntry
                />
                {touched.password && errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

                {/* First Name */}
                <TextInput
                  style={styles.input}
                  placeholder="First Name"
                  value={values.firstName}
                  onChangeText={handleChange("firstName")}
                  onBlur={handleBlur("firstName")}
                />
                {touched.firstName && errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}

                {/* Last Name */}
                <TextInput
                  style={styles.input}
                  placeholder="Last Name"
                  value={values.lastName}
                  onChangeText={handleChange("lastName")}
                  onBlur={handleBlur("lastName")}
                />
                {touched.lastName && errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}

                {/* Street Address */}
                <TextInput
                  style={styles.input}
                  placeholder="Street Address"
                  value={values.street}
                  onChangeText={handleChange("street")}
                  onBlur={handleBlur("street")}
                />
                {touched.street && errors.street && <Text style={styles.errorText}>{errors.street}</Text>}

                {/* Postal Code */}
                <TextInput
                  style={styles.input}
                  placeholder="Postal Code"
                  value={values.postalCode}
                  onChangeText={handleChange("postalCode")}
                  onBlur={handleBlur("postalCode")}
                  keyboardType="numeric"
                />
                {touched.postalCode && errors.postalCode && <Text style={styles.errorText}>{errors.postalCode}</Text>}

                {/* City */}
                <TextInput
                  style={styles.input}
                  placeholder="City"
                  value={values.city}
                  onChangeText={handleChange("city")}
                  onBlur={handleBlur("city")}
                />
                {touched.city && errors.city && <Text style={styles.errorText}>{errors.city}</Text>}

                {/* Date of Birth */}
                <TextInput
                  style={styles.input}
                  placeholder="Date of Birth (YYYY-MM-DD)"
                  value={values.dob}
                  onChangeText={handleChange("dob")}
                  onBlur={handleBlur("dob")}
                />
                {touched.dob && errors.dob && <Text style={styles.errorText}>{errors.dob}</Text>}

                {/* Submit Button */}
                <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                  <Text style={styles.buttonText}>Register</Text>
                </TouchableOpacity>

{/* Back to Login Button */}
<TouchableOpacity 
  style={[styles.button, { backgroundColor: "#D1D5DB", marginTop: 8 }]} 
  onPress={() => navigation.navigate("Login")}
>
  <Text style={[styles.buttonText, { color: "#333" }]}>Back to Login</Text>
</TouchableOpacity>


              </View>
            )}
          </Formik>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1, // Allows scrolling when keyboard is open
    padding: 20,
    backgroundColor: "#f7f7f7",
  },
  form: {
    width: "100%",
    paddingTop: 22,
  },
  input: {
    height: 48,
    borderColor: "#D1D5DB",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    marginVertical: 8,
  },
  button: {
    backgroundColor: "#5FC9C9",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginBottom: 8,
  },
});
