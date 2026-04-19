import { Platform } from "react-native";

export const autofill = {
  username: Platform.select({
    ios: {
      textContentType: "username",
      autoComplete: "username",
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
      textContentType: "none", // default is "emailAddress", but that causes issues with autofill on iOS 16.4+ where it doesn't trigger autofill suggestions at all. Setting it to "none" seems to fix the issue while still allowing autofill to work.
      autoComplete: "email",
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
      autoComplete: "current-password",
    },
    android: {
      textContentType: undefined,
      autoComplete: "current-password",
      importantForAutofill: "yes",
    },
    default: {},
  }),

  newPassword: Platform.select({
    ios: {
      textContentType: "newPassword",
      autoComplete: "new-password",
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