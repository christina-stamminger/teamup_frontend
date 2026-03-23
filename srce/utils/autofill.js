import { Platform } from "react-native";

export const autofill = {
  username: Platform.select({
    ios: {
      textContentType: "username",
      autoComplete: undefined,
    },
    android: {
      textContentType: undefined,
      autoComplete: "username",
      importantForAutofill: "yes",
    },
    default: {},
  }),

  email: Platform.select({
    ios: {
      textContentType: "emailAddress",
      autoComplete: undefined,
    },
    android: {
      textContentType: undefined,
      autoComplete: "email",
      importantForAutofill: "yes",
    },
    default: {},
  }),

  password: Platform.select({
    ios: {
      textContentType: "password",
      autoComplete: undefined,
    },
    android: {
      textContentType: undefined,
      autoComplete: "password",
      importantForAutofill: "yes",
    },
    default: {},
  }),

  newPassword: Platform.select({
    ios: {
      textContentType: "newPassword",
      autoComplete: undefined,
      passwordRules:
        "minlength: 8; required: lower; required: upper; required: digit; required: special;",
    },
    android: {
      textContentType: undefined,
      autoComplete: "new-password",
      importantForAutofill: "yes",
    },
    default: {},
  }),

  confirmPassword: Platform.select({
    ios: {
      textContentType: "none",
      autoComplete: undefined,
    },
    android: {
      textContentType: undefined,
      autoComplete: "off",
      importantForAutofill: "no",
    },
    default: {},
  }),
};