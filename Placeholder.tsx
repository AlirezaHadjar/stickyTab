import React from "react";
import {
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  Platform,
  ColorValue,
} from "react-native";
import Animated, {
  Extrapolate,
  SharedValue,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { TabItemProps } from "./TabItem";

type PlaceholderProps = {
  translateX: number;
  tabTranslation: SharedValue<number>;
  index: number;
  onPress?: (translateX: number) => void;
  tabWidth: TabItemProps["tabWidth"];
  tabHeight: TabItemProps["tabHeight"];
  renderText: () => React.ReactNode;
  backgroundColor: ColorValue;
  containerPadding: number;
  borderRadius: number;
};

const styles = StyleSheet.create({
  container: {},
});

const AnimatedTouchable = Animated.createAnimatedComponent(Pressable);

export const Placeholder: React.FC<PlaceholderProps> = ({
  translateX,
  tabTranslation,
  index,
  onPress,
  tabHeight,
  tabWidth,
  renderText,
  backgroundColor,
  containerPadding,
  borderRadius,
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      tabTranslation.value,
      [(index - 1) * translateX, index * translateX, (index + 1) * translateX],
      [0.2, 0, 0.2],
      Extrapolate.CLAMP
    );

    return { opacity };
  });
  const textAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      tabTranslation.value,
      [(index - 1) * translateX, index * translateX, (index + 1) * translateX],
      [0, 1, 0],
      Extrapolate.CLAMP
    );

    return { opacity };
  });
  return (
    <>
      <AnimatedTouchable
        onPress={onPress?.bind("", translateX * index)}
        style={[
          {
            backgroundColor,
            zIndex: Platform.OS === "ios" ? -1 : 1,
            position: "absolute",
            width: tabWidth,
            height: tabHeight,
            borderRadius,
            top: containerPadding,
            start: containerPadding,
            transform: [{ translateX: translateX * index }],
          },
          animatedStyle,
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          {
            zIndex: 2,
            position: "absolute",
            width: tabWidth,
            height: tabHeight,
            top: containerPadding,
            start: containerPadding,
            transform: [{ translateX: translateX * index }],
            justifyContent: "center",
            alignItems: "center",
          },
          textAnimatedStyle,
        ]}
      >
        {renderText()}
      </Animated.View>
    </>
  );
};
