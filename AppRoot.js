import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  View,
  ActivityIndicator,
} from "react-native";

import * as SecureStore
  from "expo-secure-store";

import {
  useUser,
} from "./srce/components/context/UserContext";

import AuthNavigator
  from "./srce/components/AuthNavigator";

import AppStackNavigator
  from "./srce/components/AppStackNavigator";

import OnboardingScreen
  from "./srce/components/OnboardingScreen";


export default function AppRoot() {

  const {
    loading,
    authReady,
    accessToken,
    userId,
  } = useUser();


  const [
    onboardingChecked,
    setOnboardingChecked,
  ] = useState(false);

  const [
    hasSeenOnboarding,
    setHasSeenOnboarding,
  ] = useState(false);


  /*
   * Pro Account speichern.
   *
   * Dadurch sieht ein neuer Account auf demselben
   * Gerät das Onboarding ebenfalls.
   */
  const onboardingKey =
    userId
      ? `onboarding_seen_${userId}`
      : null;


  const checkOnboarding =
    useCallback(async () => {

      if (
        !accessToken ||
        !userId ||
        !onboardingKey
      ) {
        setOnboardingChecked(
          false
        );

        setHasSeenOnboarding(
          false
        );

        return;
      }


      try {

        const value =
          await SecureStore
            .getItemAsync(
              onboardingKey
            );


        setHasSeenOnboarding(
          value === "true"
        );

      } catch (error) {

        console.error(
          "Fehler beim Prüfen des Onboardings:",
          error
        );

        /*
         * Im Fehlerfall App nicht blockieren.
         */
        setHasSeenOnboarding(
          true
        );

      } finally {

        setOnboardingChecked(
          true
        );
      }

    }, [
      accessToken,
      userId,
      onboardingKey,
    ]);


  useEffect(() => {

    if (
      loading ||
      !authReady
    ) {
      return;
    }


    if (!accessToken) {

      setOnboardingChecked(
        false
      );

      setHasSeenOnboarding(
        false
      );

      return;
    }


    checkOnboarding();

  }, [
    loading,
    authReady,
    accessToken,
    checkOnboarding,
  ]);


  const handleOnboardingComplete =
    async () => {

      if (!onboardingKey) {
        return;
      }


      try {

        await SecureStore
          .setItemAsync(
            onboardingKey,
            "true"
          );

      } catch (error) {

        console.error(
          "Fehler beim Speichern des Onboardings:",
          error
        );
      }


      /*
       * UI trotzdem weiterlassen.
       */
      setHasSeenOnboarding(
        true
      );
    };


  /*
   * Auth wird initialisiert.
   */
  if (
    loading ||
    !authReady
  ) {

    return (
      <View
        style={{
          flex: 1,
          justifyContent:
            "center",
          alignItems:
            "center",
        }}
      >
        <ActivityIndicator
          size="large"
          color="#4FB6B8"
        />
      </View>
    );
  }


  /*
   * Nicht eingeloggt.
   */
  if (!accessToken) {
    return <AuthNavigator />;
  }


  /*
   * Eingeloggt, aber wir prüfen noch,
   * ob dieser Account das Onboarding
   * bereits gesehen hat.
   */
  if (
    !userId ||
    !onboardingChecked
  ) {

    return (
      <View
        style={{
          flex: 1,
          justifyContent:
            "center",
          alignItems:
            "center",
        }}
      >
        <ActivityIndicator
          size="large"
          color="#4FB6B8"
        />
      </View>
    );
  }


  /*
   * Erstes Login dieses Accounts
   * auf diesem Gerät.
   */
  if (!hasSeenOnboarding) {

    return (
      <OnboardingScreen
        onComplete={
          handleOnboardingComplete
        }
      />
    );
  }


  return (
    <AppStackNavigator />
  );
}